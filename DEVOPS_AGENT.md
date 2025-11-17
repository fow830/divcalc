# 🚀 DevOps Агент

Универсальная система управления деплоями и инфраструктурой для проекта.

## 📋 Возможности

- ✅ **Автоматический деплой** на stage и production окружения
- ✅ **Мониторинг здоровья** приложения и инфраструктуры
- ✅ **Управление версиями** с автоматическим обновлением
- ✅ **Откат (rollback)** к предыдущим версиям
- ✅ **Резервное копирование** перед критическими операциями
- ✅ **Просмотр логов** и статуса приложения
- ✅ **Проверка доступности** приложения через HTTP/HTTPS

## 🚀 Быстрый старт

### Использование через npm

```bash
# Деплой на stage
npm run deploy:stage

# Деплой на production
npm run deploy:prod

# Проверка статуса
npm run status:stage
npm run status:prod

# Проверка здоровья
npm run health:stage
npm run health:prod

# Просмотр логов
npm run logs:stage
npm run logs:prod
```

### Использование напрямую

```bash
# Показать справку
node scripts/deploy-agent.js help

# Список окружений
node scripts/deploy-agent.js list
```

## 📚 Команды

### Команды деплоя

```bash
# Деплой на окружение
node scripts/deploy-agent.js deploy [stage|production]

# Откат к предыдущему коммиту
node scripts/deploy-agent.js rollback [stage|production]

# Откат к конкретному коммиту
node scripts/deploy-agent.js rollback [stage|production] <commit-hash>
```

**Примеры:**
```bash
node scripts/deploy-agent.js deploy stage
node scripts/deploy-agent.js deploy production
node scripts/deploy-agent.js rollback stage
node scripts/deploy-agent.js rollback production abc1234
```

### Команды мониторинга

```bash
# Статус окружения
node scripts/deploy-agent.js status [stage|production]

# Логи приложения
node scripts/deploy-agent.js logs [stage|production] [--lines N]

# Проверка здоровья
node scripts/deploy-agent.js health [stage|production]
```

**Примеры:**
```bash
node scripts/deploy-agent.js status stage
node scripts/deploy-agent.js logs production --lines 100
node scripts/deploy-agent.js health production
```

### Команды управления

```bash
# Перезапуск приложения
node scripts/deploy-agent.js restart [stage|production]

# Создание резервной копии
node scripts/deploy-agent.js backup [stage|production]

# Список резервных копий
node scripts/deploy-agent.js backups [stage|production]
```

**Примеры:**
```bash
node scripts/deploy-agent.js restart stage
node scripts/deploy-agent.js backup production
node scripts/deploy-agent.js backups stage
```

### Команды версионирования

```bash
# Обновить версию (patch/minor/major)
node scripts/deploy-agent.js version [patch|minor|major]

# Информация о версии
node scripts/deploy-agent.js version:info
```

**Примеры:**
```bash
node scripts/deploy-agent.js version patch
node scripts/deploy-agent.js version minor
node scripts/deploy-agent.js version major
node scripts/deploy-agent.js version:info
```

## 🔧 Конфигурация

Окружения настраиваются в файле `scripts/deploy-agent.js`:

```javascript
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
    // ...
  }
};
```

## 🏥 Проверка здоровья

Команда `health` проверяет:

- ✅ SSH подключение к серверу
- ✅ Статус PM2 процесса
- ✅ Работа Nginx
- ✅ Доступность приложения (HTTP/HTTPS)
- ✅ Использование дискового пространства

**Пример вывода:**
```
🏥 Проверка здоровья окружения: PRODUCTION
============================================================

🔍 Проверка SSH подключения...
✅ SSH подключение работает

🔍 Проверка PM2...
✅ PM2 процесс запущен

🔍 Проверка Nginx...
✅ Nginx работает

🔍 Проверка доступности приложения...
✅ Приложение доступно: https://divcalc.flyplaza.ru

🔍 Проверка свободного места на диске...
✅ Использование диска: 45%

============================================================
✅ Все проверки пройдены успешно!
============================================================
```

## 💾 Резервное копирование

Агент автоматически создает резервные копии перед откатом. Резервные копии сохраняются в:
- `/var/backups/divcalc-stage/` - для stage окружения
- `/var/backups/divcalc-production/` - для production окружения

Формат имени: `backup-YYYYMMDD-HHMMSS.tar.gz`

## 🔄 Типичный workflow

### 1. Разработка и тестирование

```bash
# Локальная разработка
npm run dev

# Обновление версии
node scripts/deploy-agent.js version patch

# Деплой на stage
npm run deploy:stage

# Проверка здоровья
npm run health:stage
```

### 2. Деплой на production

```bash
# Создание резервной копии
node scripts/deploy-agent.js backup production

# Деплой
npm run deploy:prod

# Проверка здоровья
npm run health:prod
```

### 3. Откат при проблемах

```bash
# Откат к предыдущему коммиту
node scripts/deploy-agent.js rollback production

# Или к конкретному коммиту
node scripts/deploy-agent.js rollback production abc1234
```

## 📝 Логирование

Все операции логируются с цветным выводом:
- 🟢 Зеленый - успешные операции
- 🔴 Красный - ошибки
- 🟡 Желтый - предупреждения
- 🔵 Синий - информационные сообщения
- 🟣 Фиолетовый - шаги процесса

## 🔐 Требования

- SSH ключ должен быть настроен: `~/.ssh/sofa_calculator_deploy`
- Доступ к серверу по SSH
- Права на выполнение команд на сервере
- Git репозиторий должен быть доступен

## 🐛 Устранение неполадок

### Ошибка SSH подключения

```bash
# Проверьте SSH ключ
ssh -i ~/.ssh/sofa_calculator_deploy root@31.130.147.54
```

### Приложение не запускается

```bash
# Проверьте логи
node scripts/deploy-agent.js logs stage

# Перезапустите
node scripts/deploy-agent.js restart stage
```

### Проблемы с Nginx

```bash
# Проверьте статус
node scripts/deploy-agent.js health stage
```

## 📖 Дополнительная информация

- Полная документация проекта: `README.md`
- Workflow: `WORKFLOW_SIMPLE.md`
- Деплой: `DEPLOY_SERVER.md`

