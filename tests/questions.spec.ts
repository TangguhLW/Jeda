import {test,expect} from './fixtures';
import {calculateQuestion} from '../src/questions';
test('precise dates, explicit seconds, omitted years and zones',()=>{
 const sample=calculateQuestion('7 Juli 2024 pukul 08:15:30 sampai 26 Oktober 2026 pukul 14:45:50');expect(sample.ok).toBe(true);if(sample.ok){expect(sample.answer).toMatchObject({days:841,hours:6,minutes:30,remainderSeconds:20,seconds:72685820})}
 const ordinary=calculateQuestion('7 Juni 2024 ke 26 Oktober 2026 berapa hari');expect(ordinary.ok&&ordinary.answer.seconds).toBe(871*86400);
 const inferred=calculateQuestion('7juli ke 26oktober2026');expect(inferred.ok&&inferred.answer.days).toBe(111);expect(inferred.ok&&inferred.answer.notes.join()).toContain('diasumsikan 2026');
 const leap=calculateQuestion('28 Februari 2024 23:59:59 sampai 1 Maret 2024 00:00:01');expect(leap.ok&&leap.answer.seconds).toBe(86402);
 const zones=calculateQuestion('7 Juli 2026 08:00:00 WIB ke 7 Juli 2026 08:00:00 WITA');expect(zones.ok&&zones.answer.seconds).toBe(3600);
 const numeric=calculateQuestion('07/07/2026 08:15:30 ke 07/07/2026 08:15:31');expect(numeric.ok&&numeric.answer.seconds).toBe(1);
 expect(calculateQuestion('31 Februari 2026 ke 1 Maret 2026').ok).toBe(false);
 expect(calculateQuestion('7 Juli ke 26 Oktober').ok).toBe(false);
 expect(calculateQuestion('7 Juli 2026 25:00 ke 26 Oktober 2026').ok).toBe(false);
 expect(calculateQuestion('7 Juli 2026 08:61:00 ke 26 Oktober 2026').ok).toBe(false);
 expect(calculateQuestion('7 Juli 2026 ke 26 Oktober 2026 inklusif').ok).toBe(false);
 expect(calculateQuestion('halo').ok).toBe(false);
 const zero=calculateQuestion('7 Juli 2026 08:00 ke 7 Juli 2026 08:00');expect(zero.ok&&zero.answer.seconds).toBe(0);
 const reverse=calculateQuestion('26 Oktober 2026 ke 7 Juli 2026');expect(reverse.ok&&reverse.answer.reversed).toBe(true);
});
test('simple question and answer workflow',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByText('Jawabanmu akan muncul di sini.')).toBeVisible();await expect(page.locator('.question-workspace>.sidebar')).toBeVisible();
 await page.getByRole('button',{name:'Coba contoh dengan jam'}).click();await page.getByRole('button',{name:'Hitung jawaban'}).click();await expect(page.locator('.answer-duration')).toContainText('841 hari, 6 jam, 30 menit, 20 detik');await expect(page.locator('.answer-totals')).toContainText('72.685.820');
  await page.getByRole('region',{name:'Jawaban',exact:true}).getByRole('button',{name:'Pertanyaan baru'}).click();await expect(page.getByLabel('Pertanyaan tentang waktu')).toBeFocused();await page.getByLabel('Pertanyaan tentang waktu').fill('7 Juli ke 26 Oktober');await page.getByLabel('Pertanyaan tentang waktu').press('Enter');await expect(page.getByRole('alert')).toContainText('Tahunnya belum disebut');
 await page.getByLabel('Pertanyaan tentang waktu').fill('7 Juli 2026 pukul 01:02:03 ke 7 Juli 2026 pukul 01:02:04');await page.getByLabel('Pertanyaan tentang waktu').press('Enter');await expect(page.locator('.answer-duration')).toContainText('0 hari, 0 jam, 0 menit, 1 detik');expect(errors).toEqual([]);
});
for(const width of [320,390,768,1024,1440])for(const theme of ['light','dark'])test(`question layout ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');if(theme==='dark'){await page.getByLabel('Gunakan tema gelap').click();await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition','running')}
 await page.getByRole('button',{name:'Coba contoh dengan jam'}).click();await page.getByRole('button',{name:'Hitung jawaban'}).click();await expect(page.locator('.question-answer')).toHaveCSS('opacity','1');expect(await page.locator('.question-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`evidence/question-${theme}-${width}.png`});
});
test('short screen, enlarged text and keyboard',async({page})=>{
 await page.setViewportSize({width:390,height:560});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'Coba contoh dengan jam'}).click();await page.getByLabel('Pertanyaan tentang waktu').press('Enter');await expect(page.locator('.answer-duration')).toBeVisible();
 await page.evaluate(()=>{const elements=Array.from(document.querySelectorAll<HTMLElement>('.question-content *'));const sizes=elements.map(e=>parseFloat(getComputedStyle(e).fontSize));elements.forEach((e,i)=>e.style.fontSize=sizes[i]*2+'px')});expect(await page.locator('.question-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.locator('.question-footer').scrollIntoViewIfNeeded();await expect(page.locator('.question-footer')).toBeInViewport();
});

