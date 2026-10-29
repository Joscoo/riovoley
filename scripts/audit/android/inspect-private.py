"""Inspecciona el APK local autenticado sin copiarlo al expediente público."""
import hashlib
import json
import re
import zipfile
import argparse
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser()
parser.add_argument('--label',default='inicial')
args=parser.parse_args()
assert re.fullmatch('[a-z0-9-]+',args.label)
context=json.loads((ROOT/'.e2e-local/android-audit-context.json').read_text())
base=Path(context['base'])
assert not (base/'MANIFIESTO_SHA256.json').exists()
apk=Path(context['work'])/'project/android/app/build/outputs/apk/debug/app-debug.apk'
local=json.loads((ROOT/'.e2e-local/credentials.json').read_text())
assert local['projectId']=='riovoley-e2e-local' and local['apiUrl']=='http://127.0.0.1:55321'
forbidden=[local['serviceRoleKey']]+[a['password'] for a in local['accounts'].values()]
for env in ROOT.glob('.env*'):
 if env.is_file():
  for line in env.read_text(encoding='utf-8-sig',errors='replace').splitlines():
   m=re.match(r'\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$',line)
   if m and re.search(r'KEY|TOKEN|SECRET|PASSWORD|EMAIL',m[1]) and len(m[2])>=8:forbidden.append(m[2].strip('\"\''))
observed=ROOT/'.e2e-local/observed-secrets.jsonl'
if observed.exists():
 forbidden += [json.loads(line)['password'] for line in observed.read_text().splitlines() if line.strip()]
findings=[];checked=0;has_local_anon=False;has_endpoint=False;application_sources=[]
current_source=(ROOT/'src/shared/platform/push.js').read_text(encoding='utf-8').replace('\r\n','\n')
with zipfile.ZipFile(apk) as z:
 for member in z.infolist():
  if member.is_dir():continue
  checked+=1;payload=z.read(member.filename)
  if member.filename.endswith('.js.map'):
   source_map=json.loads(payload.decode('utf-8'))
   for i,name in enumerate(source_map.get('sources',[])):
    if ('/'+name.replace('\\','/')).endswith('/shared/platform/push.js'):
     bundled=source_map['sourcesContent'][i].replace('\r\n','\n')
     application_sources.append({'source':'src/shared/platform/push.js','matchesCurrent':bundled==current_source,'currentSha256':hashlib.sha256(current_source.encode()).hexdigest(),'bundledSha256':hashlib.sha256(bundled.encode()).hexdigest()})
  if any(s.encode(enc) in payload for s in set(forbidden) if s for enc in ('utf-8','utf-16-le','utf-16-be')):findings.append(member.filename)
  has_local_anon=has_local_anon or local['anonKey'].encode() in payload
  has_endpoint=has_endpoint or local['apiUrl'].encode() in payload
  # Ningún JWT salvo la clave anon exacta del backend local.
  for enc in ('utf-8','utf-16-le','utf-16-be'):
   for jwt in re.findall(r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',payload.decode(enc,errors='ignore')):
    if jwt!=local['anonKey']:findings.append(member.filename)
source_match_verified=bool(application_sources) and all(s['matchesCurrent'] for s in application_sources)
result={'state':'APROBADO' if not findings and has_local_anon and has_endpoint and source_match_verified else 'FALLIDO','checkedMembers':checked,'forbiddenMatches':sorted(set(findings)),'expectedLocalAnonPresent':has_local_anon,'expectedLoopbackEndpointPresent':has_endpoint,'sourceMatchVerified':source_match_verified,'applicationSources':application_sources,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'bytes':apk.stat().st_size,'privateArtifact':True,'copiedToEvidence':False,'distributed':False,'scope':'Se permite únicamente anon local y clave PII local en el paquete privado. Se rechazan secretos institucionales, service_role, contraseñas y otros JWT en todos los miembros ZIP UTF8/UTF16. Se compara push.js de los mapas empaquetados con las fuentes actuales. No es un APK apto para distribuir.'}
out=base/('android/apk-privado-inspeccion-'+args.label+'.json')
assert not out.exists()
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'state':result['state'],'checkedMembers':checked,'forbiddenMatches':len(findings)}))
raise SystemExit(0 if result['state']=='APROBADO' else 1)
