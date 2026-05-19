/* eslint-disable global-require */
const fs = require('fs');
const os = require('os');
const path = require('path');

const { scanFile } = require('../../../scripts/copyQualityCheck');

const writeTempFile = (content) => {
  const filePath = path.join(os.tmpdir(), `copy-quality-${Date.now()}-${Math.random()}.js`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
};

describe('copyQualityCheck', () => {
  it('flags mojibake text', () => {
    const filePath = writeTempFile("const title = 'GestiÃ³n de Usuarios';");
    const issues = scanFile(filePath);
    expect(issues.some((issue) => issue.type === 'mojibake')).toBe(true);
    fs.unlinkSync(filePath);
  });

  it('flags role term inconsistencies in UI text', () => {
    const filePath = writeTempFile("const label = 'Agregar Atleta';");
    const issues = scanFile(filePath);
    expect(issues.some((issue) => issue.type === 'role-term')).toBe(true);
    fs.unlinkSync(filePath);
  });
});
