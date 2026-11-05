'use strict';
const fs=require('node:fs');
const h=require('../../e2e/local/harness.cjs');
const relevant=name=>/(?:DATABASE|POSTGRES|SUPABASE.*(?:DB|PASS)|^PG[A-Z_]*$|^DB_)/.test(name);
const files=[];
for(const file of fs.readdirSync(h.root).filter(f=>/^\.env(?:\.|$)/.test(f)&&!f.includes('example'))){const names=[...fs.readFileSync(require('node:path').join(h.root,file),'utf8').matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map(m=>m[1]).filter(relevant);if(names.length)files.push({file,variableNames:names});}
const processNames=Object.keys(process.env).filter(relevant),present=files.length>0||processNames.length>0;
h.write('seguridad/disponibilidad-conexion-backup.json',{checkedAt:new Date().toISOString(),recognizedVariableNamesInFiles:files,recognizedProcessVariableNames:processNames,presenceOnly:true,valuesRecorded:false,connectionAttempted:false,institutionalBackupAttempted:false,result:present?'VARIABLE_NAMES_FOUND_REQUIRES_OPERATOR_VALIDATION':'BLOCKED_NO_RECOGNIZED_DATABASE_CONFIGURATION',scope:'Solo nombres usuales de variables locales/de proceso. No descarta credenciales en gestores externos ni sustituye la verificación del operador.'});
console.log(JSON.stringify({recognizedConfigurationPresent:present,connectionAttempted:false,valuesPrinted:false}));process.exitCode=present?0:2;
