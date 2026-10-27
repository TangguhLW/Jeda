import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const contrast=[];
for(const width of [1440,390]) {
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:'recordings',size:{width,height:900}}});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4796/');await page.getByLabel('Pertanyaan tentang waktu').fill('7 Juli 2024 ke 26 Oktober 2026, berapa lama?');
 await page.waitForTimeout(2200);await page.screenshot({path:`evidence/ambient-pink-light-${width}.png`});
 await page.waitForTimeout(4200);await page.getByLabel('Gunakan biru pastel').click();await page.waitForTimeout(650);await page.screenshot({path:`evidence/ambient-blue-light-${width}.png`});
 await page.getByLabel('Gunakan tema gelap').click();await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition','running');await page.waitForTimeout(1800);await page.screenshot({path:`evidence/ambient-blue-dark-${width}.png`});
 await page.getByLabel('Gunakan pink pastel').click();await page.waitForTimeout(650);await page.screenshot({path:`evidence/ambient-pink-dark-${width}.png`});await page.waitForTimeout(3000);
 if(width===1440)for(const theme of ['dark','light']) {
  if(theme==='light'){await page.getByLabel('Gunakan tema terang').click();await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition','running');}
  for(const palette of ['pink','blue']) {
   const current=await page.locator('html').getAttribute('data-palette');if(current!==palette)await page.getByLabel(palette==='pink'?'Gunakan pink pastel':'Gunakan biru pastel').click();
   contrast.push(await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);const lum=h=>{const c=h.trim().replace('#','');return [0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);};const ratio=(a,b)=>{a=lum(a);b=lum(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};return {theme:document.documentElement.dataset.theme,palette:document.documentElement.dataset.palette,ratios:['--surface-canvas','--surface-primary','--surface-secondary'].map(key=>({surface:key,muted:ratio(s.getPropertyValue('--text-muted'),s.getPropertyValue(key)),primary:ratio(s.getPropertyValue('--text-primary'),s.getPropertyValue(key))}))};}));
  }
 }
 const video=page.video();await context.close();await video.saveAs(`recordings/ambient-pastel-${width}.webm`);
}
await writeFile('evidence/pastel-contrast.json',JSON.stringify(contrast,null,2));await browser.close();console.log('Pastel screenshots, contrast ratios, and real motion recordings saved.');
