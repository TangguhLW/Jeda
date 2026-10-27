import {useCallback,useEffect,useRef,useState} from 'react';
import {parseDate} from './dates';
import type {TimeAnswer} from './questions';
export type Page='Beranda'|'Tanggal tersimpan'|'Pengingat'|'Riwayat';
export type Zone='WIB'|'WITA'|'WIT'|'UTC';
export type SavedDate={id:string;title:string;dateTime:string;zone:Zone;createdAt:string};
export type Reminder=SavedDate&{status:'pending'|'fired'|'done';dueAt:number};
export type HistoryItem={id:string;question:string;askedAt:string;answer:TimeAnswer|null;error:string};
export type Library={dates:SavedDate[];reminders:Reminder[];history:HistoryItem[]};
export const libraryKey='jeda-library-v1';
const empty=():Library=>({dates:[],reminders:[],history:[]});
const zones:Record<Zone,number>={WIB:7,WITA:8,WIT:9,UTC:0};
export function timestamp(dateTime:string,zone:Zone):number {
  const [date,time='']=dateTime.split('T');
  if(!parseDate(date)||!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)||!Object.hasOwn(zones,zone))return NaN;
  return +new Date(`${date}T${time.length===5?time+':00':time}Z`)-zones[zone]*3600000;
}
export function localDateTime(now=Date.now(),zone:Zone='WIB') {return new Date(now+zones[zone]*3600000).toISOString().slice(0,19);}
export function displayDateTime(dateTime:string,zone:Zone) {
  const n=timestamp(dateTime,zone);if(!Number.isFinite(n))return 'Waktu tidak valid';
  const iso=localDateTime(n,zone);
  return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(iso+'Z'))+' · '+iso.slice(11)+' '+zone;
}
function decode(raw:string|null):Library {
  if(!raw)return empty();const value=JSON.parse(raw);
  if(!value||!['dates','reminders','history'].every(k=>Array.isArray(value[k])))throw Error('invalid');
  const validDate=(v:SavedDate)=>v&&typeof v.id==='string'&&typeof v.title==='string'&&typeof v.dateTime==='string'&&Number.isFinite(timestamp(v.dateTime,v.zone));
  return {dates:value.dates.filter(validDate),reminders:value.reminders.filter((v:Reminder)=>validDate(v)&&['pending','fired','done'].includes(v.status)&&v.dueAt===timestamp(v.dateTime,v.zone)),history:value.history.filter((v:HistoryItem)=>v&&typeof v.id==='string'&&typeof v.question==='string'&&typeof v.askedAt==='string'&&typeof v.error==='string'&&(!v.answer||(validAnswer(v.answer))))};
}
function validAnswer(v:TimeAnswer) {return v.start&&v.end&&Number.isFinite(timestamp(v.start.date+'T'+v.start.time,v.start.zone as Zone))&&Number.isFinite(timestamp(v.end.date+'T'+v.end.time,v.end.zone as Zone))&&Number.isFinite(v.seconds)&&Array.isArray(v.notes)&&v.notes.every(note=>typeof note==='string');}
export function useLocalLibrary() {
  const [error,setError]=useState('');
  const [data,setData]=useState<Library>(()=>{try{return decode(localStorage.getItem(libraryKey));}catch{return empty();}});
  const current=useRef(data);
  const [readable,setReadable]=useState(true);
  useEffect(()=>{try{decode(localStorage.getItem(libraryKey));}catch{setError('Data browser belum bisa dibaca. Penyimpanan dihentikan agar data lama tidak tertimpa.');setReadable(false);}},[]);
  const commit=useCallback((update:(data:Library)=>Library)=>{
    if(!readable){setError('Penyimpanan belum tersedia. Periksa izin atau data situs browser ini.');return false;}
    const next=update(current.current);
    try{localStorage.setItem(libraryKey,JSON.stringify(next));current.current=next;setData(next);setError('');return true;}
    catch{setError('Data belum tersimpan. Penyimpanan browser penuh atau tidak diizinkan.');return false;}
  },[readable]);
  useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key!==libraryKey&&e.key!==null)return;try{const next=decode(e.newValue);current.current=next;setData(next);setReadable(true);setError('');}catch{setReadable(false);setError('Data dari tab lain tidak valid. Penyimpanan dihentikan.');}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  return {data,commit,error};
}
