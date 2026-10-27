import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome'});
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:'recordings',size:{width,height:900}}});const page=await context.newPage();await page.goto('http://127.0.0.1:4796');await page.getByLabel('Gunakan tema gelap').click();await page.getByRole('button',{name:'Geser tanggal',exact:true}).click();await page.getByRole('button',{name:'Hitung mundur',exact:true}).click();await page.getByRole('button',{name:'Selisih tanggal',exact:true}).click();await page.getByRole('button',{name:'Simpan hitungan',exact:true}).click();await page.getByRole('textbox',{name:'Nama hitungan',exact:true}).fill('Cerita pertama');await page.keyboard.press('Escape');if(width===390){await page.getByLabel('Buka navigasi').click();await page.keyboard.press('Escape');}const video=page.video();await page.waitForTimeout(500);await context.close();await video.saveAs(`recordings/jeda-${width}.webm`);
}
const page=await browser.newPage();await page.goto('http://127.0.0.1:4796');
const contrast=[];
for(const dark of [false,true]){
 if(dark)await page.getByLabel('Gunakan tema gelap').click();
 contrast.push(await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);const rgb=(h)=>{h=h.trim().replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255)};const lum=(c)=>c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);const ratio=(a,b)=>{const x=lum(rgb(a)),y=lum(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};const t=s.getPropertyValue('--text-muted'),p=s.getPropertyValue('--text-primary');return {theme:document.documentElement.dataset.theme,ratios:['--surface-primary','--surface-secondary','--surface-canvas'].map(k=>({surface:k,muted:ratio(t,s.getPropertyValue(k)),primary:ratio(p,s.getPropertyValue(k))}))}}));
}
fs.writeFileSync('evidence/contrast.json',JSON.stringify(contrast,null,2));await browser.close();

