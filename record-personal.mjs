import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});
for(const width of [320,390,768,1024,1440]) {
 const video=[390,1440].includes(width);
 const context=await browser.newContext({viewport:{width,height:900},...(video?{recordVideo:{dir:'recordings',size:{width,height:900}}}:{})});
 await context.addInitScript(()=>{
  const date={id:'synthetic-date',title:'Tanggal penting proyek pribadi',dateTime:'2027-07-07T14:15:30',zone:'WIB',createdAt:'2026-10-27T00:00:00Z'};
  const reminder={...date,id:'synthetic-reminder',title:'Tinjau rencana pekan depan',dueAt:Date.parse('2027-07-07T07:15:30Z'),status:'pending'};
  localStorage.setItem('jeda-library-v1',JSON.stringify({dates:[date],reminders:[reminder],history:[]}));
 });
 const page=await context.newPage();await page.goto('http://127.0.0.1:4796/');await page.getByRole('button',{name:'Coba contoh dengan jam'}).click();await page.getByRole('button',{name:'Hitung jawaban'}).click();
 for(const theme of video?['light','dark']:['light']) {
  if(theme==='dark'){await page.getByLabel('Gunakan tema gelap').click();await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition','running');}
  for(const name of ['Beranda','Tanggal tersimpan','Pengingat','Riwayat']) {
   if(width<=850)await page.getByLabel('Buka navigasi').click();
   await page.getByRole('navigation',{name:'Navigasi utama'}).getByRole('button',{name:new RegExp('^'+name)}).click();
   await expect(page.locator('.question-content>div')).toHaveCSS('opacity','1');
   if(!await page.locator('.question-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1))throw Error(`Overflow ${name} ${width}`);
   await page.screenshot({path:`evidence/personal-${name.replaceAll(' ','-')}-${theme}-${width}.png`});
  }
 }
 if(width<=850){await page.getByLabel('Buka navigasi').click();await page.screenshot({path:`evidence/personal-drawer-${width}.png`});await page.keyboard.press('Escape');}
 const recording=page.video();await context.close();if(recording)await recording.saveAs(`recordings/personal-${width}.webm`);
}
await browser.close();console.log('Personal pages: no horizontal overflow at all five widths; desktop/mobile recordings saved.');
