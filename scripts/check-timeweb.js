#!/usr/bin/env node

/**
 * Скрипт для проверки подключения к Timeweb Cloud API
 */

const { TimewebAPI } = require('./timeweb-api');

const TOKEN = process.env.TIMEWEB_TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoid2EzNzA5MjkiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiJlMDk2MDVjNi01MWU1LTQ0YjItYTI4OC05ZjY1NmRmM2E2NTciLCJpYXQiOjE3NjMzMTQ2NTZ9.r7aQthQbIdQFVz1uouCjTowoJHCUwBq8aX46tEAtn3SYNMIICHjXsFy8c9JndgpBWc9eyIfn_QYuWO_89tQQ8Rx5NtbU-qxXlzZlxBjKdlaqfh1HSj9Hai7QmS6PFsHM4sWzaabvUKjgAQz-q1SuNUxi-U05f6ka3osUV7gKR980Te5eO6r784akAfjN3-cok0OIUWYEhCD4prNvsU39aAGI5rW7DTlpVZBPi9hyT2kpvRsGUpCwsd7XWCifb088d78sVVzDgFrjY6Eh6Hmv1M3ZcI_PySfOCvc1AgyHRGO17xJiW29cNszJrBnMy3VP0bq9-u2dmO08sGr9clkoN-VmZNkMy--PA-xxIxvPxyfKKFNEk4XZ3oTnIRJ2O_P0p_bCVHfVjnQvvZGMuenLW9L1pfKFPalZcUJFfNiCi6D6fPlEyC46EkM-FBXYieCDsgnSM7EPJP5_shAX2ilsvfc23p2oJnzoWnzNW7SJXCz9PDQPX9jh4ZH7p28Q3vyD';

const api = new TimewebAPI(TOKEN);

async function checkConnection() {
  console.log('🔍 Проверка подключения к Timeweb Cloud API...\n');

  try {
    // Получение списка серверов (основной эндпоинт)
    console.log('🖥️  Получаем список серверов...');
    const serversResponse = await api.getServers();
    const servers = serversResponse.servers || serversResponse.data || serversResponse || [];
    
    console.log('✅ Подключение к API успешно!\n');
    console.log(`📊 Найдено серверов: ${Array.isArray(servers) ? servers.length : 'N/A'}\n`);
    
    if (Array.isArray(servers) && servers.length > 0) {
      console.log('📋 Список серверов:');
      for (let index = 0; index < servers.length; index++) {
        const server = servers[index];
        console.log(`\n${index + 1}. ${server.name || server.hostname || `Server #${server.id}`}`);
        console.log(`   ID: ${server.id}`);
        console.log(`   Статус: ${server.status || server.state || 'N/A'}`);
        if (server.os) {
          console.log(`   OS: ${server.os.name || server.os || 'N/A'}`);
        }
        
        // Получаем детальную информацию о сервере
        try {
          const serverDetails = await api.getServer(server.id);
          if (serverDetails.server) {
            const details = serverDetails.server;
            if (details.ip) {
              const ip = Array.isArray(details.ip) ? details.ip[0] : details.ip;
              console.log(`   IP: ${ip}`);
            }
            if (details.configurator) {
              console.log(`   CPU: ${details.configurator.cpu || 'N/A'}`);
              console.log(`   RAM: ${details.configurator.ram || 'N/A'} MB`);
            }
          }
        } catch (e) {
          // Если не удалось получить детали, просто пропускаем
        }
      }
    } else {
      console.log('⚠️  Серверы не найдены или формат ответа неожиданный');
      console.log('📄 Ответ API:', JSON.stringify(serversResponse, null, 2));
    }

    // Попытка получить информацию об аккаунте (опционально)
    try {
      console.log('\n📡 Пробуем получить информацию об аккаунте...');
      const account = await api.getAccount();
      console.log(`   Логин: ${account.login || account.username || 'N/A'}`);
      console.log(`   Email: ${account.email || 'N/A'}`);
    } catch (e) {
      console.log('   ⚠️  Эндпоинт аккаунта недоступен (это нормально)');
    }

    console.log('\n✅ Проверка завершена!');

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('💡 Возможно, токен недействителен или истек срок действия');
    }
    process.exit(1);
  }
}

checkConnection();

