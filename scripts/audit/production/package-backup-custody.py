"""Package existing encrypted artifacts; never decrypt or publish institutional objects."""
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
from zipfile import ZipFile, ZIP_STORED

root = Path(__file__).resolve().parents[3]
runtime = root / '.e2e-local'
context = json.loads((runtime / 'operational-readiness/context.json').read_text(encoding='utf-8'))
evidence = Path(context['evidence'])
if (evidence / 'MANIFIESTO_SHA256.json').exists():
    raise RuntimeError('NEW_EVIDENCE_REQUIRED')
db = runtime / 'institutional-backup/artifacts/20261101-025806-728619b0'
storage = runtime / 'institutional-storage/20261101161426-b27061d3'
db_receipt = json.loads((db / 'receipt.json').read_text(encoding='utf-8'))
storage_receipt = json.loads((storage / 'receipt.json').read_text(encoding='utf-8'))
sha = lambda p: hashlib.file_digest(p.open('rb'), 'sha256').hexdigest()
assert sha(db / 'database.pgp') == db_receipt['sha256']
assert sha(db / 'recovery-key.asc') == db_receipt['recoveryKeySha256']
assert sha(storage / 'manifest.pgp') == storage_receipt['manifestSha256']
assert storage_receipt['completedObjects'] == 43
objects = sorted(p for p in storage.glob('*.pgp') if p.name != 'manifest.pgp')
assert len(objects) == 43
stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S') + '-' + uuid4().hex[:8]
target = runtime / 'backup-custody' / stamp
target.mkdir(parents=True, exist_ok=False)
data_files = [(db / 'database.pgp', 'database.pgp'), (storage / 'manifest.pgp', 'storage/manifest.pgp')]
data_files += [(p, 'storage/' + p.name) for p in objects]
key_files = [(db / 'recovery-key.asc', 'recovery-key.asc'), (db / 'recipient.asc', 'recipient.asc')]
for name, files in [('datos-cifrados.zip', data_files), ('clave-recuperacion.zip', key_files)]:
    archive = target / name
    with ZipFile(archive, 'x', compression=ZIP_STORED) as z:
        for source, relative in files:
            assert source.resolve().is_relative_to(runtime.resolve())
            z.write(source, relative)
    with ZipFile(archive) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == len(files)
        for source, relative in files:
            assert hashlib.sha256(z.read(relative)).hexdigest() == sha(source)
receipt = {
    'createdAt': datetime.now(timezone.utc).isoformat(),
    'packages': [{'file': name, 'bytes': (target / name).stat().st_size,
                  'sha256': sha(target / name), 'entries': count}
                 for name, count in [('datos-cifrados.zip', len(data_files)), ('clave-recuperacion.zip', len(key_files))]],
    'allPackageEntriesMatchSource': True,
    'dataPackageContainsRecoveryKey': False,
    'recoveryKeyPassphraseRecorded': False,
    'destinationIsStillLocalRuntime': True,
    'externalCustodyVerified': False,
    'privatePackageDirectory': str(target.relative_to(root)).replace('\\', '/'),
    'scope': 'ZIP of already encrypted artifacts and separately packaged protected recovery key. No decryption; no institutional writes.'
}
(target / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
(evidence / 'seguridad/paquetes-custodia.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'packages': 2, 'dataEntries': len(data_files), 'keyEntries': len(key_files), 'allEntriesMatch': True, 'externalCustodyVerified': False}))
