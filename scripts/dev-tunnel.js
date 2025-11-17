#!/usr/bin/env node

const { spawn } = require('child_process');
const localtunnel = require('localtunnel');
const http = require('http');

const PORT = process.env.PORT || 3000;
const TUNNEL_SUBDOMAIN = process.env.TUNNEL_SUBDOMAIN || null;

let nextProcess = null;
let tunnel = null;

// Функция для проверки доступности сервера
function waitForServer(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve();
      });
      
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Сервер не запустился за ${maxAttempts} попыток`));
        } else {
          setTimeout(checkServer, 1000);
        }
      });
    };
    
    checkServer();
  });
}

// Функция запуска Next.js
function startNextServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Запуск Next.js dev сервера...');
    
    // Используем существующий run-dev.js скрипт для сохранения функциональности прогрева
    nextProcess = spawn('node', ['scripts/run-dev.js'], {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env, PORT: PORT.toString() },
    });
    
    let serverReady = false;
    
    nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Проверяем, запустился ли сервер
      if (!serverReady && (output.includes('Ready') || output.includes('Local:') || output.includes('ready'))) {
        serverReady = true;
        // Даем немного времени серверу полностью запуститься
        setTimeout(() => resolve(), 1000);
      }
    });
    
    nextProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    nextProcess.on('error', (error) => {
      reject(error);
    });
    
    // Также проверяем через HTTP через некоторое время
    setTimeout(() => {
      if (!serverReady) {
        waitForServer(PORT)
          .then(() => {
            if (!serverReady) {
              serverReady = true;
              resolve();
            }
          })
          .catch(() => {
            // Игнорируем ошибку, так как сервер может запуститься позже
          });
      }
    }, 3000);
  });
}

// Функция создания туннеля
async function createTunnel() {
  try {
    console.log('⏳ Ожидание полного запуска сервера...');
    // Дополнительная проверка, что сервер точно готов
    await waitForServer(PORT);
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    
    console.log('🌐 Создание туннеля...');
    
    const tunnelOptions = {
      port: PORT,
    };
    
    if (TUNNEL_SUBDOMAIN) {
      tunnelOptions.subdomain = TUNNEL_SUBDOMAIN;
    }
    
    tunnel = await localtunnel(tunnelOptions);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Туннель создан!');
    console.log('🔗 Публичный URL:', tunnel.url);
    console.log('📝 Локальный URL:', `http://localhost:${PORT}`);
    console.log('='.repeat(60) + '\n');
    
    tunnel.on('close', () => {
      console.log('\n⚠️  Туннель закрыт');
    });
    
    tunnel.on('error', (error) => {
      console.error('❌ Ошибка туннеля:', error.message);
    });
    
  } catch (error) {
    console.error('❌ Ошибка создания туннеля:', error.message);
    cleanup();
    process.exit(1);
  }
}

// Функция очистки процессов
function cleanup() {
  console.log('\n🛑 Завершение работы...');
  
  if (tunnel) {
    tunnel.close();
  }
  
  if (nextProcess) {
    nextProcess.kill('SIGTERM');
    
    // Если процесс не завершился через 5 секунд, убиваем принудительно
    setTimeout(() => {
      if (nextProcess && !nextProcess.killed) {
        nextProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (error) => {
  console.error('❌ Необработанная ошибка:', error);
  cleanup();
  process.exit(1);
});

// Запуск
async function main() {
  try {
    await startNextServer();
    await createTunnel();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    cleanup();
    process.exit(1);
  }
}

main();

