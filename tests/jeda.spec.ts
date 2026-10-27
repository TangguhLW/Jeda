import {test,expect} from './fixtures';
import {difference,offsetDate,parseDate} from '../src/dates';
test('calendar edge cases',()=>{
 expect(difference('2024-06-07','2026-10-26')?.days).toBe(871);
 expect(difference('2024-06-07','2026-10-26',true)?.days).toBe(872);
 expect(difference('2026-10-26','2024-06-07')?.days).toBe(871);
 expect(difference('2024-02-28','2024-03-01')?.days).toBe(2);
 expect(difference('2024-06-07','2024-06-10')).toMatchObject({days:3,workdays:1,weekends:2});
 expect(difference('2024-06-08','2024-06-08',true)?.workdays).toBe(0);
 expect(difference('2024-06-07','2024-06-07')?.days).toBe(0);
 expect(difference('2024-01-31','2024-02-29')).toMatchObject({years:0,months:1,remainder:0});
 expect(offsetDate('2024-02-28',2)).toBe('2024-03-01');
 expect(offsetDate('2024-03-01',-2)).toBe('2024-02-28');
 expect(parseDate('2024-02-30')).toBeNull();expect(offsetDate('2024-01-01',.5)).toBe('');
});
test('calculator, persistence, search, dialogs, invalid input',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/kalkulator');await expect(page.locator('.result-number strong')).toHaveText('871');
 await page.getByLabel('Sertakan tanggal akhir',{exact:true}).check();await expect(page.locator('.result-number strong')).toHaveText('872');
 await page.getByRole('button',{name:'Tukar tanggal',exact:true}).click();await expect(page.locator('.result-number strong')).toHaveText('872');
 const trigger=page.getByRole('button',{name:'Simpan hitungan',exact:true});await trigger.click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('textbox',{name:'Nama hitungan',exact:true})).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(trigger).toBeFocused();
 await trigger.click();await page.getByRole('textbox',{name:'Nama hitungan',exact:true}).fill('Contoh momen penting');await page.getByRole('dialog').getByRole('button',{name:'Simpan hitungan'}).click();
 await page.getByRole('button',{name:/^Tersimpan/}).click();await expect(page.getByText('Contoh momen penting',{exact:true})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:/^Tersimpan/}).click();await expect(page.getByText('Contoh momen penting',{exact:true})).toBeVisible();
 await page.getByLabel('Cari hitungan').fill('tidak-ada');await expect(page.getByText('Belum ketemu.')).toBeVisible();await page.getByRole('button',{name:'Hapus pencarian'}).click();
 await page.getByRole('button',{name:'Hapus Contoh momen penting'}).click();await expect(page.getByText('Cerita pertamamu dimulai di sini.')).toBeVisible();
 await page.getByRole('button',{name:'Mulai menghitung'}).click();await page.getByRole('button',{name:'Geser tanggal'}).click();await page.getByLabel('Tanggal awal',{exact:true}).fill('2024-02-28');await page.getByLabel('Jumlah hari',{exact:true}).fill('2');await expect(page.locator('.shifted-result')).toHaveText('1 Maret 2024');
 await page.getByLabel('Jumlah hari',{exact:true}).fill('-1');await expect(page.getByRole('alert')).toBeVisible();
 await page.getByRole('button',{name:'Hitung mundur',exact:true}).click();await page.getByLabel('Tanggal akhir',{exact:true}).fill('2020-01-01');await expect(page.getByText('SUDAH BERLALU')).toBeVisible();expect(errors).toEqual([]);
});
for(const width of [320,390,768,1024,1440])for(const theme of ['light','dark'])test(`layout ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/kalkulator');if(theme==='dark')await page.getByLabel('Gunakan tema gelap').click();
 await expect(page.locator('.result-number strong')).toHaveText('871');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('.main-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:`evidence/${theme}-${width}.png`,fullPage:true});
 if(width===390){await page.getByLabel('Buka navigasi').click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('[role=dialog]'))).toBe(true);await page.keyboard.press('Escape');await expect(page.getByLabel('Buka navigasi')).toBeFocused();}
});
test('short screen, text stress, reduced motion',async({page})=>{
 await page.setViewportSize({width:390,height:560});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/kalkulator');await page.addStyleTag({content:'html{font-size:28px} .intro h1{font-size:2.8rem}'});
 await page.locator('h1').evaluate(e=>e.textContent='Setiap hari menyimpan cerita yang begitu panjang dan berarti.');expect(await page.locator('.main-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.getByRole('button',{name:'Simpan hitungan',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();expect(await page.getByRole('dialog').evaluate(e=>e.getBoundingClientRect().height<=innerHeight-32)).toBe(true);
 await page.keyboard.press('Escape');await page.locator('.page-footer').scrollIntoViewIfNeeded();await expect(page.locator('.page-footer')).toBeInViewport();await page.screenshot({path:'evidence/text-short-reduced.png'});
});

test('stable modes, keyboard focus trap and 200 percent text',async({page})=>{
 await page.goto('/kalkulator');
 const initial=await page.locator('.calculator').boundingBox();
 for(const name of ['Geser tanggal','Hitung mundur','Selisih tanggal']){await page.getByRole('button',{name,exact:true}).click();const box=await page.locator('.calculator').boundingBox();expect(Math.abs(box!.height-initial!.height)).toBeLessThanOrEqual(2);}
 await page.getByRole('button',{name:'Simpan hitungan',exact:true}).click();
 for(let i=0;i<7;i++){await page.keyboard.press(i%2?'Shift+Tab':'Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('[role=dialog]'))).toBe(true)}
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:560});
 await page.evaluate(()=>{const elements=Array.from(document.querySelectorAll<HTMLElement>('.content *,.topbar *'));const sizes=elements.map(e=>parseFloat(getComputedStyle(e).fontSize));elements.forEach((e,i)=>{e.style.fontSize=sizes[i]*2+'px'})});
 expect(await page.locator('.main-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:'evidence/text-200-percent.png'});
});

