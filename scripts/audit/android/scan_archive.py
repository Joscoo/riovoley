import re
import zipfile

JWT = re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')

def contains_sensitive(payload, known):
    if any(value.encode(encoding) in payload for value in known for encoding in ('utf-8','utf-16-le','utf-16-be')):
        return True
    return any(JWT.search(payload.decode(encoding,errors='ignore')) for encoding in ('utf-8','utf-16-le','utf-16-be'))

def scan_archive(file, known):
    unresolved=[]
    checked=0
    with zipfile.ZipFile(file) as archive:
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            checked+=1
            if contains_sensitive(archive.read(entry.filename), known):
                unresolved.append(entry.filename)
    return {'checked':checked,'unresolved':unresolved}
