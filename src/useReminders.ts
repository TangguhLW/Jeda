import {useEffect,useRef,useState} from 'react';
import type {Library} from './library';
export function useReminders(data:Library,commit:(update:(data:Library)=>Library)=>boolean,onDue:(title:string)=>void) {
  const latest=useRef({data,commit,onDue});latest.current={data,commit,onDue};
  const [permission,setPermission]=useState<string>(()=>typeof Notification==='undefined'?'unsupported':Notification.permission);
  useEffect(()=>{
    const delivered=new Set<string>();
    const check=()=>{
      const {data,commit,onDue}=latest.current;
      const due=data.reminders.filter(item=>item.status==='pending'&&!delivered.has(item.id)&&item.dueAt<=Date.now());
      if(!due.length)return;
      if(!commit(previous=>({...previous,reminders:previous.reminders.map(item=>due.some(d=>d.id===item.id)?{...item,status:'fired'}:item)})))return;
      due.forEach(item=>delivered.add(item.id));
      for(const item of due){onDue(item.title);try{if(typeof Notification!=='undefined'&&Notification.permission==='granted')new Notification('Jeda · '+item.title,{body:'Waktunya tiba. Buka Jeda untuk melihat pengingat.',tag:item.id});}catch{/* In-app delivery remains available when the browser rejects a notification. */}}
    };
    check();const timer=window.setInterval(check,1000);
    window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);
    return()=>{clearInterval(timer);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
  },[]);
  const request=async()=>{if(typeof Notification==='undefined')return;try{setPermission(await Notification.requestPermission());}catch{setPermission(Notification.permission);}};
  return {permission,request};
}
