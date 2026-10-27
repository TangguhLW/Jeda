import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, Check, Copy, Hourglass, Moon, RotateCcw, Sun, Menu, X, Bell, Bookmark } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import Calculator from './Calculator';
import { Button, IconButton, Modal } from './ui';
import { PersonalSidebar } from './PersonalSidebar';
import { LibraryPages } from './LibraryPages';
import { useLocalLibrary, localDateTime, timestamp, type Page, type Zone, type SavedDate, type HistoryItem } from './library';
import { useReminders } from './useReminders';
import GlassRefraction from './GlassRefraction';
import { useGlassMotion } from './useGlassMotion';
import { useThemeReveal } from './useThemeReveal';
import { answerQuestion, type TimeAnswer } from './questions';
import { formatDate } from './dates';
import './question.css';
import './personal.css';
import './ambient.css';
import { AmbientBackground } from './AmbientBackground';
import { PaletteToggle } from './PaletteToggle';
import TypingTitle from './TypingTitle';

const example = '7 Juli 2024 pukul 08:15:30 sampai 26 Oktober 2026 pukul 14:45:50, berapa hari, jam, menit, dan detik?';
const number = (n:number) => n.toLocaleString('id-ID');
export default function App() {
  return location.pathname.startsWith('/kalkulator') ? <Calculator/> : <QuestionHome/>;
}
function QuestionHome() {
  const root=useRef<HTMLDivElement>(null), input=useRef<HTMLTextAreaElement>(null);
  useGlassMotion(root);
  const reduced=useReducedMotion();
  const [dark,setDark]=useState(()=>{try{return localStorage.getItem('jeda-theme')==='dark'}catch{return false}});
  const [question,setQuestion]=useState(''), [answer,setAnswer]=useState<TimeAnswer|null>(null), [error,setError]=useState(''), [busy,setBusy]=useState(false), [copied,setCopied]=useState(false);
  const [page,setPage]=useState<Page>('Beranda'),[collapsed,setCollapsed]=useState(false),[drawer,setDrawer]=useState(false),[configured,setConfigured]=useState(false),[notice,setNotice]=useState('');
  const [saveKind,setSaveKind]=useState<'date'|'reminder'|null>(null),[saveTitle,setSaveTitle]=useState(''),[saveTime,setSaveTime]=useState(''),[saveZone,setSaveZone]=useState<Zone>('WIB'),[saveError,setSaveError]=useState('');
  const library=useLocalLibrary();
  const {permission,request}=useReminders(library.data,library.commit,title=>setNotice('Pengingat: '+title+' — waktunya tiba.'));
  const busyRef=useRef(false);
  const requestVersion=useRef(0);
  const {toggle,transitioning}=useThemeReveal(dark,setDark);
  useEffect(()=>{const controller=new AbortController();fetch('/api/status',{signal:controller.signal}).then(r=>r.json()).then(data=>setConfigured(data.configured===true)).catch(()=>{});return()=>controller.abort();},[]);
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';try{localStorage.setItem('jeda-theme',dark?'dark':'light')}catch{}},[dark]);
  const runQuestion=async(text:string)=>{
    if(busyRef.current||!text.trim())return;
    const version=++requestVersion.current;
    busyRef.current=true;
    setBusy(true);setError('');setCopied(false);setAnswer(null);
    const askedAt=new Date().toISOString();
    const id=crypto.randomUUID();
    library.commit(data=>({...data,history:[{id,question:text,askedAt,answer:null,error:'Jawaban belum selesai. Buka untuk mencoba lagi.'},...data.history]}));
    const saveResult=(result:TimeAnswer|null,message:string)=>library.commit(data=>{
      const item={id,question:text,askedAt,answer:result,error:message};
      return {...data,history:data.history.some(v=>v.id===id)?data.history.map(v=>v.id===id?item:v):[item,...data.history]};
    });
    try{const response=await answerQuestion(text);if(requestVersion.current===version){if(response.ok)setAnswer(response.answer);else{setAnswer(null);setError(response.message);}}saveResult(response.ok?response.answer:null,response.ok?'':response.message);}
    catch{const message='Jawaban belum bisa dibuat. Coba lagi; pertanyaanmu tetap ada.';if(requestVersion.current===version){setAnswer(null);setError(message);}saveResult(null,message);}
    finally{if(requestVersion.current===version){setBusy(false);busyRef.current=false;}}
  };
  const submit=(e?:FormEvent)=>{e?.preventDefault();void runQuestion(question);};
  const navigate=(next:Page)=>{setPage(next);setDrawer(false);};
  const newQuestion=()=>{requestVersion.current++;busyRef.current=false;setBusy(false);setQuestion('');setAnswer(null);setError('');navigate('Beranda');requestAnimationFrame(()=>input.current?.focus());};
  const openHistory=(item:HistoryItem)=>{requestVersion.current++;busyRef.current=false;setBusy(false);setQuestion(item.question);setAnswer(item.answer);setError(item.error);setCopied(false);navigate('Beranda');};
  const openSave=(kind:'date'|'reminder',item?:SavedDate)=>{setSaveKind(kind);setSaveTitle(item?.title||'');setSaveTime(item?.dateTime||localDateTime(Date.now()+3600000));setSaveZone(item?.zone||'WIB');setSaveError('');};
  const saveFromAnswer=(kind:'date'|'reminder')=>{if(answer)openSave(kind,{id:'',title:formatDate(answer.end.date),dateTime:answer.end.date+'T'+answer.end.time,zone:answer.end.zone as Zone,createdAt:''});};
  const saveEntry=(event:FormEvent)=>{event.preventDefault();const dueAt=timestamp(saveTime,saveZone);if(!saveTitle.trim()||!Number.isFinite(dueAt)){setSaveError('Isi nama dan tanggal/waktu yang valid.');return;}if(saveKind==='reminder'&&dueAt<=Date.now()){setSaveError('Pilih waktu pengingat di masa depan.');return;}const item={id:crypto.randomUUID(),title:saveTitle.trim(),dateTime:saveTime,zone:saveZone,createdAt:new Date().toISOString()};const saved=library.commit(data=>saveKind==='date'?{...data,dates:[item,...data.dates]}:{...data,reminders:[{...item,dueAt,status:'pending'},...data.reminders]});if(saved){setSaveKind(null);setNotice(saveKind==='date'?'Tanggal tersimpan di browser ini.':'Pengingat disimpan. Biarkan Jeda terbuka agar pengingat muncul tepat waktu.');}};
  const countDate=(item:SavedDate)=>{const now=localDateTime();const text=`${now.slice(0,10)} ${now.slice(11)} WIB ke ${item.dateTime.slice(0,10)} ${item.dateTime.slice(11)} ${item.zone}`;setQuestion(text);navigate('Beranda');void runQuestion(text);};
  const sidebar=(mobile=false)=><PersonalSidebar page={page} data={library.data} onNavigate={navigate} onNew={newQuestion} configured={configured} collapsed={collapsed} onCollapse={()=>setCollapsed(!collapsed)} mobile={mobile}/>;
  const duration=answer?`${number(answer.days)} hari, ${answer.hours} jam, ${answer.minutes} menit, ${answer.remainderSeconds} detik`:'';
  const copy=async()=>{if(!answer)return;try{await navigator.clipboard.writeText(`${answer.question}\n${duration}. Total ${number(answer.seconds)} detik.\n${answer.notes.join(' ')}`);setCopied(true)}catch{setError('Clipboard tidak tersedia. Kamu bisa memilih dan menyalin teks jawabannya.')}};
  return <div ref={root} className={`workspace question-workspace ${collapsed?'rail':''}`}><GlassRefraction/><AmbientBackground/>{sidebar()}<div className="question-home glass">
    <header className="question-header glass"><div className="personal-header-title"><span className="mobile-menu"><Dialog.Root open={drawer} onOpenChange={setDrawer}><Dialog.Trigger asChild><IconButton label="Buka navigasi"><Menu size={18}/></IconButton></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="modal-scrim"/><Dialog.Content className="mobile-drawer"><Dialog.Title className="sr-only">Navigasi Jeda</Dialog.Title><Dialog.Description className="sr-only">Beranda, tanggal, pengingat, dan riwayat.</Dialog.Description><Dialog.Close asChild><button className="drawer-close" aria-label="Tutup navigasi"><X size={18}/></button></Dialog.Close>{sidebar(true)}</Dialog.Content></Dialog.Portal></Dialog.Root></span><span className="personal-breadcrumb">Ruang pribadi <span aria-hidden="true">/</span></span><span>{page}</span></div><div className="appearance-actions"><PaletteToggle/><IconButton label={dark?'Gunakan tema terang':'Gunakan tema gelap'} onClick={toggle} aria-busy={transitioning}><motion.span key={String(dark)} initial={false} animate={{rotate:dark?180:0}} transition={{type:'spring',stiffness:320,damping:28}}>{dark?<Sun size={18}/>:<Moon size={18}/>}</motion.span></IconButton></div></header>
    <main className="question-scroll"><div className="question-content"><motion.div key={page} initial={reduced?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.4,ease:[.22,1,.36,1]}}>
      {library.error&&<p className="storage-error" role="alert">{library.error}</p>}
      {page==='Beranda'?<>
      <section className="question-intro"><p className="question-eyebrow">TANYAKAN TENTANG WAKTU</p><h1 aria-label="Berapa lama di antaranya?"><TypingTitle text="Berapa lama di antaranya?"/></h1><p>Dua tanggal, sampai detik terakhir.<br/>Tulis pertanyaanmu. Biar Jeda yang menghitung.</p></section>
      <form className="question-composer glass" onSubmit={submit} aria-label="Tanya selisih waktu"><label htmlFor="time-question" className="sr-only">Pertanyaan tentang waktu</label><textarea ref={input} id="time-question" value={question} maxLength={1200} onChange={e=>{setQuestion(e.target.value);setError('')}} placeholder="7 Juli 2024 ke 26 Oktober 2026, berapa hari, jam, menit, dan detik?" aria-invalid={!!error} aria-describedby={error?'question-error':'question-hint'} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void submit()}}}/><div className="composer-bottom"><span id="question-hint">Bisa sertakan jam, menit, dan detik.</span><IconButton type="submit" label="Hitung jawaban" disabled={busy||!question.trim()}>{busy?<Hourglass size={18}/>:<ArrowUp size={20}/>}</IconButton></div></form>
      <div className="question-support"><button type="button" onClick={()=>{setQuestion(example);setError('');input.current?.focus()}}>Coba contoh dengan jam <span aria-hidden="true">↗</span></button><span>Tanpa jam = 00:00:00 · Default WIB</span></div>
      {busy&&<p className="answer-pending" role="status">Menghitung selisih waktu…</p>}
      {error&&<div className="question-error" id="question-error" role="alert">{error}</div>}
      <AnimatePresence mode="wait" initial={false}>
      {answer?<motion.section key={answer.question} className="question-answer" aria-label="Jawaban" initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduced?0:.23}}><div className="answer-heading"><span><span className="answer-dot"/>JAWABAN</span><button aria-label={copied?'Jawaban disalin':'Salin jawaban'} onClick={copy}>{copied?<Check size={15}/>:<Copy size={15}/>}<span>{copied?'Disalin':'Salin'}</span></button></div><div role="status" aria-live="polite"><p className="answer-question">{answer.question}</p><h2 className="answer-duration">{duration}<span>.</span></h2><p className="answer-range">{formatDate(answer.start.date)}, {answer.start.time} {answer.start.zone}<span aria-hidden="true"> → </span>{formatDate(answer.end.date)}, {answer.end.time} {answer.end.zone}</p><dl className="answer-totals"><div><dt>Dalam jam</dt><dd>{number(Math.floor(answer.seconds/3600))} <small>jam</small></dd><p>+ {answer.minutes} menit {answer.remainderSeconds} detik</p></div><div><dt>Dalam menit</dt><dd>{number(Math.floor(answer.seconds/60))} <small>menit</small></dd><p>+ {answer.remainderSeconds} detik</p></div><div><dt>Total detik</dt><dd>{number(answer.seconds)} <small>detik</small></dd><p>Selisih waktu tepat</p></div></dl></div><div className="answer-notes">{answer.reversed&&<p>Waktu akhir mendahului waktu awal. Ditampilkan selisih positif.</p>}{answer.notes.map(note=><p key={note}>{note}</p>)}</div><button className="new-question" onClick={newQuestion}><RotateCcw size={14}/>Pertanyaan baru</button></motion.section>:!error&&!busy?<motion.div key="empty" className="answer-empty" exit={{opacity:0}}><span className="answer-empty-line"/><p>Jawabanmu akan muncul di sini.</p></motion.div>:null}
      </AnimatePresence>
      {answer&&<div className="answer-save-actions"><Button onClick={()=>saveFromAnswer('date')}><Bookmark size={15}/>Simpan tanggal akhir</Button><Button onClick={()=>saveFromAnswer('reminder')}><Bell size={15}/>Ingatkan saya</Button></div>}
      </>:<LibraryPages key={page} page={page} data={library.data} onCreate={kind=>openSave(kind)} onDelete={(kind,id)=>{if(library.commit(data=>({...data,[kind]:data[kind].filter(item=>item.id!==id)})))setNotice('Dihapus dari browser ini.');}} onOpen={openHistory} onCount={countDate} onRemind={item=>openSave('reminder',item)} onDone={item=>{library.commit(data=>({...data,reminders:data.reminders.map(v=>v.id===item.id?{...v,status:'done'}:v)}));}} onPermission={()=>void request()} permission={permission}/>}
    </motion.div><footer className="question-footer"><span>Tersimpan di browser ini. Tanpa login.</span><a href="/kalkulator">Kalkulator lengkap ↗</a></footer></div></main>
  </div>
  <Modal open={saveKind!==null} onOpenChange={open=>{if(!open)setSaveKind(null);}} title={saveKind==='reminder'?'Buat pengingat':'Simpan tanggal'} description={saveKind==='reminder'?'Muncul saat Jeda terbuka. Yang terlewat muncul saat kamu kembali.':'Simpan tanggal dan waktu di browser ini.'}><form className="personal-save-form" onSubmit={saveEntry}><label className="field"><span>Nama {saveKind==='reminder'?'pengingat':'tanggal'}</span><input required maxLength={100} value={saveTitle} onChange={e=>setSaveTitle(e.target.value)} placeholder="Misalnya, ulang tahun atau tenggat"/></label><label className="field"><span>Tanggal dan waktu</span><input required type="datetime-local" step="1" min="1000-01-01T00:00:00" max="9999-12-31T23:59:59" value={saveTime} onChange={e=>setSaveTime(e.target.value)} aria-invalid={!!saveError} aria-describedby={saveError?'save-error':undefined}/></label><label className="field"><span>Zona waktu</span><select aria-label="Zona waktu" value={saveZone} onChange={e=>setSaveZone(e.target.value as Zone)}><option value="WIB">WIB · UTC+7</option><option value="WITA">WITA · UTC+8</option><option value="WIT">WIT · UTC+9</option><option value="UTC">UTC</option></select></label>{saveError&&<p id="save-error" className="storage-error" role="alert">{saveError}</p>}<div className="modal-actions"><Button type="button" onClick={()=>setSaveKind(null)}>Batal</Button><Button type="submit" variant="primary">{saveKind==='reminder'?'Simpan pengingat':'Simpan tanggal'}</Button></div></form></Modal>
  {notice&&<div className="toast" role="status"><Bell size={16}/><span>{notice}</span>{notice.startsWith('Pengingat:')&&<button className="toast-link" onClick={()=>{navigate('Pengingat');setNotice('');}}>Lihat</button>}<button aria-label="Tutup notifikasi" onClick={()=>setNotice('')}><X size={16}/></button></div>}
  </div>;
}



