const assert=require('node:assert/strict');
const path=require('node:path');
const {createClient}=require('@supabase/supabase-js');
const {readLocal,assertLocalTarget,runtime}=require('../../e2e/local/safety.cjs');
async function connect(){
 const local=readLocal();assertLocalTarget(local.apiUrl);assert.equal(local.projectId,'riovoley-e2e-local');
 const {Client}=require(path.join(runtime,'sql-driver/node_modules/pg'));
 const client=new Client({host:'127.0.0.1',port:55322,database:'postgres',user:'postgres',password:process.env.RIOVOLEY_LOCAL_DB_PASSWORD||'postgres',ssl:false,connectionTimeoutMillis:5000,query_timeout:30000});
 await client.connect();
 try{
  const api=createClient(local.apiUrl,local.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,options)=>{const u=new URL(typeof input==='string'?input:input.url||String(input));assert.equal(u.origin,'http://127.0.0.1:55321');return fetch(input,{...options,redirect:'error'});}}});
  const {data,error}=await api.auth.admin.getUserById(local.accounts.admin.userId);assert.equal(error,null);assert.ok(data.user?.id);
  const r=await client.query('SELECT id,email FROM auth.users WHERE id=$1',[data.user.id]);assert.equal(r.rowCount,1);assert.equal(r.rows[0].email,local.accounts.admin.email);assert.match(r.rows[0].email,/@example\.test$/);
  return client;
 }catch(e){await client.end();throw e;}
}
module.exports={connect};
