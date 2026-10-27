import {test,expect} from './fixtures';
test('theme reveals from toggle to farthest corner and persists',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/kalkulator');await expect(page.locator('.content')).toHaveCSS('opacity','1');
 const button=page.getByLabel('Gunakan tema gelap');const bounds=await button.boundingBox();await button.click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.waitForFunction(()=>document.getAnimations().some(a=>(a.effect as KeyframeEffect)?.pseudoElement==='::view-transition-new(root)'));
 const geometry=await page.evaluate(()=>{const a=document.getAnimations().find(a=>(a.effect as KeyframeEffect)?.pseudoElement==='::view-transition-new(root)')!;const frames=(a.effect as KeyframeEffect).getKeyframes();a.pause();a.currentTime=230;return {first:frames[0].clipPath,last:frames.at(-1)!.clipPath,duration:a.effect!.getTiming().duration}});
 expect(geometry.first).toContain('circle(0px');expect(geometry.first).toContain(`${bounds!.x+bounds!.width/2}px`);expect(geometry.duration).toBe(720);
 await page.screenshot({path:'evidence/theme-reveal-midpoint.png'});
 await page.evaluate(()=>document.getAnimations().filter(a=>(a.effect as KeyframeEffect)?.pseudoElement==='::view-transition-new(root)').forEach(a=>a.play()));
 await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition','running');
 await page.getByLabel('Gunakan tema terang').click();await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition','running');await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','light');expect(errors).toEqual([]);
});
test('reduced motion switches instantly without reveal',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/kalkulator');await page.getByLabel('Gunakan tema gelap').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('html')).not.toHaveAttribute('data-theme-transition','running');
 expect(await page.evaluate(()=>document.getAnimations().some(a=>(a.effect as KeyframeEffect)?.pseudoElement==='::view-transition-new(root)'))).toBe(false);
});
test('unsupported view transitions still switch themes',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(document,'startViewTransition',{value:undefined,configurable:true}));await page.goto('/kalkulator');await page.getByLabel('Gunakan tema gelap').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByLabel('Gunakan tema terang').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});


