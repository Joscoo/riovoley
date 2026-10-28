const path=require('node:path');
const {defineConfig,devices}=require('@playwright/test');
const {readLocal,root}=require('./scripts/e2e/local/safety.cjs');
const {evidence}=require('./scripts/e2e/local/harness.cjs');
const local=readLocal();
// Las pruebas PKCE derivan su clave de almacenamiento de esta URL.
// Alinear también el proceso de Playwright para que no tome la URL de .env.local.
process.env.REACT_APP_SUPABASE_URL=local.apiUrl;
process.env.REACT_APP_SUPABASE_ANON_KEY=local.anonKey;
for(const [name,key] of [['ADMIN','admin'],['TRAINER','trainer'],['STUDENT','student']]) {
  const account=local.accounts?.[key];
  if(!account?.email||!account?.password) throw new Error('Falta cuenta local de '+key);
  process.env['E2E_'+name+'_EMAIL']=account.email;
  process.env['E2E_'+name+'_PASSWORD']=account.password;
}
process.env.E2E_BASE_URL='http://127.0.0.1:6100';
const label=process.env.E2E_LOCAL_LABEL||'playwright-local';
if(!/^[a-z0-9-]+$/.test(label)) throw new Error('Etiqueta de evidencia inválida');
module.exports=defineConfig({
  testDir:path.join(root,'tests/e2e'),
  timeout:60000,
  expect:{timeout:10000},
  fullyParallel:false,
  workers:1,
  retries:0,
  reporter:[['list'],['json',{outputFile:path.join(evidence,label+'/resultados.json')}],['html',{outputFolder:path.join(evidence,label+'/html'),open:'never'}]],
  outputDir:path.join(evidence,label+'/artefactos'),
  use:{
    baseURL:'http://127.0.0.1:6100',serviceWorkers:'block',
    // Proxy cerrado para destinos externos; navegador solo alcanza loopback.
    proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'},
    trace:'off',video:'off',screenshot:'only-on-failure',
  },
  webServer:{command:'node scripts/e2e/local/server.cjs',url:'http://127.0.0.1:6100',reuseExistingServer:false,timeout:30000},
  projects:[
    {name:'mobile-390',use:{...devices['iPhone 12'],viewport:{width:390,height:844}}},
    {name:'mobile-430',use:{...devices['iPhone 14 Pro Max'],viewport:{width:430,height:932}}},
    {name:'mobile-480',use:{...devices['Desktop Chrome'],viewport:{width:480,height:900}}},
    {name:'tablet-768',use:{...devices['iPad (gen 7)'],viewport:{width:768,height:1024}}},
    {name:'tablet-1024',use:{...devices['Desktop Chrome'],viewport:{width:1024,height:768}}},
    {name:'desktop-1440',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'desktop-1920',use:{...devices['Desktop Chrome'],viewport:{width:1920,height:1080}}},
  ],
});
