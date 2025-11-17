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

/**
 * Извлекает все пути к ресурсам из HTML
 */
function extractResourcePaths(html) {
  const paths = new Set();
  
  // Извлекаем href из link тегов
  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const path = match[1];
    if (path.startsWith('/') || path.startsWith('http://localhost:3000/')) {
      paths.add(path.replace('http://localhost:3000', ''));
    }
  }
  
  // Извлекаем src из script тегов
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    const path = match[1];
    if (path.startsWith('/') || path.startsWith('http://localhost:3000/')) {
      paths.add(path.replace('http://localhost:3000', ''));
    }
  }
  
  // Извлекаем пути из inline скриптов (Next.js может вставлять пути в JS)
  const inlineScriptRegex = /<script[^>]*>([^<]*HL\[["']([^"']+)["'][^<]*)<\/script>/gi;
  while ((match = inlineScriptRegex.exec(html)) !== null) {
    const path = match[2];
    if (path && path.startsWith('/')) {
      paths.add(path);
    }
  }
  
  // Также ищем пути в строковых литералах внутри скриптов
  const stringLiteralRegex = /["'](\/_next\/[^"']+)["']/g;
  while ((match = stringLiteralRegex.exec(html)) !== null) {
    paths.add(match[1]);
  }
  
  return Array.from(paths).filter(path => 
    path.startsWith('/_next/') || path === '/'
  );
}

/**
 * Прогревает ресурс с повторными попытками
 */
async function warmupResource(url, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        return { success: true, status: res.status };
      } else if (attempt < maxAttempts) {
        // Если 404, ждём и пробуем ещё раз
        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
      } else {
        return { success: false, status: res.status };
      }
    } catch (error) {
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
      } else {
        return { success: false, error: error.message };
      }
    }
  }
  return { success: false, error: 'Max attempts reached' };
}

async function warmup() {
  console.log('🔥 Прогреваем dev-сервер...');
  
  const rootUrl = `${DEV_URL}/`;
  let html = '';
  
  // Запрашиваем главную страницу несколько раз, пока не получим успешный ответ
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const rootRes = await fetch(rootUrl, { cache: 'no-store' });
      if (rootRes.ok) {
        html = await rootRes.text();
        console.log(`✅ Загружена главная страница → ${rootRes.status}`);
        break;
      } else if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      } else {
        console.warn(`⚠️  Не удалось загрузить главную страницу → ${rootRes.status}`);
        return;
      }
    } catch (error) {
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      } else {
        console.warn(`⚠️  Ошибка загрузки главной страницы: ${error.message}`);
        return;
      }
    }
  }
  
  if (!html) {
    console.warn('⚠️  Не удалось получить HTML для парсинга');
    return;
  }
  
  // Извлекаем все пути к ресурсам из HTML
  const resourcePaths = extractResourcePaths(html);
  console.log(`📦 Найдено ${resourcePaths.length} ресурсов для прогрева`);
  
  // Прогреваем все найденные ресурсы
  const results = { success: 0, failed: 0 };
  
  for (const path of resourcePaths) {
    const url = path.startsWith('http') ? path : `${DEV_URL}${path}`;
    const result = await warmupResource(url);
    
    if (result.success) {
      console.log(`✅ ${path} → ${result.status}`);
      results.success++;
    } else {
      console.warn(`⚠️  ${path} → ${result.status || result.error}`);
      results.failed++;
    }
  }
  
  console.log(`✅ Dev-сервер прогрет: ${results.success} успешно, ${results.failed} ошибок`);
}


