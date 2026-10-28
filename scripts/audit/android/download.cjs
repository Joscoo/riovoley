const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const c=require('./context.cjs');
(async()=>{
  const type=process.argv[2];let url,expected;
  if(type==='jdk') {
    const response=await fetch('https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse');
    assert.ok(response.ok);const asset=(await response.json())[0];url=asset.binary.package.link;expected=asset.binary.package.checksum;
    c.write('android/descarga-jdk-origen.json',{url,sha256:expected,version:asset.version});
  } else if(type==='sdk') {
    url='https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip';
    expected='90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a';
  } else throw new Error('Usar jdk o sdk');
  const file=path.join(c.work,type+'.zip');
  await c.run('android/descarga-'+type,'curl.exe',['--fail','--location','--retry','2','--output',file,url]);
  const actual=c.hash(file);assert.equal(actual,expected);
  c.write('android/descarga-'+type+'-sha256.json',{url,sha256:actual,expected,bytes:fs.statSync(file).size,verified:true});
  await c.run('android/extraer-'+type,'tar.exe',['-xf',file,'-C',c.work]);
  console.log(type+' descargado, hash comprobado y extraído');
})();
