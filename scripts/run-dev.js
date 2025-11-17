#!/usr/bin/env node

/**
 * Обёртка над `next dev`, которая после старта сервера сразу прогревает
 * основные бандлы. Это устраняет 404 на чанки/стили, которые браузер
 * пытается загрузить быстрее, чем Next успевает их собрать.
 */

const { spawn } = require('child_process');

const DEV_COMMAND = process.env.NEXT_DEV_COMMAND || 'next';
const DEV_ARGS = ['dev'];
const DEV_URL = process.env.NEXT_DEV_URL || 'http://localhost:3000';
const WARMUP_PATHS = [
  '/',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/main-app.js',
  '/_next/static/chunks/app-pages-internals.js',
  '/_next/static/chunks/app/page.js',
];

let warmupScheduled = false;

const devProcess = spawn(DEV_COMMAND, DEV_ARGS, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env,
});

devProcess.stdout.on('data', (chunk) => {
  const message = chunk.toString();
  process.stdout.write(message);

  if (!warmupScheduled && /\bready\b/i.test(message)) {
    warmupScheduled = true;
    warmup().catch((error) => {
      console.warn('⚠️  Warmup failed:', error.message);
    });
  }
});

devProcess.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

devProcess.on('exit', (code) => {
  process.exit(code ?? 0);
});

const FORWARD_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
FORWARD_SIGNALS.forEach((signal) => {
  process.on(signal, () => {
    if (!devProcess.killed) {
      devProcess.kill(signal);
    }
  });
});

async function warmup() {
  console.log('🔥 Прогреваем dev-сервер...');
  for (const path of WARMUP_PATHS) {
    const url = `${DEV_URL}${path}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        console.warn(`⚠️  Warmup ${url} → ${res.status}`);
      } else {
        console.log(`✅ Warmup ${url} → ${res.status}`);
      }
    } catch (error) {
      console.warn(`⚠️  Warmup ${url} → ${error.message}`);
    }
  }
  console.log('✅ Dev-сервер прогрет');
}


