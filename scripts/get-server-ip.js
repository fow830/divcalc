#!/usr/bin/env node

/**
 * Получение IP адресов серверов Timeweb Cloud
 */

const { TimewebAPI } = require('./timeweb-api');

const TOKEN = process.env.TIMEWEB_TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoid2EzNzA5MjkiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiJlMDk2MDVjNi01MWU1LTQ0YjItYTI4OC05ZjY1NmRmM2E2NTciLCJpYXQiOjE3NjMzMTQ2NTZ9.r7aQthQbIdQFVz1uouCjTowoJHCUwBq8aX46tEAtn3SYNMIICHjXsFy8c9JndgpBWc9eyIfn_QYuWO_89tQQ8Rx5NtbU-qxXlzZlxBjKdlaqfh1HSj9Hai7QmS6PFsHM4sWzaabvUKjgAQz-q1SuNUxi-U05f6ka3osUV7gKR980Te5eO6r784akAfjN3-cok0OIUWYEhCD4prNvsU39aAGI5rW7DTlpVZBPi9hyT2kpvRsGUpCwsd7XWCifb088d78sVVzDgFrjY6Eh6Hmv1M3ZcI_PySfOCvc1AgyHRGO17xJiW29cNszJrBnMy3VP0bq9-u2dmO08sGr9clkoN-VmZNkMy--PA-xxIxvPxyfKKFNEk4XZ3oTnIRJ2O_P0p_bCVHfVjnQvvZGMuenLW9L1pfKFPalZcUJFfNiCi6D6fPlEyC46EkM-FBXYieCDsgnSM7EPJP5_shAX2ilsvfc23p2oJnzoWnzNW7SJXCz9PDQPX9jh4ZH7p28Q3vyD';

const api = new TimewebAPI(TOKEN);

async function getServerIPs() {
  try {
    const serversResponse = await api.getServers();
    const servers = serversResponse.servers || serversResponse.data || serversResponse || [];
    
    console.log('🖥️  IP адреса серверов:\n');
    
    for (const server of servers) {
      console.log(`${server.name || `Server #${server.id}`} (ID: ${server.id}):`);
      
      try {
        const details = await api.getServer(server.id);
        const serverData = details.server || details;
        
        if (serverData.ip) {
          const ips = Array.isArray(serverData.ip) ? serverData.ip : [serverData.ip];
          ips.forEach(ip => {
            console.log(`   📍 ${ip}`);
            console.log(`   🔗 ssh -i ~/.ssh/sofa_calculator_deploy root@${ip}`);
          });
        } else {
          console.log('   ⚠️  IP адрес не найден в ответе API');
          console.log('   💡 Получите IP через панель управления Timeweb Cloud');
        }
      } catch (e) {
        console.log(`   ⚠️  Не удалось получить детали: ${e.message}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

getServerIPs();

