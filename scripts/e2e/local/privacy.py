"""Redacta copias de evidencia del stack E2E; nunca modifica runtime ni fuentes."""
from pathlib import Path
import base64
import io
import json
import os
import re
import zipfile

ROOT = Path(__file__).resolve().parents[3]
RUNTIME = ROOT / '.e2e-local'
OUT = Path((RUNTIME / 'evidence-dir.txt').read_text(encoding='utf-8').strip()).resolve()
assert any(OUT.is_relative_to(ROOT / 'docs' / 'tesis' / 'evidencias' / name) for name in ('e2e-aislado','verificacion-tecnica'))
assert not (OUT / 'MANIFIESTO_SHA256.json').exists(), 'No modificar un expediente ya sellado'
secrets = []

def collect(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if re.search('key|secret|password|token', key, re.I) and isinstance(item, str) and len(item) >= 8:
                secrets.append(item)
            collect(item)
    elif isinstance(value, list):
        for item in value:
            collect(item)

collect(json.loads((RUNTIME / 'credentials.json').read_text(encoding='utf-8')))
observed_secrets = RUNTIME / 'observed-secrets.jsonl'
if observed_secrets.exists():
    for line in observed_secrets.read_text(encoding='utf-8').splitlines():
        if line.strip():
            collect(json.loads(line))
for envfile in ROOT.glob('.env*'):
    if envfile.is_file():
        for line in envfile.read_text(encoding='utf-8-sig', errors='replace').splitlines():
            match = re.match(r'\s*([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(.*?)\s*$', line)
            if match and re.search('KEY|TOKEN|SECRET|PASSWORD|EMAIL', match[1]) and len(match[2]) >= 8:
                secrets.append(match[2].strip('"\''))
secrets = sorted(set(secrets), key=len, reverse=True)
email = re.compile(r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', re.I)
jwt = re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')
sbkey = re.compile(r'sb_(?:secret|publishable)_[A-Za-z0-9_-]+')

def scrub(text):
    for value in secrets:
        text = text.replace(value, '[REDACTADO]').replace(json.dumps(value)[1:-1], '[REDACTADO]')
    return sbkey.sub('[CLAVE_REDACTADA]', jwt.sub('[JWT_REDACTADO]', email.sub('[CORREO_REDACTADO]', text)))

archive_checks = 0
archive_pending = []

def scrub_zip(data):
    global archive_checks
    archive_checks += 1
    out = io.BytesIO()
    changed = False
    with zipfile.ZipFile(io.BytesIO(data)) as src, zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as dst:
        for entry in src.infolist():
            payload = src.read(entry.filename)
            if not entry.filename.endswith(('.png', '.jpg', '.jpeg', '.woff', '.woff2')):
                try:
                    original = payload.decode('utf-8')
                    final = scrub(original)
                    if final != original:
                        payload = final.encode('utf-8')
                        changed = True
                    if any(secret in final for secret in secrets) or jwt.search(final) or sbkey.search(final):
                        archive_pending.append(entry.filename)
                except UnicodeDecodeError:
                    pass
            dst.writestr(entry, payload)
    return out.getvalue() if changed else data

redacted = []
checked = 0
for file in sorted(OUT.rglob('*')):
    if not file.is_file() or file.name in ('PRIVACIDAD.json', 'INTEGRIDAD.json', 'MANIFIESTO_SHA256.json'):
        continue
    if file.suffix.lower() in ('.png', '.jpg', '.jpeg', '.woff', '.woff2', '.ico'):
        continue
    try:
        original = file.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    checked += 1
    final = re.sub(r'data:application/zip;base64,([A-Za-z0-9+/=]+)', lambda m: 'data:application/zip;base64,' + base64.b64encode(scrub_zip(base64.b64decode(m[1]))).decode('ascii'), original)
    final = scrub(final)
    if final != original:
        file.write_text(final, encoding='utf-8', newline='')
        redacted.append(str(file.relative_to(OUT)))
pending = []
for file in OUT.rglob('*'):
    if not file.is_file() or file.suffix.lower() in ('.png', '.jpg', '.jpeg', '.woff', '.woff2', '.ico') or file.name in ('PRIVACIDAD.json', 'INTEGRIDAD.json', 'MANIFIESTO_SHA256.json'):
        continue
    try:
        content = file.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    if any(secret in content for secret in secrets) or jwt.search(content) or sbkey.search(content) or email.search(content):
        pending.append(str(file.relative_to(OUT)))
result = {'textFilesChecked': checked, 'embeddedArchivesChecked': archive_checks,
          'redactedCopies': redacted, 'unresolved': pending, 'unresolvedArchiveEntries': archive_pending,
          'images': 'Solo fixtures locales. Se revisan además capturas representativas y contextos; no se pretende certificar OCR exhaustivo.',
          'scope': 'Valores de claves/contraseñas locales y variables sensibles institucionales, JWT, claves Supabase y correos; incluye ZIP base64 de los reportes HTML. Redacciones de copias, sin alterar estados ni cantidades.'}
(OUT / 'PRIVACIDAD.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'checked': checked, 'archives': archive_checks, 'redacted': len(redacted), 'unresolved': len(pending)+len(archive_pending)}))
raise SystemExit(1 if pending or archive_pending else 0)
