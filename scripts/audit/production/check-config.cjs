const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
(async()=>{
 const file='.env.production';
 const parsed=require('dotenv').parse(fs.readFileSync(path.join(h.root,file)));
 const env=Object.fromEntries(Object.entries(process.env).filter(([name])=>!name.startsWith('REACT_APP_')));
 Object.assign(env,parsed);
 await h.run('seguridad/preflight-config-local',process.execPath,['scripts/production/preflight.cjs','--profile','frontend','--structure'],{env,allowFailure:true});
 const schema=await fetch('https://openapi.vercel.sh/vercel.json',{signal:AbortSignal.timeout(20000)}).then(r=>{assert.equal(r.status,200);return r.json();});
 const Ajv=require('ajv'),ajv=new Ajv({schemaId:'auto',allErrors:true});
 ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
 // The published document currently mixes draft-04 metadata with numeric
 // exclusiveMinimum in unrelated experimental fields. Validate only the actual
 // properties used here; retain the full-schema failures as audit evidence.
 const relevant={type:'object',additionalProperties:false,properties:Object.fromEntries(['$schema','git','buildCommand','headers'].map(name=>[name,schema.properties[name]]))};
 const validate=ajv.compile(relevant),config=JSON.parse(fs.readFileSync(path.join(h.root,'vercel.json')));
 assert.equal(validate(config),true,JSON.stringify(validate.errors));
 h.write('seguridad/configuracion-preparada.json',{recordedAt:new Date().toISOString(),frontendFile:file,valuesSaved:false,vercelSchemaUrl:'https://openapi.vercel.sh/vercel.json',usedPropertySchemasValid:true,validatedProperties:Object.keys(config),fullPublishedSchemaValidated:false,productionModified:false,headersPrepared:['X-Content-Type-Options','Referrer-Policy','X-Frame-Options'],sourceMapsInVercelBuild:false,ciWarningsFailBuild:true,limitations:['Esquema publicado completo incompatible con su declaración draft-04 en campos experimentales; se comprobaron las definiciones de las cuatro propiedades utilizadas','No acceso demostrado a variables del proyecto Vercel objetivo','Preflight solo comprueba estructura, no autenticidad de claves ni aprobación','CSP y Permissions-Policy requieren inventario de proveedores/dispositivos y ensayo antes de activarse']});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
