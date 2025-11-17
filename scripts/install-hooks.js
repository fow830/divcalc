#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const hooksDir = path.join(repoRoot, '.git', 'hooks');
const hookPath = path.join(hooksDir, 'post-commit');

if (!fs.existsSync(hooksDir)) {
  console.error('⚠️  .git/hooks directory not found. Skipping hook installation.');
  process.exit(0);
}

const hookContent = `#!/bin/bash
cd "$(git rev-parse --show-toplevel)" || exit 0
npm run env:local >/dev/null 2>&1
`;

try {
  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log('✅ post-commit hook installed: npm run env:local');
} catch (error) {
  console.error('⚠️  Failed to install post-commit hook:', error);
  process.exit(1);
}

