'use strict';
const {baseEnvironment}=require('./backup.cjs'),{assertLocalTarget}=require('../e2e/local/safety.cjs');
function webEnvironment(local,inherited=process.env){return {...baseEnvironmentFrom(inherited),NODE_ENV:'production',CI:'true',GENERATE_SOURCEMAP:'false',REACT_APP_SUPABASE_URL:assertLocalTarget(local.apiUrl),REACT_APP_SUPABASE_ANON_KEY:local.anonKey,REACT_APP_PII_ENCRYPTION_KEY:local.piiEncryptionKey,REACT_APP_APP_URL:'http://127.0.0.1:6100',REACT_APP_ENABLE_SQL_AUDIT:'false'};}
function baseEnvironmentFrom(inherited){const names=Object.keys(baseEnvironment()),output={};for(const name of names)if(inherited[name])output[name]=inherited[name];return output;}
function capacitorConfig(source){return {...source,webDir:'build-safe',server:{androidScheme:'https',cleartext:true},android:{...source.android,allowMixedContent:true},plugins:{...source.plugins,CapacitorUpdater:{...source.plugins?.CapacitorUpdater,autoUpdate:false,updateUrl:'http://127.0.0.1:9',statsUrl:'http://127.0.0.1:9',channelUrl:'http://127.0.0.1:9'}}};}
module.exports={webEnvironment,capacitorConfig};
