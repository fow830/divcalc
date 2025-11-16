# Деплой на сервер 31.130.147.54

## 📋 Информация о сервере

- **IP адрес**: 31.130.147.54
- **Домен**: divcalc.flyplaza.ru
- **Директория проекта**: `/var/www/divcalc`
- **SSH ключ**: `~/.ssh/sofa_calculator_deploy`

## 🚀 Быстрый деплой

### Автоматический деплой (рекомендуется)

```bash
chmod +x scripts/deploy-to-server.sh
./scripts/deploy-to-server.sh
```

Скрипт автоматически:
1. ✅ Проверит SSH подключение
2. ✅ Установит Node.js 20 (если не установлен)
3. ✅ Установит PM2 и Git (если не установлены)
4. ✅ Создаст директорию `/var/www/divcalc`
5. ✅ Скопирует файлы проекта
6. ✅ Установит зависимости и соберет проект
7. ✅ Запустит приложение через PM2
8. ✅ Настроит Nginx для субдомена

## 📝 Ручной деплой

### 1. Подключение к серверу

```bash
ssh -i ~/.ssh/sofa_calculator_deploy root@31.130.147.54
```

### 2. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка Git
sudo apt-get install -y git

# Установка Nginx
sudo apt-get install -y nginx
```

### 3. Создание директории проекта

```bash
sudo mkdir -p /var/www/divcalc
sudo chown -R $USER:$USER /var/www/divcalc
cd /var/www/divcalc
```

### 4. Клонирование/копирование проекта

**Вариант A: Если есть Git репозиторий**
```bash
git clone <ваш-репозиторий> /var/www/divcalc
cd /var/www/divcalc
```

**Вариант B: Копирование файлов**
```bash
# На локальной машине создайте архив
tar --exclude='node_modules' --exclude='.next' --exclude='.git' \
    -czf sofa-calculator.tar.gz .

# Скопируйте на сервер
scp -i ~/.ssh/sofa_calculator_deploy sofa-calculator.tar.gz root@31.130.147.54:/tmp/

# На сервере распакуйте
cd /var/www/divcalc
tar -xzf /tmp/sofa-calculator.tar.gz
```

### 5. Установка и сборка

```bash
cd /var/www/divcalc

# Установка зависимостей
npm ci --production

# Сборка проекта
npm run build
```

### 6. Запуск с PM2

```bash
# Запуск приложения
pm2 start npm --name "divcalc" -- start

# Сохранение конфигурации
pm2 save

# Настройка автозапуска
pm2 startup systemd -u $USER --hp /home/$USER
# Выполните команду, которую выведет PM2
```

### 7. Настройка Nginx

```bash
# Создание конфигурации
sudo nano /etc/nginx/sites-available/divcalc.flyplaza.ru
```

Вставьте содержимое из `scripts/nginx-config.conf` или:

```nginx
server {
    listen 80;
    server_name divcalc.flyplaza.ru;

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

Активация конфигурации:

```bash
# Активация
sudo ln -s /etc/nginx/sites-available/divcalc.flyplaza.ru /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

### 8. Настройка файрвола (если используется)

```bash
# Разрешить HTTP
sudo ufw allow 80/tcp

# Проверка статуса
sudo ufw status
```

## 🔧 Управление приложением

### PM2 команды

```bash
# Статус
pm2 status

# Логи
pm2 logs divcalc

# Перезапуск
pm2 restart divcalc

# Остановка
pm2 stop divcalc

# Удаление
pm2 delete divcalc
```

### Обновление приложения

```bash
cd /var/www/divcalc

# Если используется Git
git pull

# Установка зависимостей
npm ci --production

# Пересборка
npm run build

# Перезапуск
pm2 restart divcalc
```

## 🔍 Проверка работы

1. **Проверка приложения:**
   ```bash
   curl http://localhost:3000
   ```

2. **Проверка PM2:**
   ```bash
   pm2 status
   pm2 logs divcalc --lines 50
   ```

3. **Проверка Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Проверка домена:**
   Откройте в браузере: http://divcalc.flyplaza.ru

## 🔐 Безопасность

### Настройка SSL (Let's Encrypt) - опционально

```bash
# Установка Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d divcalc.flyplaza.ru

# Автоматическое обновление
sudo certbot renew --dry-run
```

## 🆘 Troubleshooting

### Приложение не запускается

```bash
# Проверьте логи
pm2 logs divcalc

# Проверьте порт
sudo netstat -tulpn | grep 3000

# Проверьте переменные окружения
pm2 env divcalc
```

### Nginx не работает

```bash
# Проверьте конфигурацию
sudo nginx -t

# Проверьте логи
sudo tail -f /var/log/nginx/error.log

# Проверьте статус
sudo systemctl status nginx
```

### Домен не открывается

1. Проверьте DNS: `nslookup divcalc.flyplaza.ru`
2. Проверьте файрвол: `sudo ufw status`
3. Проверьте Nginx: `sudo systemctl status nginx`
4. Проверьте логи: `sudo tail -f /var/log/nginx/access.log`

## 📊 Мониторинг

### Просмотр статистики PM2

```bash
pm2 monit
```

### Просмотр использования ресурсов

```bash
pm2 list
pm2 info divcalc
```

## 📝 Структура на сервере

```
/var/www/divcalc/
├── app/
├── components/
├── lib/
├── public/
├── .next/
├── node_modules/
├── package.json
└── ...
```

## ✅ Чек-лист после деплоя

- [ ] Приложение запущено: `pm2 status`
- [ ] Приложение доступно локально: `curl http://localhost:3000`
- [ ] Nginx настроен: `sudo nginx -t`
- [ ] Домен открывается: http://divcalc.flyplaza.ru
- [ ] Логи без ошибок: `pm2 logs divcalc`
- [ ] Автозапуск настроен: `pm2 startup`

