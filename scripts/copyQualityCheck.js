const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(process.cwd(), 'src');
const VALID_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const MOJIBAKE_PATTERN = /Ã|â|�|Â¿|Â¡/;

const ROLE_TERM_PATTERNS = [
  /Panel de Atleta/i,
  /Agregar Atleta/i,
  /Editar Atleta/i,
  /Atleta creado/i,
  /Atleta actualizado/i,
  /Atleta eliminado/i,
  /Atleta suspendido/i,
  /Atleta reactivado/i,
  /Total Atletas/i,
  /No hay atletas registrados/i,
  /atletas encontrados/i,
];

const ALLOWLIST_PATTERNS = [
  /atleta\.users/i,
  /useAtletas/i,
  /loadAtletas/i,
  /filterAndSortAtletas/i,
  /paginateAtletas/i,
];

const readTextFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...readTextFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!VALID_EXTENSIONS.has(path.extname(entry.name))) continue;
    if (entry.name.includes('.test.')) continue;

    files.push(fullPath);
  }

  return files;
};

const lineColumnFromIndex = (source, index) => {
  const before = source.slice(0, index);
  const lines = before.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
};

const isAllowlisted = (lineText) => ALLOWLIST_PATTERNS.some((pattern) => pattern.test(lineText));

const scanFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  const mojibakeMatch = content.match(MOJIBAKE_PATTERN);
  if (mojibakeMatch) {
    const index = mojibakeMatch.index ?? 0;
    const { line, column } = lineColumnFromIndex(content, index);
    issues.push({
      type: 'mojibake',
      filePath,
      line,
      column,
      message: 'Texto con posible mojibake detectado.',
    });
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((lineText, lineIndex) => {
    if (isAllowlisted(lineText)) return;

    for (const pattern of ROLE_TERM_PATTERNS) {
      if (!pattern.test(lineText)) continue;
      issues.push({
        type: 'role-term',
        filePath,
        line: lineIndex + 1,
        column: 1,
        message: `Terminología de rol inconsistente detectada: "${lineText.trim()}"`,
      });
      break;
    }
  });

  return issues;
};

const runCopyQualityCheck = () => {
  const files = readTextFiles(SOURCE_DIR);
  const issues = files.flatMap((filePath) => scanFile(filePath));

  if (issues.length === 0) {
    return { ok: true, issues: [] };
  }

  return { ok: false, issues };
};

if (require.main === module) {
  const result = runCopyQualityCheck();

  if (result.ok) {
    console.log('Copy quality check passed.');
    process.exit(0);
  }

  console.error('Copy quality check failed:');
  result.issues.forEach((issue) => {
    const relativePath = path.relative(process.cwd(), issue.filePath);
    console.error(`- ${relativePath}:${issue.line}:${issue.column} [${issue.type}] ${issue.message}`);
  });
  process.exit(1);
}

module.exports = {
  runCopyQualityCheck,
  scanFile,
};
