"""Revisa/redacta solo copias de evidencia; nunca imprime secretos ni cambia fuentes."""
from pathlib import Path
import base64
import io
import json
import os
import re
import zipfile

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
values = []
for env_file in ROOT.glob('.env*'):
    if not env_file.is_file():
        continue
    for line in env_file.read_text(encoding='utf-8-sig', errors='replace').splitlines():
        match = re.match(r'\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(.*?)\s*$', line)
        if not match:
            continue
        key, value = match.groups()
        value = value.strip('"\'')
        if re.search(r'KEY|TOKEN|SECRET|PASSWORD|EMAIL|DATABASE_URL|DSN', key) and len(value) >= 8:
            values.append(value)
for key, value in os.environ.items():
    if re.search(r'KEY|TOKEN|SECRET|PASSWORD|EMAIL|DATABASE_URL|DSN', key) and len(value) >= 8:
        values.append(value)
values = sorted(set(values), key=len, reverse=True)
email = re.compile(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', re.I)
jwt = re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')
phone = re.compile(r'(?<![0-9A-Za-z])(?:\+?593[0-9]{9}|09[0-9]{8})(?![0-9A-Za-z])')
profile = os.environ.get('USERPROFILE', '')
changes = []

def scrub(text):
    for value in values:
        text = text.replace(value, '[REDACTADO]')
        text = text.replace(json.dumps(value)[1:-1], '[REDACTADO]')
    text = jwt.sub('[JWT_REDACTADO]', text)
    text = email.sub('[CORREO_REDACTADO]', text)
    text = phone.sub('[TELEFONO_REDACTADO]', text)
    if profile:
        text = text.replace(profile, '[PERFIL_LOCAL]').replace(json.dumps(profile)[1:-1], '[PERFIL_LOCAL]')
    return text

def zip_scrub(data):
    source = io.BytesIO(data)
    output = io.BytesIO()
    changed = False
    with zipfile.ZipFile(source) as zin, zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zout:
        for entry in zin.infolist():
            payload = zin.read(entry.filename)
            if not entry.filename.endswith(('.png', '.jpg', '.jpeg', '.woff', '.woff2')):
                try:
                    old = payload.decode('utf-8')
                    new = scrub(old)
                    if old != new:
                        payload = new.encode('utf-8')
                        changed = True
                except UnicodeDecodeError:
                    pass
            zout.writestr(entry, payload)
    return output.getvalue() if changed else data, changed

embedded = 0
for file in sorted(OUT.rglob('*')):
    if not file.is_file() or file.name in ('MANIFIESTO_SHA256.json', 'PRIVACIDAD.json', 'INTEGRIDAD.json'):
        continue
    if file.suffix.lower() in ('.png', '.jpg', '.jpeg', '.woff', '.woff2', '.ico'):
        continue
    data = file.read_bytes()
    if file.suffix == '.zip':
        new_data, changed = zip_scrub(data)
        if changed:
            file.write_bytes(new_data)
            changes.append(str(file.relative_to(OUT)))
        continue
    try:
        old = data.decode('utf-8')
    except UnicodeDecodeError:
        continue
    # El informe Playwright embebe su JSON en un ZIP base64; también se inspecciona.
    def replace_zip(match):
        global embedded
        embedded += 1
        decoded, changed = zip_scrub(base64.b64decode(match.group(1)))
        return 'data:application/zip;base64,' + base64.b64encode(decoded).decode('ascii') if changed else match.group(0)
    new = re.sub(r'data:application/zip;base64,([A-Za-z0-9+/=]+)', replace_zip, old)
    new = scrub(new)
    if new != old:
        file.write_text(new, encoding='utf-8', newline='')
        changes.append(str(file.relative_to(OUT)))

# Relectura final independiente de los valores de texto escritos.
findings = []
files = 0
for file in OUT.rglob('*'):
    if not file.is_file() or file.name in ('MANIFIESTO_SHA256.json', 'PRIVACIDAD.json', 'INTEGRIDAD.json'):
        continue
    if file.suffix.lower() in ('.png', '.jpg', '.jpeg', '.woff', '.woff2', '.ico'):
        continue
    try:
        content = file.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    files += 1
    if jwt.search(content) or email.search(content) or any(value in content for value in values):
        findings.append({'file': str(file.relative_to(OUT)), 'kind': 'patron sensible pendiente'})
result = {'textFilesChecked': files, 'embeddedArchivesChecked': embedded,
          'redactedEvidenceCopies': changes, 'unresolved': findings,
          'scope': 'Coincidencia con valores sensibles locales, JWT, correos y patrones de telefono. Incluye ZIP embebido Playwright; capturas revisadas con contexto anonimo. No certifica ausencia de todo dato sensible imaginable.',
          'productionFilesModified': False}
(OUT / 'PRIVACIDAD.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'textFilesChecked': files, 'embeddedArchivesChecked': embedded, 'redactedCopies': len(changes), 'unresolved': len(findings)}))
raise SystemExit(1 if findings else 0)
