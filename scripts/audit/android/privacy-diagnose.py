import hashlib
import json
import re
import zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
context=json.loads((ROOT/'.e2e-local/android-audit-context.json').read_text(encoding='utf-8'))
values=[]
for file in ROOT.glob('.env*'):
    if file.is_file():
        for line in file.read_text(encoding='utf-8-sig',errors='replace').splitlines():
            m=re.match(r'\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$',line)
            if m and re.search(r'KEY|TOKEN|SECRET|PASSWORD|EMAIL',m[1]) and len(m[2])>=8:
                values.append((file.name+':'+m[1],m[2].strip('\"\'')))
def collect(value,prefix):
    if isinstance(value,dict):
        for key,item in value.items():
            if re.search(r'key|secret|password|token|email',key,re.I) and isinstance(item,str) and len(item)>=8:
                values.append((prefix+'.'+key,item))
            collect(item,prefix+'.'+key)
    elif isinstance(value,list):
        for i,item in enumerate(value):
            collect(item,prefix+'.'+str(i))
collect(json.loads((ROOT/'.e2e-local/credentials.json').read_text(encoding='utf-8')),'runtime')
apk=Path(context['base'])/'android/artefactos/riovoley-auditoria-debug.apk'
found=[]
with zipfile.ZipFile(apk) as archive:
    for name in archive.namelist():
        if name.endswith(('.js','.json','.html','.xml','.txt')):
            text=archive.read(name).decode('utf-8',errors='replace')
            for origin,value in values:
                if value in text:
                    found.append({'file':name,'origin':origin,'length':len(value),'sha256':hashlib.sha256(value.encode()).hexdigest()})
            for token in re.findall(r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',text):
                found.append({'file':name,'origin':'jwt-pattern','length':len(token),'sha256':hashlib.sha256(token.encode()).hexdigest()})
print(json.dumps(found,indent=2))
