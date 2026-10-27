import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:'recordings',size:{width,height:900}}});const page=await context.newPage();await page.goto('http://127.0.0.1:4796/');await page.waitForTimeout(500);
 await page.getByLabel('Gunakan tema gelap').click();await page.waitForTimeout(950);await page.getByLabel('Gunakan tema terang').click();await page.waitForTimeout(950);
 for(const name of ['Geser tanggal','Hitung mundur','Selisih tanggal']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(450)}
 await page.getByLabel('Sertakan tanggal akhir',{exact:true}).check();await page.waitForTimeout(400);await page.getByRole('button',{name:'Simpan hitungan',exact:true}).click();await page.waitForTimeout(300);await page.keyboard.press('Escape');await page.waitForTimeout(300);
 const video=page.video();await context.close();await video.saveAs(`recordings/framer-motion-${width}.webm`);
}await browser.close();
