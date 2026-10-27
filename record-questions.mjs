import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome'});
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900},recordVideo:{dir:'recordings',size:{width,height:900}}});const page=await context.newPage();await page.goto('http://127.0.0.1:4796/');await page.waitForTimeout(600);await page.screenshot({path:`evidence/question-empty-${width}.png`});await page.getByRole('button',{name:'Coba contoh dengan jam'}).click();await page.getByRole('button',{name:'Hitung jawaban'}).click();await page.waitForTimeout(500);await page.locator('.answer-totals').scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.getByLabel('Gunakan tema gelap').click();await page.waitForTimeout(900);const video=page.video();await context.close();await video.saveAs(`recordings/question-answer-${width}.webm`);
}await browser.close();
