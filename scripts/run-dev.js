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

  // Запускаем прогрев после готовности сервера
  if (!warmupScheduled && /\bready\b/i.test(message)) {
    warmupScheduled = true;
    // Даём задержку, чтобы сервер точно был готов принимать запросы
    setTimeout(() => {
      warmup().catch((error) => {
        console.warn('⚠️  Warmup failed:', error.message);
      });
    }, 1500);
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
  
  // Сначала прогреваем главную страницу, чтобы Next.js скомпилировал все чанки
  const rootUrl = `${DEV_URL}/`;
  try {
    const rootRes = await fetch(rootUrl, { cache: 'no-store' });
    if (rootRes.ok) {
      console.log(`✅ Warmup ${rootUrl} → ${rootRes.status}`);
      // Ждём немного, чтобы Next.js успел сгенерировать все чанки
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.warn(`⚠️  Warmup ${rootUrl} → ${rootRes.status}`);
    }
  } catch (error) {
    console.warn(`⚠️  Warmup ${rootUrl} → ${error.message}`);
  }

  // Теперь прогреваем остальные ресурсы с повторными попытками
  for (const path of WARMUP_PATHS.slice(1)) {
    const url = `${DEV_URL}${path}`;
    let success = false;
    
    // Пробуем до 3 раз с задержкой
    for (let attempt = 1; attempt <= 3 && !success; attempt++) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          console.log(`✅ Warmup ${url} → ${res.status}`);
          success = true;
        } else if (attempt < 3) {
          // Если 404, ждём и пробуем ещё раз
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.warn(`⚠️  Warmup ${url} → ${res.status} (после ${attempt} попыток)`);
        }
      } catch (error) {
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.warn(`⚠️  Warmup ${url} → ${error.message} (после ${attempt} попыток)`);
        }
      }
    }
  }
  
  console.log('✅ Dev-сервер прогрет');
}


