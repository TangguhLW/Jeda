import {test,expect} from './fixtures';
for(const viewport of [{width:1440,height:900},{width:390,height:900}])test(`continuous selection ${viewport.width}`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/kalkulator');await expect(page.locator('.content')).toHaveCSS('opacity','1');
 const tabs=page.getByRole('group',{name:'Mode kalkulator',exact:true});
 const x=()=>tabs.locator('.selection-indicator').evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m41);
 const first=await x();
 await tabs.getByRole('button',{name:'Geser tanggal',exact:true}).evaluate((e:HTMLElement)=>e.click());
 await page.waitForTimeout(65);const moving=await x();expect(moving).toBeGreaterThan(first);
 const target=await tabs.getByRole('button',{name:'Geser tanggal',exact:true}).evaluate((e:HTMLElement)=>e.offsetLeft);expect(moving).toBeLessThan(target);
 await tabs.getByRole('button',{name:'Hitung mundur',exact:true}).evaluate((e:HTMLElement)=>e.click());
 await page.waitForTimeout(45);const reversal=await tabs.getByRole('button',{name:'Selisih tanggal',exact:true}).evaluate((e:HTMLElement)=>{const indicator=e.parentElement!.querySelector('.selection-indicator')!;const before=new DOMMatrixReadOnly(getComputedStyle(indicator).transform).m41;e.click();return {before,after:new DOMMatrixReadOnly(getComputedStyle(indicator).transform).m41}});
 expect(Math.abs(reversal.after-reversal.before)).toBeLessThan(1);
 await expect.poll(x).toBeCloseTo(first,0);await expect(tabs.getByRole('button',{name:'Selisih tanggal',exact:true})).toHaveAttribute('aria-pressed','true');
 if(viewport.width>850){
  const nav=page.getByRole('group',{name:'Pilihan halaman'});await nav.getByRole('button',{name:/^Tersimpan/}).click();
  await expect.poll(()=>nav.locator('.selection-indicator').evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m42)).toBeGreaterThan(40);
  await nav.getByRole('button',{name:'Kalkulator',exact:true}).click();await expect.poll(()=>nav.locator('.selection-indicator').evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m42)).toBeCloseTo(0,0);
 }
 expect(await page.locator('.main-scroll').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});
test('selection instantly follows reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/kalkulator');const tabs=page.getByRole('group',{name:'Mode kalkulator',exact:true});await tabs.getByRole('button',{name:'Hitung mundur',exact:true}).click();
 const geometry=await tabs.evaluate(e=>{const selected=e.querySelector<HTMLElement>('[data-selection-active=true]')!;const highlight=e.querySelector<HTMLElement>('.selection-indicator')!;return {target:selected.offsetLeft,actual:new DOMMatrixReadOnly(getComputedStyle(highlight).transform).m41}});expect(Math.abs(geometry.target-geometry.actual)).toBeLessThan(1);
});


