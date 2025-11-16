# Деплой на Timeweb Cloud

## ✅ Подключение к API

API Timeweb Cloud успешно подключен. Найдено серверов: **2**

### Доступные серверы:
1. **Humble Finch** (ID: 6012153) - Ubuntu, статус: on
2. **Witty Macaw** (ID: 6017127) - Ubuntu, статус: on

## 📋 Инструкция по деплою

### 1. Получите IP адрес сервера

Выполните:
```bash
node scripts/check-timeweb.js
```

Или получите IP через панель управления Timeweb Cloud.

### 2. Подключитесь к серверу по SSH

```bash
ssh -i ~/.ssh/sofa_calculator_deploy root@<IP_СЕРВЕРА>
```

**Важно**: Убедитесь, что публичный ключ добавлен на сервер в `~/.ssh/authorized_keys`

### 3. Настройка сервера

#### Установка Node.js 20+

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version
npm --version
```

#### Установка Git (если не установлен)

```bash
sudo apt install -y git
```

#### Установка PM2 для управления процессом

```bash
sudo npm install -g pm2
```

### 4. Деплой приложения

#### Клонирование репозитория

```bash
# Создайте директорию для приложения
sudo mkdir -p /var/www
cd /var/www

# Клонируйте репозиторий (замените на ваш URL)
git clone <ваш-репозиторий> sofa-calculator
cd sofa-calculator
```

#### Установка зависимостей и сборка

```bash
# Установка зависимостей
npm ci --production

# Сборка проекта
npm run build
```

#### Запуск приложения

```bash
# Запуск с PM2
pm2 start npm --name "sofa-calculator" -- start

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке
pm2 startup
# Выполните команду, которую выведет PM2
```

### 5. Настройка Nginx (опционально)

Если нужен веб-сервер перед приложением:

```bash
# Установка Nginx
sudo apt install -y nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/sofa-calculator
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Замените на ваш домен или IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активация:
```bash
sudo ln -s /etc/nginx/sites-available/sofa-calculator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Настройка файрвола (если используется)

```bash
# Разрешить HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Если нужен прямой доступ к приложению
sudo ufw allow 3000/tcp
```

## 🔧 Полезные команды PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs sofa-calculator

# Перезапуск
pm2 restart sofa-calculator

# Остановка
pm2 stop sofa-calculator

# Удаление из PM2
pm2 delete sofa-calculator
```

## 🔍 Проверка работы

После деплоя проверьте:

1. Приложение запущено:
   ```bash
   pm2 status
   ```

2. Приложение доступно:
   ```bash
   curl http://localhost:3000
   ```

3. Логи без ошибок:
   ```bash
   pm2 logs sofa-calculator --lines 50
   ```

## 📝 Обновление приложения

```bash
cd /var/www/sofa-calculator
git pull
npm ci --production
npm run build
pm2 restart sofa-calculator
```

## 🔐 Безопасность

1. **Не храните токены в коде** - используйте переменные окружения
2. **Настройте SSH ключи** - отключите парольную аутентификацию
3. **Обновите систему** - регулярно обновляйте пакеты
4. **Настройте файрвол** - разрешите только необходимые порты
5. **Используйте HTTPS** - настройте SSL сертификат (Let's Encrypt)

## 🆘 Troubleshooting

### Приложение не запускается

```bash
# Проверьте логи
pm2 logs sofa-calculator

# Проверьте, что порт 3000 свободен
sudo netstat -tulpn | grep 3000

# Проверьте переменные окружения
pm2 env sofa-calculator
```

### Ошибки при сборке

```bash
# Очистите кэш и пересоберите
rm -rf .next node_modules
npm install
npm run build
```

### Проблемы с правами доступа

```bash
# Убедитесь, что у пользователя есть права на директорию
sudo chown -R $USER:$USER /var/www/sofa-calculator
```

