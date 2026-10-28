import argparse
import json
import re
from pathlib import Path
from scan_archive import scan_archive, contains_sensitive

ROOT = Path(__file__).resolve().parents[3]
context = json.loads((ROOT / '.e2e-local/android-audit-context.json').read_text(encoding='utf-8'))
BASE = Path(context['base'])
parser=argparse.ArgumentParser()
parser.add_argument('--apk')
parser.add_argument('--report',default='PRIVACIDAD.json')
args=parser.parse_args()
secrets = []
for file in ROOT.glob('.env*'):
    if file.is_file():
        for line in file.read_text(encoding='utf-8-sig', errors='replace').splitlines():
            m = re.match(r'\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$', line)
            if m and re.search(r'KEY|TOKEN|SECRET|PASSWORD|EMAIL', m[1]) and len(m[2]) >= 8:
                secrets.append(m[2].strip('\"\''))
def collect(value):
    if isinstance(value, dict):
        for key,item in value.items():
            if re.search(r'key|secret|password|token|email',key,re.I) and isinstance(item,str) and len(item)>=8:
                secrets.append(item)
            collect(item)
    elif isinstance(value,list):
        for item in value:
            collect(item)
collect(json.loads((ROOT / '.e2e-local/credentials.json').read_text(encoding='utf-8')))
observed=ROOT/'.e2e-local/observed-secrets.jsonl'
if observed.exists():
    for line in observed.read_text(encoding='utf-8').splitlines():
        if line.strip():
            collect(json.loads(line))
secrets = list(set(secrets))
pending=[]
checked=0
if args.apk:
    private_apk=Path(args.apk).resolve()
    assert private_apk.is_relative_to(Path(context['work']).resolve()),'El APK previo debe permanecer en runtime privado'
    files=[private_apk]
else:
    assert len(list((BASE/'android/artefactos').glob('*.apk')))==1,'Se requiere exactamente el APK final para validar su privacidad'
    files=list(BASE.rglob('*'))
for file in files:
    if not file.is_file() or file.name in ['PRIVACIDAD.json','MANIFIESTO_SHA256.json']:
        continue
    if file.suffix=='.apk':
        result=scan_archive(file,secrets)
        checked+=result['checked']
        pending.extend(file.name+':'+name for name in result['unresolved'])
    else:
        checked+=1
        if contains_sensitive(file.read_bytes(),secrets):
            pending.append(str(file.relative_to(BASE)))
result={'checked':checked,'unresolved':pending,'scope':'Valores sensibles de .env*, cuentas y claves temporales locales, JWT; todos los miembros ZIP del APK, incluidos mapas de fuentes y binarios, en UTF8/UTF16LE/UTF16BE. APK sin modificar.'}
output=(BASE/args.report).resolve()
assert output.is_relative_to(BASE.resolve())
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'checked':checked,'unresolved':len(pending)}))
raise SystemExit(1 if pending else 0)
