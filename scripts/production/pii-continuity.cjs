'use strict';
const crypto=require('node:crypto');
// Returns booleans only. Plaintext and its derived search tokens never leave this function.
async function inspectContact(secret,context,ciphertext,exact,partial){
 const result={state:'CHECKED',authenticated:false,exactMatches:false,partialMatches:false};
 if(!['email','telefono'].includes(context)||!/^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(ciphertext||''))return {...result,state:'FORMAT_NOT_SUPPORTED'};
 try{const [version,iv,body]=ciphertext.split('.'),raw=crypto.createHash('sha256').update(secret.trim()).digest(),aes=await crypto.webcrypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
  const clear=Buffer.from(await crypto.webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(iv,'base64'),additionalData:Buffer.from('riovoley:'+context+':'+version)},aes,Buffer.from(body,'base64'))).toString('utf8');result.authenticated=true;
  const hmac=crypto.createHash('sha256').update(secret.trim()+':hmac').digest(),sign=text=>crypto.createHmac('sha256',hmac).update(text).digest('hex');result.exactMatches=sign(context+':exact:'+clear)===exact;
  const clean=clear.replace(/\s+/g,''),grams=new Set([clean]);if(clean.length<=3)grams.add(clean);else for(let i=0;i<=clean.length-3;i++)grams.add(clean.slice(i,i+3));
  const expected=[...grams].map(g=>sign(context+':partial:'+g)).sort();result.partialMatches=Array.isArray(partial)&&JSON.stringify([...new Set(partial)].sort())===JSON.stringify(expected);
 }catch{ /* No native error or plaintext is exposed. */ }return result;
}
module.exports={inspectContact};
