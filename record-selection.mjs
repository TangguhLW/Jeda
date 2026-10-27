import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:'recordings',size:{width,height:900}}});const page=await context.newPage();await page.goto('http://127.0.0.1:4796');await page.waitForTimeout(500);
 for(const interval of [500,110])for(const name of ['Geser tanggal','Hitung mundur','Selisih tanggal','Hitung mundur','Geser tanggal','Selisih tanggal']){await page.getByRole('button',{name,exact:true}).evaluate(e=>e.click());await page.waitForTimeout(interval)}
 if(width>850)for(const name of ['Tersimpan','Kalkulator','Tersimpan','Kalkulator']){await page.getByRole('navigation',{name:'Navigasi utama'}).getByRole('button',{name:new RegExp('^'+name)}).click();await page.waitForTimeout(450)}
 await page.waitForTimeout(600);const video=page.video();await context.close();await video.saveAs(`recordings/selection-glide-${width}.webm`);
}await browser.close();
