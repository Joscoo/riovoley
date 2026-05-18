const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REQUIRED_ENV = [
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
  'E2E_TRAINER_EMAIL',
  'E2E_TRAINER_PASSWORD',
  'E2E_STUDENT_EMAIL',
  'E2E_STUDENT_PASSWORD',
];

const envFilePath = path.resolve(process.cwd(), '.env.e2e');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [rawKey, ...rawValueParts] = trimmed.split('=');
    const key = rawKey.trim();
    const value = rawValueParts.join('=').trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(envFilePath);

const missing = REQUIRED_ENV.filter((name) => {
  const value = process.env[name];
  return !value || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error('Faltan variables E2E requeridas para smoke por roles:');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  console.error('\nCompleta .env.e2e basado en .env.e2e.example y vuelve a ejecutar.');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';
const args = [
  'playwright',
  'test',
  'tests/e2e/roles.panels-navigation.smoke.spec.js',
  '--project=desktop-1440',
];

const result = spawnSync(command, args, {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
