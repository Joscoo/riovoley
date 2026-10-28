const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs');
const files=cp.execFileSync('git',['ls-files','-z'],{cwd:h.root}).toString().split('\0').filter(Boolean);
h.write('fuentes-iniciales.json',files.filter(f=>fs.existsSync(path.join(h.root,f))).map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(h.root,file))).digest('hex')})));
h.write('estado-inicial.txt',cp.execFileSync('git',['status','--short'],{cwd:h.root,encoding:'utf8'}));
