#!/usr/bin/env node

/**
 * Скрипт для деплоя на Timeweb Cloud
 * Использование: node scripts/deploy-timeweb.js
 */

const { TimewebAPI } = require('./timeweb-api');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Токен из переменной окружения или из файла
const TOKEN = process.env.TIMEWEB_TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoid2EzNzA5MjkiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiJlMDk2MDVjNi01MWU1LTQ0YjItYTI4OC05ZjY1NmRmM2E2NTciLCJpYXQiOjE3NjMzMTQ2NTZ9.r7aQthQbIdQFVz1uouCjTowoJHCUwBq8aX46tEAtn3SYNMIICHjXsFy8c9JndgpBWc9eyIfn_QYuWO_89tQQ8Rx5NtbU-qxXlzZlxBjKdlaqfh1HSj9Hai7QmS6PFsHM4sWzaabvUKjgAQz-q1SuNUxi-U05f6ka3osUV7gKR980Te5eO6r784akAfjN3-cok0OIUWYEhCD4prNvsU39aAGI5rW7DTlpVZBPi9hyT2kpvRsGUpCwsd7XWCifb088d78sVVzDgFrjY6Eh6Hmv1M3ZcI_PySfOCvc1AgyHRGO17xJiW29cNszJrBnMy3VP0bq9-u2dmO08sGr9clkoN-VmZNkMy--PA-xxIxvPxyfKKFNEk4XZ3oTnIRJ2O_P0p_bCVHfVjnQvvZGMuenLW9L1pfKFPalZcUJFfNiCi6D6fPlEyC46EkM-FBXYieCDsgnSM7EPJP5_shAX2ilsvfc23p2oJnzoWnzNW7SJXCz9PDQPX9jh4ZH7p28Q3vyD';

const api = new TimewebAPI(TOKEN);

async function main() {
  console.log('🚀 Начинаем деплой на Timeweb Cloud...\n');

  try {
    // 1. Проверяем подключение к API
    console.log('📡 Проверяем подключение к API...');
    const account = await api.getAccount();
    console.log(`✅ Подключено к аккаунту: ${account.login || 'N/A'}\n`);

    // 2. Получаем список серверов
    console.log('🖥️  Получаем список серверов...');
    const serversResponse = await api.getServers();
    const servers = serversResponse.servers || [];
    
    if (servers.length === 0) {
      console.log('⚠️  Серверы не найдены. Создайте сервер в панели управления Timeweb Cloud.');
      return;
    }

    console.log(`✅ Найдено серверов: ${servers.length}\n`);
    servers.forEach((server, index) => {
      console.log(`${index + 1}. ${server.name || `Server #${server.id}`}`);
      console.log(`   ID: ${server.id}`);
      console.log(`   IP: ${server.ip || 'N/A'}`);
      console.log(`   Статус: ${server.status || 'N/A'}\n`);
    });

    // 3. Собираем проект
    console.log('📦 Собираем проект...');
    try {
      execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
      console.log('✅ Проект успешно собран\n');
    } catch (error) {
      console.error('❌ Ошибка при сборке проекта');
      process.exit(1);
    }

    // 4. Инструкции для деплоя
    console.log('📋 Инструкции для деплоя:\n');
    console.log('1. Подключитесь к серверу по SSH:');
    if (servers[0]?.ip) {
      console.log(`   ssh -i ~/.ssh/sofa_calculator_deploy root@${servers[0].ip}`);
    } else {
      console.log('   ssh -i ~/.ssh/sofa_calculator_deploy root@<IP_СЕРВЕРА>');
    }
    console.log('\n2. На сервере выполните:');
    console.log('   # Установите Node.js 20+');
    console.log('   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -');
    console.log('   sudo apt-get install -y nodejs');
    console.log('\n   # Клонируйте проект');
    console.log('   git clone <ваш-репозиторий> /var/www/sofa-calculator');
    console.log('   cd /var/www/sofa-calculator');
    console.log('\n   # Установите зависимости');
    console.log('   npm ci --production');
    console.log('\n   # Соберите проект');
    console.log('   npm run build');
    console.log('\n   # Запустите с PM2');
    console.log('   npm install -g pm2');
    console.log('   pm2 start npm --name "sofa-calculator" -- start');
    console.log('   pm2 save');
    console.log('   pm2 startup');

    console.log('\n✅ Готово! Следуйте инструкциям выше для завершения деплоя.\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { main };

