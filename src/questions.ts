import { parseDate } from './dates';

const months = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
const offsets: Record<string, number> = { WIB: 7, WITA: 8, WIT: 9, UTC: 0 };
const datePattern = /(?:(\d{4})-(\d{2})-(\d{2})|(\d{1,2})[/.](\d{1,2})[/.](\d{4})|(\d{1,2})\s*(januari|jan|februari|feb|maret|mar|april|apr|mei|juni|jun|juli|jul|agustus|agu|ags|september|sep|sept|oktober|okt|november|nov|desember|des)(?:\s*(\d{4}))?)/gi;
type Endpoint = { stamp: number; date: string; time: string; zone: string; assumedTime: boolean };
export type TimeAnswer = { question: string; start: Endpoint; end: Endpoint; seconds: number; days: number; hours: number; minutes: number; remainderSeconds: number; notes: string[]; reversed: boolean };
export type QuestionResult = { ok: true; answer: TimeAnswer } | { ok: false; message: string };

export function calculateQuestion(question: string): QuestionResult {
  const text = question.trim();
  if (!text) return { ok: false, message: 'Tulis dua tanggal yang ingin kamu bandingkan.' };
  const found = [...text.matchAll(datePattern)];
  if (found.length !== 2) return { ok: false, message: 'Tulis tepat dua tanggal, misalnya “7 Juli 2024 ke 26 Oktober 2026”. Kamu juga bisa menambahkan pukul 08:15:30 pada masing-masing tanggal.' };
  const yearOf = (m: RegExpMatchArray) => m[1] || m[6] || m[9];
  const sharedYear = yearOf(found[0]) || yearOf(found[1]);
  if (!sharedYear) return { ok: false, message: 'Tahunnya belum disebut. Tambahkan tahun agar hitungan tidak salah, misalnya 7 Juli 2026 ke 26 Oktober 2026.' };
  const notes: string[] = [];
  const defaultZone = text.match(/\b(WITA|WIB|WIT|UTC)\b/i)?.[1].toUpperCase() || 'WIB';
  const endpoints: Endpoint[] = [];
  for (let i = 0; i < found.length; i++) {
    const m = found[i];
    const year = yearOf(m) || sharedYear;
    const month = m[2] || m[5] || String(months.findIndex(name => name.startsWith(m[8].toLowerCase().slice(0,3).replace("ags","agu"))) + 1);
    const day = m[3] || m[4] || m[7];
    const date = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    if (!parseDate(date)) return { ok: false, message: 'Ada tanggal yang tidak valid. Periksa jumlah hari dalam bulan dan tahunnya.' };
    const suffix = text.slice(m.index! + m[0].length, i === 0 ? found[1].index : undefined);
    const timeMatch = suffix.match(/(?:\bpukul\s*|\bjam\s*|\bT)?(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/i);
    if (/\b(?:pukul|jam)\s*\d/i.test(suffix) && !timeMatch) return { ok: false, message: 'Tulis waktu dengan format HH:MM atau HH:MM:SS, misalnya pukul 08:15:30.' };
    const h = Number(timeMatch?.[1] || 0), min = Number(timeMatch?.[2] || 0), sec = Number(timeMatch?.[3] || 0);
    if (h > 23 || min > 59 || sec > 59) return { ok: false, message: 'Waktu tidak valid. Jam 00–23, menit dan detik 00–59.' };
    const zone = suffix.match(/\b(WITA|WIB|WIT|UTC)\b/i)?.[1].toUpperCase() || defaultZone;
    const time = [h,min,sec].map(v => String(v).padStart(2,'0')).join(':');
    endpoints.push({ stamp: +new Date(`${date}T${time}Z`) - offsets[zone]*3600000, date, time, zone, assumedTime: !timeMatch });
    if (!yearOf(m)) notes.push(`Tahun tanggal ${i === 0 ? 'awal' : 'akhir'} diasumsikan ${year}, mengikuti tanggal lainnya.`);
  }
  if (endpoints.some(e => e.assumedTime)) notes.push('Tanggal tanpa jam memakai 00:00:00.');
  if (!/\b(WITA|WIB|WIT|UTC)\b/i.test(text)) notes.push('Zona waktu memakai WIB (UTC+7).');
  if (/inklusif|sertakan.*(?:akhir|tanggal)|termasuk.*(?:akhir|tanggal)/i.test(text)) return { ok: false, message: 'Untuk durasi sampai detik, hitungan memakai selisih waktu tepat. Hapus permintaan inklusif, atau gunakan kalkulator tanggal untuk hitungan hari inklusif.' };
  const [start,end] = endpoints;
  const seconds = Math.abs((end.stamp-start.stamp)/1000);
  return { ok: true, answer: { question:text, start,end,seconds,days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),minutes:Math.floor(seconds%3600/60),remainderSeconds:seconds%60,notes,reversed:end.stamp<start.stamp } };
}

export async function answerQuestion(question: string): Promise<QuestionResult> {
  const local=calculateQuestion(question);
  if(local.ok || !question.trim())return local;
  try {
    const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,now:new Date().toISOString()}),signal:AbortSignal.timeout(25000)});
    const data=await response.json();
    if(!response.ok){if(data.error==='not_configured')return local;return {ok:false,message:typeof data.message==='string'?data.message:'Gemini belum bisa menjawab. Coba lagi.'};}
    if(data.kind==='clarify'&&typeof data.message==='string')return {ok:false,message:data.message.slice(0,400)};
    return answerFromEndpoints(question,data.start,data.end,data.notes);
  } catch {
    return {ok:false,message:local.message+' Layanan bahasa bebas belum dapat dihubungi. Coba lagi atau tulis dua tanggal lengkap.'};
  }
}

export function answerFromEndpoints(question:string,start:{date:string;time:string;zone:string},end:{date:string;time:string;zone:string},notes:unknown):QuestionResult {
  const valid=(value:typeof start)=>value&&parseDate(value.date)&&/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value.time)&&Object.hasOwn(offsets,value.zone);
  if(!valid(start)||!valid(end)||!Array.isArray(notes)||notes.some(v=>typeof v!=='string'||v.length>250))return {ok:false,message:'Tanggal hasil interpretasi belum valid. Perjelas pertanyaannya.'};
  const result=calculateQuestion(`${start.date} ${start.time} ${start.zone} ke ${end.date} ${end.time} ${end.zone}`);
  if(!result.ok)return result;
  return {ok:true,answer:{...result.answer,question,notes:notes.slice(0,6)}};
}

