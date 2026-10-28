const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const runtime = path.join(root, '.e2e-local');
const projectId = 'riovoley-e2e-local';
const dockerHost='npipe:////./pipe/dockerDesktopLinuxEngine';
const dockerSocket='\\\\.\\pipe\\dockerDesktopLinuxEngine';
function localDockerEnv(inherited=process.env) {
  const env={...inherited,DOCKER_HOST:dockerHost};
  for(const name of ['DOCKER_CONTEXT','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[name];
  return env;
}
function dockerArgs(args) {
  if(args.some(arg=>/^--(?:host|context)(?:=|$)|^-H/.test(arg))) throw new Error('No se permite cambiar el destino Docker local');
  return ['--host',dockerHost,...args];
}
function assertLocalTarget(raw, port = 55321) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('URL local inválida'); }
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== String(port) || url.username || url.password || !['', '/'].includes(url.pathname) || url.search || url.hash) {
    throw new Error('Se requiere URL local y puerto exclusivo del entorno E2E');
  }
  return url.origin;
}
function buildWebEnv(local, inherited = process.env) {
  const env = Object.fromEntries(Object.entries(inherited).filter(([name]) => !/SUPABASE.*(KEY|TOKEN|PASSWORD)|RESEND|FCM_|KEYSTORE|^E2E_/.test(name)));
  // Las claves presentes en .env* se bloquean antes de que CRA invoque dotenv.
  const names = new Set(Object.keys(env).filter(name => name.startsWith('REACT_APP_')));
  for (const file of fs.readdirSync(root).filter(f => /^\.env($|\.)/.test(f))) {
    for (const match of fs.readFileSync(path.join(root, file), 'utf8').matchAll(/^\s*(REACT_APP_[A-Z0-9_]+)\s*=/gm)) names.add(match[1]);
  }
  for (const name of names) env[name] = '';
  return {...env, REACT_APP_SUPABASE_URL: assertLocalTarget(local.apiUrl), REACT_APP_SUPABASE_ANON_KEY: local.anonKey, REACT_APP_PII_ENCRYPTION_KEY: local.piiEncryptionKey || '', REACT_APP_APP_URL: 'http://127.0.0.1:6100', REACT_APP_ENABLE_SQL_AUDIT: 'false', PORT: '6100', HOST: '127.0.0.1', BROWSER: 'none', WDS_SOCKET_HOST: '127.0.0.1', CI: 'false'};
}
function redact(value, secrets = []) {
  let safe = String(value);
  for (const secret of secrets.filter(Boolean).sort((a,b) => b.length-a.length)) safe = safe.split(secret).join('[REDACTADO]');
  return safe.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTADO]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[CORREO_REDACTADO]');
}
function readLocal() {
  const config = JSON.parse(fs.readFileSync(path.join(runtime, 'credentials.json'), 'utf8'));
  assertLocalTarget(config.apiUrl);
  if (config.projectId !== projectId || !config.anonKey || !config.serviceRoleKey) throw new Error('Configuración local incompleta');
  return config;
}
function validatePlaywrightArgs(args) {
  for(const arg of args) if(!/^--(?:workers|project|grep|grep-invert|max-failures|timeout|global-timeout)=[^\r\n]+$/.test(arg)) throw new Error('Argumento Playwright no autorizado en el arnés local');
  return args;
}
module.exports = {root, runtime, projectId, assertLocalTarget, buildWebEnv, redact, readLocal,validatePlaywrightArgs,localDockerEnv,dockerArgs,dockerHost,dockerSocket};
