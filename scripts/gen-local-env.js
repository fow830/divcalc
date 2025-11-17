#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pkg = require('../package.json');

const FALLBACKS = {
  version: 'dev',
  commit: 'local',
  date: '',
  branch: 'local',
};

function fromGit(cmd, fallback) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}

const meta = {
  NEXT_PUBLIC_APP_VERSION: pkg.version || FALLBACKS.version,
  NEXT_PUBLIC_GIT_COMMIT: fromGit('git rev-parse --short HEAD', FALLBACKS.commit),
  NEXT_PUBLIC_GIT_COMMIT_DATE: fromGit(
    "git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S'",
    FALLBACKS.date
  ),
  // При локальной разработке всегда показываем "local"
  NEXT_PUBLIC_GIT_BRANCH: FALLBACKS.branch,
};

const output = Object.entries(meta)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

const target = path.resolve(process.cwd(), '.env.local');
fs.writeFileSync(target, `${output}\n`);

console.log('✨ .env.local updated with:');
console.table(meta);

