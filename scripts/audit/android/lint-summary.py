import json
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
ctx=json.loads((ROOT/'.e2e-local/android-audit-context.json').read_text(encoding='utf-8'))
base=Path(ctx['base'])
for label in ['inicial','final']:
    report=base/'android/lint'/label/'lint-results-debug.xml'
    if report.exists():
        issues=ET.parse(report).getroot().findall('issue')
        counts=Counter(item.attrib['severity'] for item in issues)
        grouped=Counter((item.attrib['id'],item.attrib['severity']) for item in issues)
        result={'label':label,'errors':counts.get('Error',0)+counts.get('Fatal',0),'warnings':counts.get('Warning',0),'issues':[{'id':key[0],'severity':key[1],'count':count} for key,count in sorted(grouped.items())]}
        (base/'android/lint'/label/'resumen.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
        print(json.dumps(result))
