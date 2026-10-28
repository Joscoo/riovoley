import io
import unittest
import zipfile
from scan_archive import scan_archive

class ArchivePrivacyTests(unittest.TestCase):
    def check_entry(self, name, data):
        blob=io.BytesIO()
        with zipfile.ZipFile(blob,'w') as archive:
            archive.writestr(name,data)
        blob.seek(0)
        return scan_archive(blob,['reserved-test-value'])

    def test_checks_source_maps(self):
        self.assertEqual(self.check_entry('assets/source.js.map',b'reserved-test-value')['unresolved'],['assets/source.js.map'])

    def test_checks_utf16_binary_entries(self):
        self.assertEqual(self.check_entry('classes.dex','reserved-test-value'.encode('utf-16-le'))['unresolved'],['classes.dex'])

    def test_allows_artifact_without_values(self):
        self.assertEqual(self.check_entry('classes.dex',b'harmless-test-data')['unresolved'],[])

if __name__=='__main__':
    unittest.main()
