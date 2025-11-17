#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

function killPort(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!output) {
      return;
    }
    const pids = output.split('\n').filter(Boolean);
    pids.forEach((pid) => {
      try {
        process.kill(Number(pid), 'SIGKILL');
        console.log(`🔪 Killed process ${pid} on port ${port}`);
      } catch (error) {
        console.warn(`⚠️  Failed to kill process ${pid}:`, error.message);
      }
    });
  } catch {
    // nothing listening on port
  }
}

function refreshEnv() {
  try {
    require(path.join(__dirname, 'gen-local-env'));
  } catch (error) {
    console.error('⚠️  Failed to refresh .env.local:', error.message);
  }
}

killPort(3000);
refreshEnv();


