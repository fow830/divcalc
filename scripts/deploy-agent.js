#!/usr/bin/env node

/**
 * 🚀 DevOps Агент - Универсальная система управления деплоями и инфраструктурой
 * 
 * Использование:
 *   node scripts/deploy-agent.js <команда> [окружение] [опции]
 * 
 * Примеры:
 *   node scripts/deploy-agent.js deploy stage
 *   node scripts/deploy-agent.js deploy production
 *   node scripts/deploy-agent.js status stage
 *   node scripts/deploy-agent.js logs production --lines 100
 *   node scripts/deploy-agent.js rollback stage
 *   node scripts/deploy-agent.js health production
 *   node scripts/deploy-agent.js version patch
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');
const https = require('https');

// Конфигурация окружений
const ENVIRONMENTS = {
  stage: {
    name: 'stage',
    serverIp: '31.130.147.54',
    serverUser: 'root',
    sshKey: '~/.ssh/sofa_calculator_deploy',
    projectDir: '/var/www/divcalc-stage',
    domain: 'stage-divcalc.flyplaza.ru',
    pm2Name: 'divcalc-stage',
    port: '3001',
    branch: 'stage',
    githubRepo: 'https://github.com/fow830/divcalc.git'
  },
  production: {
    name: 'production',
    serverIp: '31.130.147.54',
    serverUser: 'root',
    sshKey: '~/.ssh/sofa_calculator_deploy',
    projectDir: '/var/www/divcalc',
    domain: 'divcalc.flyplaza.ru',
    pm2Name: 'divcalc',
    port: '3000',
    branch: 'production',
    githubRepo: 'https://github.com/fow830/divcalc.git'
  }
};

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Класс для работы с SSH
class SSHClient {
  constructor(config) {
    this.config = config;
    this.sshKey = config.sshKey.replace('~', process.env.HOME);
  }

  execute(command, options = {}) {
    const { silent = false, ignoreErrors = false } = options;
    const sshCommand = `ssh -i ${this.sshKey} -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${this.config.serverUser}@${this.config.serverIp} "${command}"`;
    
    try {
      const result = execSync(sshCommand, { 
        encoding: 'utf-8',
        stdio: silent ? 'pipe' : 'inherit'
      });
      return { success: true, output: result };
    } catch (error) {
      if (ignoreErrors) {
        return { success: false, output: error.message };
      }
      throw error;
    }
  }

  executeScript(script) {
    // Используем base64 для безопасной передачи скрипта
    const encodedScript = Buffer.from(script).toString('base64');
    const command = `echo '${encodedScript}' | base64 -d | bash`;
    return this.execute(command);
  }

  checkConnection() {
    try {
      this.execute('echo "connected"', { silent: true });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Класс агента деплоя
class DeployAgent {
  constructor(environment) {
    if (!ENVIRONMENTS[environment]) {
      throw new Error(`Неизвестное окружение: ${environment}. Доступны: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    }
    this.config = ENVIRONMENTS[environment];
    this.ssh = new SSHClient(this.config);
    this.startTime = Date.now();
  }

  async deploy() {
    log(`\n${'='.repeat(60)}`, 'bright');
    log(`🚀 ДЕПЛОЙ АГЕНТ - ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}`, 'bright');
    log(`📁 Директория: ${this.config.projectDir}`, 'cyan');
    log(`🌐 Домен: ${this.config.domain}`, 'cyan');
    log(`🔌 Порт: ${this.config.port}`, 'cyan');
    log(`🌿 Ветка: ${this.config.branch}`, 'cyan');
    log(`${'='.repeat(60)}\n`, 'bright');

    try {
      // 1. Проверка подключения
      this.checkConnection();

      // 2. Подготовка сервера
      this.prepareServer();

      // 3. Деплой кода
      this.deployCode();

      // 4. Настройка Nginx
      this.setupNginx();

      // 5. Проверка статуса
      this.checkStatus();

      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      logSuccess(`\n🎉 Деплой завершен успешно за ${duration} секунд!`);
      log(`\n🌐 Приложение доступно: https://${this.config.domain}\n`, 'green');

    } catch (error) {
      logError(`Ошибка деплоя: ${error.message}`);
      process.exit(1);
    }
  }

  checkConnection() {
    logStep('🔍', 'Проверка SSH подключения...');
    if (!this.ssh.checkConnection()) {
      throw new Error('Не удалось подключиться к серверу');
    }
    logSuccess('SSH подключение установлено');
  }

  prepareServer() {
    logStep('📦', 'Подготовка сервера...');
    
    const script = `
      # Создаем директорию проекта
      sudo mkdir -p ${this.config.projectDir}
      sudo chown -R $USER:$USER ${this.config.projectDir}
      
      # Проверяем Node.js
      if ! command -v node &> /dev/null; then
        echo "📥 Устанавливаем Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
      fi
      
      # Проверяем PM2
      if ! command -v pm2 &> /dev/null; then
        echo "📥 Устанавливаем PM2..."
        sudo npm install -g pm2
      fi
      
      # Проверяем Git
      if ! command -v git &> /dev/null; then
        echo "📥 Устанавливаем Git..."
        sudo apt-get update
        sudo apt-get install -y git
      fi
      
      echo "✅ Node.js: $(node --version)"
      echo "✅ npm: $(npm --version)"
      echo "✅ PM2: $(pm2 --version 2>/dev/null || echo 'установлен')"
    `;

    this.ssh.executeScript(script);
    logSuccess('Сервер подготовлен');
  }

  deployCode() {
    logStep('📤', 'Деплой кода...');
    
    const script = `
      PROJECT_DIR="${this.config.projectDir}"
      GITHUB_REPO="${this.config.githubRepo}"
      BRANCH="${this.config.branch}"
      PORT="${this.config.port}"
      PM2_NAME="${this.config.pm2Name}"
      
      # Обновляем или клонируем проект
      if [ -d "$PROJECT_DIR/.git" ]; then
        echo "📥 Обновляем проект из GitHub (ветка $BRANCH)..."
        cd $PROJECT_DIR
        git fetch origin
        git checkout $BRANCH
        git reset --hard origin/$BRANCH
      else
        echo "📥 Клонируем проект из GitHub (ветка $BRANCH)..."
        rm -rf $PROJECT_DIR
        mkdir -p $PROJECT_DIR
        git clone -b $BRANCH $GITHUB_REPO $PROJECT_DIR
        cd $PROJECT_DIR
      fi
      
      echo "✅ Проект обновлен из ветки $BRANCH"
      
      # Устанавливаем зависимости
      echo "📦 Устанавливаем зависимости..."
      npm install
      
      # Собираем проект
      echo "🔨 Собираем проект..."
      APP_VERSION=$(node -p "require('./package.json').version")
      COMMIT_SHA=$(git rev-parse --short HEAD)
      COMMIT_DATE=$(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S')
      BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
      
      NEXT_PUBLIC_APP_VERSION="$APP_VERSION" \\
      NEXT_PUBLIC_GIT_COMMIT="$COMMIT_SHA" \\
      NEXT_PUBLIC_GIT_COMMIT_DATE="$COMMIT_DATE" \\
      NEXT_PUBLIC_GIT_BRANCH="$BRANCH_NAME" \\
        npm run build
      
      # Останавливаем старый процесс
      pm2 delete $PM2_NAME 2>/dev/null || true
      
      # Запускаем приложение
      echo "🚀 Запускаем приложение на порту $PORT..."
      PORT=$PORT pm2 start npm --name "$PM2_NAME" -- start
      pm2 save
      
      # Настраиваем автозапуск
      pm2 startup systemd -u $USER --hp /home/$USER | grep -v PM2 | sudo bash || true
      
      echo "✅ Приложение установлено и запущено!"
    `;

    this.ssh.executeScript(script);
    logSuccess('Код задеплоен');
  }

  setupNginx() {
    logStep('🌐', 'Настройка Nginx...');
    
    const nginxConfig = `
server {
    listen 80;
    server_name ${this.config.domain};

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${this.config.domain};

    ssl_certificate /etc/letsencrypt/live/${this.config.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${this.config.domain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:${this.config.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
    `.trim();

    const script = `
      DOMAIN="${this.config.domain}"
      
      # Устанавливаем Nginx если не установлен
      if ! command -v nginx &> /dev/null; then
        echo "📥 Устанавливаем Nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
      fi
      
      # Создаем конфигурацию
      cat << 'NGINX_CONFIG' | sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null
${nginxConfig}
NGINX_CONFIG
      
      # Активируем конфигурацию
      sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
      
      # Проверяем конфигурацию
      sudo nginx -t
      
      # Перезагружаем Nginx
      sudo systemctl reload nginx
      
      echo "✅ Nginx настроен!"
    `;

    this.ssh.executeScript(script);
    logSuccess('Nginx настроен');
  }

  checkStatus() {
    logStep('📊', 'Проверка статуса...');
    
    const result = this.ssh.execute(`pm2 status ${this.config.pm2Name}`, { silent: true });
    if (result.success) {
      logInfo('Статус приложения:');
      console.log(result.output);
    } else {
      logWarning('Не удалось получить статус PM2');
    }
  }

  async getStatus() {
    log(`\n📊 Статус окружения: ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'bright');

    if (!this.ssh.checkConnection()) {
      logError('Не удалось подключиться к серверу');
      return;
    }

    try {
      // Статус PM2
      logStep('🔍', 'Статус приложения (PM2)...');
      const pm2Status = this.ssh.execute(`pm2 describe ${this.config.pm2Name}`, { silent: true, ignoreErrors: true });
      if (pm2Status.success) {
        console.log(pm2Status.output);
      } else {
        logWarning('Приложение не запущено в PM2');
      }

      // Информация о коммите
      logStep('📝', 'Информация о версии...');
      const versionInfo = this.ssh.execute(`
        cd ${this.config.projectDir} && 
        echo "Ветка: $(git rev-parse --abbrev-ref HEAD)" &&
        echo "Коммит: $(git rev-parse --short HEAD)" &&
        echo "Дата: $(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S')" &&
        echo "Версия: $(node -p "require('./package.json').version" 2>/dev/null || echo 'N/A')"
      `, { silent: true, ignoreErrors: true });
      
      if (versionInfo.success) {
        console.log(versionInfo.output);
      }

      // Статус Nginx
      logStep('🌐', 'Статус Nginx...');
      const nginxStatus = this.ssh.execute('sudo systemctl status nginx --no-pager | head -5', { silent: true, ignoreErrors: true });
      if (nginxStatus.success) {
        console.log(nginxStatus.output);
      }

    } catch (error) {
      logError(`Ошибка при получении статуса: ${error.message}`);
    }
  }

  async getLogs(lines = 50) {
    log(`\n📋 Логи окружения: ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'bright');

    if (!this.ssh.checkConnection()) {
      logError('Не удалось подключиться к серверу');
      return;
    }

    try {
      logStep('📝', `Последние ${lines} строк логов...`);
      const logs = this.ssh.execute(`pm2 logs ${this.config.pm2Name} --lines ${lines} --nostream`, { silent: true, ignoreErrors: true });
      if (logs.success) {
        console.log(logs.output);
      } else {
        logWarning('Не удалось получить логи');
      }
    } catch (error) {
      logError(`Ошибка при получении логов: ${error.message}`);
    }
  }

  async restart() {
    log(`\n🔄 Перезапуск окружения: ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'bright');

    if (!this.ssh.checkConnection()) {
      logError('Не удалось подключиться к серверу');
      return;
    }

    try {
      logStep('🔄', 'Перезапуск приложения...');
      this.ssh.execute(`pm2 restart ${this.config.pm2Name}`);
      logSuccess('Приложение перезапущено');
      
      // Проверяем статус
      this.checkStatus();
    } catch (error) {
      logError(`Ошибка при перезапуске: ${error.message}`);
    }
  }

  async rollback(commitHash) {
    log(`\n⏪ Откат окружения: ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'bright');

    if (!this.ssh.checkConnection()) {
      logError('Не удалось подключиться к серверу');
      return;
    }

    try {
      logStep('📦', 'Создание резервной копии перед откатом...');
      const backupScript = `
        cd ${this.config.projectDir} &&
        BACKUP_DIR="/var/backups/divcalc-${this.config.name}"
        mkdir -p $BACKUP_DIR
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" .
        echo "✅ Резервная копия создана: $BACKUP_DIR/$BACKUP_NAME"
      `;
      this.ssh.executeScript(backupScript);

      logStep('⏪', `Откат к коммиту ${commitHash || 'предыдущему'}...`);
      const rollbackScript = `
        cd ${this.config.projectDir} &&
        git fetch origin &&
        if [ -n "${commitHash}" ]; then
          git checkout ${commitHash}
        else
          git checkout HEAD~1
        fi &&
        npm install &&
        APP_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown") &&
        COMMIT_SHA=$(git rev-parse --short HEAD) &&
        COMMIT_DATE=$(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S') &&
        BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD) &&
        NEXT_PUBLIC_APP_VERSION="$APP_VERSION" \\
        NEXT_PUBLIC_GIT_COMMIT="$COMMIT_SHA" \\
        NEXT_PUBLIC_GIT_COMMIT_DATE="$COMMIT_DATE" \\
        NEXT_PUBLIC_GIT_BRANCH="$BRANCH_NAME" \\
          npm run build &&
        pm2 restart ${this.config.pm2Name}
      `;
      this.ssh.executeScript(rollbackScript);
      logSuccess('Откат выполнен успешно');
      
      this.checkStatus();
    } catch (error) {
      logError(`Ошибка при откате: ${error.message}`);
    }
  }

  async healthCheck() {
    log(`\n🏥 Проверка здоровья окружения: ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'bright');

    const checks = {
      ssh: false,
      pm2: false,
      nginx: false,
      app: false,
      disk: false
    };

    // Проверка SSH
    logStep('🔍', 'Проверка SSH подключения...');
    checks.ssh = this.ssh.checkConnection();
    if (checks.ssh) {
      logSuccess('SSH подключение работает');
    } else {
      logError('SSH подключение не работает');
      return checks;
    }

    // Проверка PM2
    logStep('🔍', 'Проверка PM2...');
    const pm2Check = this.ssh.execute(`pm2 describe ${this.config.pm2Name}`, { silent: true, ignoreErrors: true });
    checks.pm2 = pm2Check.success;
    if (checks.pm2) {
      logSuccess('PM2 процесс запущен');
    } else {
      logError('PM2 процесс не найден');
    }

    // Проверка Nginx
    logStep('🔍', 'Проверка Nginx...');
    const nginxCheck = this.ssh.execute('sudo systemctl is-active nginx', { silent: true, ignoreErrors: true });
    checks.nginx = nginxCheck.success && nginxCheck.output.trim() === 'active';
    if (checks.nginx) {
      logSuccess('Nginx работает');
    } else {
      logError('Nginx не работает');
    }

    // Проверка приложения
    logStep('🔍', 'Проверка доступности приложения...');
    try {
      const url = `https://${this.config.domain}`;
      const response = await this.httpCheck(url);
      checks.app = response;
      if (checks.app) {
        logSuccess(`Приложение доступно: ${url}`);
      } else {
        logError(`Приложение недоступно: ${url}`);
      }
    } catch (error) {
      logError(`Ошибка проверки приложения: ${error.message}`);
    }

    // Проверка диска
    logStep('🔍', 'Проверка свободного места на диске...');
    const diskCheck = this.ssh.execute(`df -h ${this.config.projectDir} | tail -1 | awk '{print $5}' | sed 's/%//'`, { silent: true, ignoreErrors: true });
    if (diskCheck.success) {
      const usage = parseInt(diskCheck.output.trim());
      checks.disk = usage < 90;
      if (checks.disk) {
        logSuccess(`Использование диска: ${usage}%`);
      } else {
        logWarning(`Использование диска: ${usage}% (критично!)`);
      }
    }

    // Итоговый статус
    log(`\n${'='.repeat(60)}`, 'bright');
    const allOk = Object.values(checks).every(v => v);
    if (allOk) {
      logSuccess('✅ Все проверки пройдены успешно!');
    } else {
      logError('❌ Некоторые проверки не пройдены');
    }
    log(`${'='.repeat(60)}\n`, 'bright');

    return checks;
  }

  httpCheck(url) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: 'GET',
        timeout: 5000,
        rejectUnauthorized: false
      };

      const req = httpModule.request(options, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  async getBackups() {
    log(`\n💾 Резервные копии окружения: ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'bright');

    if (!this.ssh.checkConnection()) {
      logError('Не удалось подключиться к серверу');
      return;
    }

    try {
      const backups = this.ssh.execute(`ls -lh /var/backups/divcalc-${this.config.name}/*.tar.gz 2>/dev/null | tail -10 || echo "Резервные копии не найдены"`, { silent: true, ignoreErrors: true });
      if (backups.success) {
        console.log(backups.output);
      } else {
        logWarning('Резервные копии не найдены');
      }
    } catch (error) {
      logError(`Ошибка при получении списка резервных копий: ${error.message}`);
    }
  }

  async createBackup() {
    log(`\n💾 Создание резервной копии: ${this.config.name.toUpperCase()}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'bright');

    if (!this.ssh.checkConnection()) {
      logError('Не удалось подключиться к серверу');
      return;
    }

    try {
      logStep('📦', 'Создание резервной копии...');
      const backupScript = `
        cd ${this.config.projectDir} &&
        BACKUP_DIR="/var/backups/divcalc-${this.config.name}"
        mkdir -p $BACKUP_DIR
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" . &&
        echo "✅ Резервная копия создана: $BACKUP_DIR/$BACKUP_NAME" &&
        ls -lh "$BACKUP_DIR/$BACKUP_NAME"
      `;
      this.ssh.executeScript(backupScript);
      logSuccess('Резервная копия создана успешно');
    } catch (error) {
      logError(`Ошибка при создании резервной копии: ${error.message}`);
    }
  }
}

// Функции управления версиями
class VersionManager {
  static getCurrentVersion() {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.version;
    } catch (error) {
      return null;
    }
  }

  static async bumpVersion(type = 'patch') {
    if (!['major', 'minor', 'patch'].includes(type)) {
      throw new Error('Тип версии должен быть: major, minor или patch');
    }

    logStep('📦', `Обновление версии (${type})...`);
    
    try {
      execSync(`./scripts/bump-version.sh ${type}`, { stdio: 'inherit' });
      const newVersion = this.getCurrentVersion();
      logSuccess(`Версия обновлена до ${newVersion}`);
      return newVersion;
    } catch (error) {
      logError(`Ошибка при обновлении версии: ${error.message}`);
      throw error;
    }
  }

  static getVersionInfo() {
    const version = this.getCurrentVersion();
    let gitInfo = {};
    
    try {
      gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
      gitInfo.commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      gitInfo.date = execSync('git log -1 --format=%cd --date=format:\'%Y-%m-%d %H:%M:%S\'', { encoding: 'utf-8' }).trim();
    } catch (error) {
      // Git не доступен
    }

    return { version, ...gitInfo };
  }
}

// Главная функция
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const environment = args[1] || 'stage';

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(`
🚀 DevOps Агент - Универсальная система управления деплоями и инфраструктурой

Использование:
  node scripts/deploy-agent.js <команда> [окружение] [опции]

Команды деплоя:
  deploy [stage|production]        Деплой на указанное окружение
  rollback [stage|production] [commit]  Откат к предыдущему коммиту или указанному
  
Команды мониторинга:
  status [stage|production]        Показать статус окружения
  logs [stage|production]          Показать логи приложения
  health [stage|production]        Проверка здоровья окружения
  
Команды управления:
  restart [stage|production]       Перезапустить приложение
  backup [stage|production]        Создать резервную копию
  backups [stage|production]       Список резервных копий
  
Команды версионирования:
  version [patch|minor|major]      Обновить версию проекта
  version:info                      Показать информацию о версии
  
Утилиты:
  list                              Список доступных окружений
  help                              Показать эту справку

Примеры:
  node scripts/deploy-agent.js deploy stage
  node scripts/deploy-agent.js deploy production
  node scripts/deploy-agent.js status stage
  node scripts/deploy-agent.js logs production --lines 100
  node scripts/deploy-agent.js health production
  node scripts/deploy-agent.js rollback stage
  node scripts/deploy-agent.js version patch
  node scripts/deploy-agent.js backup production

Окружения:
  stage       - Тестовое окружение (stage-divcalc.flyplaza.ru)
  production  - Продакшн окружение (divcalc.flyplaza.ru)
    `);
    return;
  }

  if (command === 'list') {
    log('\n📋 Доступные окружения:\n', 'bright');
    Object.entries(ENVIRONMENTS).forEach(([key, config]) => {
      log(`${key.toUpperCase()}:`, 'cyan');
      log(`  Домен: ${config.domain}`);
      log(`  Порт: ${config.port}`);
      log(`  Ветка: ${config.branch}`);
      log(`  PM2: ${config.pm2Name}\n`);
    });
    return;
  }

  // Команды версионирования (не требуют окружения)
  if (command === 'version') {
    const versionType = args[1] || 'patch';
    try {
      await VersionManager.bumpVersion(versionType);
    } catch (error) {
      logError(error.message);
      process.exit(1);
    }
    return;
  }

  if (command === 'version:info') {
    const info = VersionManager.getVersionInfo();
    log('\n📦 Информация о версии:\n', 'bright');
    log(`Версия: ${info.version || 'N/A'}`, 'cyan');
    log(`Ветка: ${info.branch || 'N/A'}`, 'cyan');
    log(`Коммит: ${info.commit || 'N/A'}`, 'cyan');
    log(`Дата: ${info.date || 'N/A'}`, 'cyan');
    return;
  }

  try {
    const agent = new DeployAgent(environment);

    switch (command) {
      case 'deploy':
        await agent.deploy();
        break;
      case 'status':
        await agent.getStatus();
        break;
      case 'logs':
        const lines = args.includes('--lines') ? parseInt(args[args.indexOf('--lines') + 1]) : 50;
        await agent.getLogs(lines);
        break;
      case 'restart':
        await agent.restart();
        break;
      case 'rollback':
        const commitHash = args[2];
        await agent.rollback(commitHash);
        break;
      case 'health':
        await agent.healthCheck();
        break;
      case 'backup':
        await agent.createBackup();
        break;
      case 'backups':
        await agent.getBackups();
        break;
      default:
        logError(`Неизвестная команда: ${command}`);
        log('Используйте "help" для справки', 'yellow');
        process.exit(1);
    }
  } catch (error) {
    logError(error.message);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main().catch(error => {
    logError(`Критическая ошибка: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { DeployAgent, ENVIRONMENTS };

