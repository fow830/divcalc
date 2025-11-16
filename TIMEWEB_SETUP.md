# Настройка для Timeweb Cloud

## ✅ Что готово

1. **SSH ключ создан**
   - Приватный: `~/.ssh/sofa_calculator_deploy`
   - Публичный: `~/.ssh/sofa_calculator_deploy.pub`
   - Публичный ключ для добавления на сервер:
     ```
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDj2TYDq+ZVw+ijBJjx5SOSQcAjQk7FkrxXuhSGxiclw sofa-calculator-deploy
     ```

2. **API Timeweb Cloud подключен**
   - Токен сохранен в скриптах
   - Найдено серверов: **2**
     - Humble Finch (ID: 6012153) - Ubuntu
     - Witty Macaw (ID: 6017127) - Ubuntu

3. **Скрипты для работы с API**
   - `scripts/timeweb-api.js` - клиент API
   - `scripts/check-timeweb.js` - проверка подключения
   - `scripts/get-server-ip.js` - получение IP адресов
   - `scripts/deploy-timeweb.js` - скрипт деплоя

## 📋 Следующие шаги

### 1. Получите IP адрес сервера

IP адреса можно получить:
- Через панель управления Timeweb Cloud
- Или выполните: `node scripts/get-server-ip.js` (может не показать IP, если API не возвращает)

### 2. Добавьте SSH ключ на сервер

На сервере выполните:
```bash
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDj2TYDq+ZVw+ijBJjx5SOSQcAjQk7FkrxXuhSGxiclw sofa-calculator-deploy" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Подключитесь к серверу

```bash
ssh -i ~/.ssh/sofa_calculator_deploy root@<IP_СЕРВЕРА>
```

### 4. Следуйте инструкциям в TIMEWEB_DEPLOY.md

Подробная инструкция по деплою находится в файле `TIMEWEB_DEPLOY.md`.

## 🔧 Полезные команды

### Проверка подключения к API
```bash
node scripts/check-timeweb.js
```

### Получение списка серверов
```bash
node scripts/get-server-ip.js
```

### Запуск деплоя (покажет инструкции)
```bash
node scripts/deploy-timeweb.js
```

## 🔐 Безопасность

⚠️ **Важно**: 
- Токен API хранится в скриптах. Для продакшена лучше использовать переменные окружения:
  ```bash
  export TIMEWEB_TOKEN="ваш-токен"
  ```
- Не коммитьте токен в git репозиторий
- Добавьте `.env` в `.gitignore` если будете использовать переменные окружения

## 📚 Документация

- API Timeweb Cloud: https://timeweb.cloud/api-docs
- Документация: https://timeweb.cloud/docs

## 🆘 Поддержка

Если возникнут проблемы:
1. Проверьте подключение: `node scripts/check-timeweb.js`
2. Убедитесь, что токен действителен
3. Проверьте права доступа SSH ключа
4. Смотрите `TIMEWEB_DEPLOY.md` для детальных инструкций

