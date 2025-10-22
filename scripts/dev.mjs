#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const projectRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const platform = process.platform === 'win32' ? 'next.cmd' : 'next';
const nextBin = path.join(projectRoot, 'node_modules', '.bin', platform);

if (!existsSync(nextBin)) {
  console.error('[dev] Next.js CLI is missing. Install dependencies first.');
  console.error('[dev] If you are offline, restore node_modules via scripts/offline-bootstrap.sh');
  process.exit(1);
}

const child = spawn(nextBin, ['dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
