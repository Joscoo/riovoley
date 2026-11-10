"""Create private local copies outside the repository; never overwrite an existing file."""
import hashlib
import json
import os
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[3]
runtime = root / '.e2e-local'
context = json.loads((runtime / 'operational-readiness/context.json').read_text(encoding='utf-8'))
evidence = Path(context['evidence'])
assert not (evidence / 'MANIFIESTO_SHA256.json').exists()
package = json.loads((evidence / 'seguridad/paquetes-custodia.json').read_text(encoding='utf-8'))
source = root / package['privatePackageDirectory']
label = source.name
profile = Path(os.environ['USERPROFILE']).resolve()
local_app = Path(os.environ['LOCALAPPDATA']).resolve()
destinations = {
    'datos-cifrados.zip': profile / 'RIOVOLEY-Respaldos' / 'Datos' / label,
    'clave-recuperacion.zip': local_app / 'RIOVOLEY' / 'CustodiaClaves' / label,
}
private = {'destinations': {}}
checks = []
for item in package['packages']:
    origin = source / item['file']
    destination = destinations[item['file']]
    assert not destination.resolve().is_relative_to(root.resolve())
    destination.mkdir(parents=True, exist_ok=False)
    target = destination / item['file']
    with origin.open('rb') as left, target.open('xb') as right:
        shutil.copyfileobj(left, right)
    with target.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    assert digest == item['sha256']
    private['destinations'][item['file']] = str(target)
    checks.append({'file': item['file'], 'sha256': digest, 'bytes': target.stat().st_size, 'hashMatchesSource': True})
(runtime / 'operational-readiness/custodia-local.private.json').write_text(json.dumps(private, indent=2) + '\n', encoding='utf-8')
summary = {'source': 'Usuario autorizo crear el destino donde se considere apropiado',
           'dataOutsideRepository': True, 'keyOutsideRepository': True, 'separateDirectories': True,
           'files': checks, 'destinationPathsPublished': False, 'externalDeviceVerified': False,
           'offsiteCustodyVerified': False, 'phraseCopied': False, 'productionChanged': False}
(evidence / 'seguridad/custodia-copia-local.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'copiesOutsideRepository': 2, 'allHashesMatch': True, 'separateDirectories': True, 'offsiteCustodyVerified': False}))
