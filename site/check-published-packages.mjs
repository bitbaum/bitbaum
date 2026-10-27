import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { assertPackageVersions } from './package-version-contract.mjs';
const html=readFileSync(0,'utf8');
const expected=JSON.parse(readFileSync(new URL('./packages.snapshot.json',import.meta.url),'utf8')).packages;
const browser=await chromium.launch();
try {
  const page=await browser.newPage();
  // Detached DOM parsing neither executes scripts nor fetches remote assets.
  const actual=await page.evaluate(source=>{
    const doc=new DOMParser().parseFromString(source,'text/html');
    return [...doc.querySelectorAll('[data-package]')].map(card=>{
      const badge=card.querySelector('[data-package-version]');
      return {slug:card.dataset.package,version:badge?.dataset.packageVersion,source:badge?.dataset.packageSource,text:badge?.textContent};
    });
  },html);
  assertPackageVersions(expected,actual);
  console.log(`Published package versions match all ${expected.filter(p=>p.version).length} registry cards.`);
} finally {await browser.close();}
