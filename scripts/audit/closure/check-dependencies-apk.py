from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as ET
import zipfile

root = Path(__file__).resolve().parents[3]
runtime = root / '.e2e-local'
context = json.loads((runtime / 'android-audit-context.json').read_text(encoding='utf-8'))
base = Path(context['base']).resolve()
work = Path(context['work']).resolve()
assert work.is_relative_to(runtime.resolve())
assert base.is_relative_to((root / 'docs/tesis/evidencias/verificacion-tecnica').resolve())
assert not (base / 'MANIFIESTO_SHA256.json').exists()
for name in ['android/gradle-assemble.meta.json', 'android/capacitor-sync.meta.json', 'compilacion-web/build-auditoria.meta.json']:
    assert json.loads((base / name).read_text(encoding='utf-8'))['exitCode'] == 0, name
apk = work / 'project/android/app/build/outputs/apk/debug/app-debug.apk'
web = work / 'project/build-safe'
digest = lambda b: hashlib.sha256(b).hexdigest()
checked = []
with zipfile.ZipFile(apk) as archive:
    for file in sorted(p for p in web.rglob('*') if p.is_file()):
        name = file.relative_to(web).as_posix()
        packaged = archive.read('assets/public/' + name)
        assert digest(packaged) == digest(file.read_bytes()), name
        checked.append({'file': name, 'sha256': digest(packaged)})
    config = json.loads(archive.read('assets/capacitor.config.json'))
    assert config['plugins']['CapacitorUpdater']['autoUpdate'] is False
    members = len(archive.infolist())
result = {'recordedAtUtc': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
          'file': apk.relative_to(root).as_posix(), 'privateNotPublished': True,
          'bytes': apk.stat().st_size, 'sha256': digest(apk.read_bytes()),
          'zipMembers': members, 'matchingWebAssets': len(checked),
          'assets': checked, 'autoUpdate': False,
          'scope': 'Comparación del APK nativo con todos los archivos del build web recién compilado; no instalación ni ejecución en dispositivo.'}
(base / 'android/apk-verificado.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
rows = []
for file in sorted((work / 'project/android/app/build/test-results/testDebugUnitTest').glob('*.xml')):
    suite = ET.fromstring(file.read_text(encoding='utf-8'))
    rows.append({'suite': suite.attrib['name'], 'tests': int(suite.attrib['tests']),
                 'failures': int(suite.attrib['failures']), 'errors': int(suite.attrib['errors']),
                 'skipped': int(suite.attrib.get('skipped', 0)), 'seconds': float(suite.attrib['time'])})
    suite.attrib['hostname'] = '[EQUIPO_LOCAL]'
    dest = base / 'android/junit' / file.name
    dest.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(suite).write(dest, encoding='utf-8', xml_declaration=True)
assert rows
junit = {'suites': rows, 'executed': sum(r['tests'] for r in rows),
         'failed': sum(r['failures']+r['errors'] for r in rows), 'skipped': sum(r['skipped'] for r in rows),
         'scope': 'Prueba de plantilla ejecutada en JVM; no verifica lógica de negocio ni instrumentación Android.'}
junit['passed'] = junit['executed']-junit['failed']-junit['skipped']
(base / 'android/junit-resumen.json').write_text(json.dumps(junit, indent=2)+'\n', encoding='utf-8')
assert junit['failed'] == 0
print(json.dumps({'apkBytes': result['bytes'], 'matchingWebAssets': len(checked), 'junit': junit}))
