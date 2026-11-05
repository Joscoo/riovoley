const {connect}=require('./local-db.cjs');
(async()=>{
 let sql='';for await(const chunk of process.stdin)sql+=chunk;
 const db=await connect();try{
  const result=await db.query(sql);for(const r of Array.isArray(result)?result:[result])for(const row of r.rows||[])console.log(JSON.stringify(row));
 }finally{await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
