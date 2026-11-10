import { GoogleAuth } from 'npm:google-auth-library@10.9.1';

Deno.test('GoogleAuth real firma la solicitud OAuth y conserva getAccessToken; transporte simulado', async () => {
  const pair = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const encoded = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey('pkcs8',pair.privateKey))));
  const privateKey = ['-----BEGIN','PRIVATE KEY-----'].join(' ')+'\n'+encoded.match(/.{1,64}/g)!.join('\n')+'\n'+['-----END','PRIVATE KEY-----'].join(' ');
  let assertion = '';
  const auth = new GoogleAuth({credentials:{client_email:'audit@example.test',private_key:privateKey,project_id:'synthetic-audit'},scopes:['https://www.googleapis.com/auth/firebase.messaging'],clientOptions:{transporterOptions:{adapter:async (options:any)=>{
    if (!String(options.url).startsWith('https://oauth2.googleapis.com/')) throw Error('Unexpected OAuth destination');
    assertion = new URLSearchParams(String(options.data)).get('assertion') || '';
    return {data:{access_token:'synthetic-access-token',token_type:'Bearer',expires_in:3600},status:200,statusText:'OK',headers:new Headers(),config:options} as any;
  }}}});
  if(await auth.getAccessToken()!=='synthetic-access-token')throw Error('Access token API contract changed');
  const parts=assertion.split('.');if(parts.length!==3)throw Error('JWT assertion missing');
  const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const claims=JSON.parse(new TextDecoder().decode(decode(parts[1])));
  if(claims.iss!=='audit@example.test'||claims.scope!=='https://www.googleapis.com/auth/firebase.messaging')throw Error('Unexpected claims');
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',pair.publicKey,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error('Invalid JWT signature');
});
