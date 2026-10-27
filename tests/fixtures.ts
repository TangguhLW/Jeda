import {test as base,expect} from '@playwright/test';

// Browser tests must stay offline even when the developer has a real Gemini key.
export const test=base.extend<{offlineGemini:void}>({
  offlineGemini:[async({page},use)=>{
    await page.route('**/api/status',route=>route.fulfill({json:{configured:false,provider:'gemini'}}));
    await page.route('**/api/interpret',route=>route.fulfill({status:503,json:{error:'not_configured',message:'Gemini belum diaktifkan pada tes.'}}));
    await use();
  },{auto:true}],
});
export {expect};
