'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),h=require('../../e2e/local/harness.cjs');
const c=JSON.parse(fs.readFileSync(path.join(h.runtime,'native-local-current.json'))),receipt=JSON.parse(fs.readFileSync(path.join(h.evidence,'android/apk-local-compilado.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(c.apk)).digest('hex'),receipt.sha256);
const source=String.raw`import sys,json,zipfile,pathlib,hashlib,xml.etree.ElementTree as ET
p=pathlib.Path(sys.argv[1]); a=pathlib.Path(sys.argv[2]); z=zipfile.ZipFile(a)
web=p/'build-safe'; files=[f for f in web.rglob('*') if f.is_file()]
matches=sum(z.read('assets/public/'+f.relative_to(web).as_posix())==f.read_bytes() for f in files)
config=json.loads(z.read('assets/capacitor.config.json'))
suites=[ET.parse(f).getroot() for f in (p/'android/app/build/test-results/testDebugUnitTest').glob('TEST-*.xml')]
junit={k:sum(int(s.get(k,0)) for s in suites) for k in ['tests','failures','errors','skipped']}
junit['cases']=[t.get('name') for s in suites for t in s.findall('testcase')]
print(json.dumps({'webFiles':len(files),'matchingWebFiles':matches,'remoteServerUrlPackaged':bool(config.get('server',{}).get('url')),'otaAutoUpdate':config.get('plugins',{}).get('CapacitorUpdater',{}).get('autoUpdate'),'junit':junit}))`;
const r=cp.spawnSync('python',['-c',source,c.project,c.apk],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,'APK_INSPECTION_FAILED');const result=JSON.parse(r.stdout);assert.equal(result.webFiles,result.matchingWebFiles);assert.equal(result.remoteServerUrlPackaged,false);assert.equal(result.otaAutoUpdate,false);assert.equal(result.junit.failures+result.junit.errors,0);
const patterns={deprecated:/deprecat/gi,warning:/warning/gi,flatDir:/flatDir/g,missingGoogleServices:/google-services\.json/g};const logSummary={};for(const name of ['web-build','capacitor-sync','gradle']){const logs=['stdout','stderr'].map(k=>fs.readFileSync(path.join(c.work,name+'.'+k+'.private.log'),'utf8')).join('\n');logSummary[name]={...Object.fromEntries(Object.entries(patterns).map(([key,re])=>[key,[...logs.matchAll(re)].length])),rawLogsPrivate:true};}
h.write('android/apk-local-inspeccion-cierre.json',{checkedAt:new Date().toISOString(),apkHashMatchesReceipt:true,...result,warningMentionCounts:logSummary,installedThisPhase:false,emulatorStartedThisPhase:false,distributed:false,scope:'Comparacion ZIP/build y JUnit de plantilla; no prueba WebView o procesos de negocio.'});
h.write('compilacion-web/salida-generada.json',{checkedAt:new Date().toISOString(),relativeOutput:receipt.privateWork+'/project/build-safe',files:result.webFiles,allPackagedFilesMatch:true,commandMetadata:'../android/local-web-build.meta.json',rawLogsPrivate:true,warningMentionCounts:logSummary['web-build'],functionalCoverageImplied:false});
console.log(JSON.stringify({status:'LOCAL_APK_CONTENTS_VERIFIED',webFiles:result.webFiles,junit:result.junit,installed:false}));
