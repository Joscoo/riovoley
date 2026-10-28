const path=require('node:path');
const assert=require('node:assert/strict');
const {_android:android}=require('playwright');
const {expect}=require('@playwright/test');
const h=require('../../e2e/local/harness.cjs');
const c=require('../android/context.cjs');
const {environment}=require('../android/environment.cjs');
(async()=>{
  const label=(process.argv.find(arg=>arg.startsWith('--label='))||'--label=webview-inicial').slice(8);
  assert.match(label,/^[a-z0-9-]+$/);
  const {env,sdk}=environment(),adb=path.join(sdk,'platform-tools/adb.exe');
  await h.run('android/app-iniciar',adb,['-s','emulator-5580','shell','am','start','-n','com.riovoley.app/.MainActivity'],{env});
  const device=(await android.devices()).find(item=>item.serial()==='emulator-5580');
  assert.ok(device,'Solo se permite el emulador descartable propio');
  try {
    const webview=await device.webView({pkg:'com.riovoley.app',timeout:30000});
    const page=await webview.page();
    await expect(page.getByRole('navigation',{name:/navegaci.n principal/i})).toBeVisible({timeout:30000});
    await page.screenshot({path:path.join(h.evidence,'android/'+label+'-inicio.png')});
    const result={state:'APROBADO',url:page.url(),viewport:await page.evaluate(()=>({width:innerWidth,height:innerHeight})),scope:'APK instalado en emulador real; MainActivity y React visibles mediante Playwright AndroidWebView, no navegador de escritorio con viewport móvil.',artifactSha256:c.hash(path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk'))};
    if(process.argv.includes('--access')) {
      for(const route of ['/admin','/entrenador','/estudiante']) {
        await page.goto('https://localhost'+route);
        await expect(page.getByRole('heading',{name:/acceso denegado/i})).toBeVisible({timeout:15000});
      }
      await page.screenshot({path:path.join(h.evidence,'android/'+label+'-denegacion.png')});
      result.access={executed:3,passed:3,failed:0};
    }
    h.write('android/'+label+'.json',result);
  } finally {await device.close();}
})();
