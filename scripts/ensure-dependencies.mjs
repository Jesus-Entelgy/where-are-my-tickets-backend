import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
const nestBinary = new URL(
  process.platform === 'win32'
    ? '../node_modules/.bin/nest.cmd'
    : '../node_modules/.bin/nest',
  import.meta.url,
);

if (!npmCli) {
  throw new Error('Run this dependency check through an npm script.');
}

const dependencyCheck = spawnSync(process.execPath, [
  npmCli,
  'ls',
  '--depth=0',
  '--include=dev',
], { stdio: 'ignore' });

if (dependencyCheck.error) {
  throw dependencyCheck.error;
}

if (dependencyCheck.status !== 0 || !existsSync(nestBinary)) {
  console.log('Installing missing or incomplete project dependencies...');
  const install = spawnSync(process.execPath, [
    npmCli,
    'ci',
    '--include=dev',
  ], { stdio: 'inherit' });

  if (install.error) {
    throw install.error;
  }

  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }
}
