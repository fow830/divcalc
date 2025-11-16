#!/bin/bash

# Скрипт для деплоя на сервер 31.130.147.54
# Субдомен: divcalc.flyplaza.ru

set -e

SERVER_IP="31.130.147.54"
SERVER_USER="root"
SSH_KEY="~/.ssh/sofa_calculator_deploy"
PROJECT_DIR="/var/www/divcalc"
DOMAIN="divcalc.flyplaza.ru"

echo "🚀 Начинаем деплой на сервер $SERVER_IP..."
echo "📁 Директория проекта: $PROJECT_DIR"
echo "🌐 Домен: $DOMAIN"
echo ""

# Проверка SSH подключения
echo "🔍 Проверяем SSH подключение..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo '✅ SSH подключение успешно'" || {
    echo "❌ Ошибка подключения к серверу"
    exit 1
}

echo ""
echo "📦 Подготавливаем сервер..."

# Создаем директорию проекта
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
    # Создаем директорию проекта
    sudo mkdir -p /var/www/divcalc
    sudo chown -R $USER:$USER /var/www/divcalc
    
    # Проверяем наличие Node.js
    if ! command -v node &> /dev/null; then
        echo "📥 Устанавливаем Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Проверяем версию Node.js
    echo "✅ Node.js версия: $(node --version)"
    echo "✅ npm версия: $(npm --version)"
    
    # Устанавливаем PM2 если не установлен
    if ! command -v pm2 &> /dev/null; then
        echo "📥 Устанавливаем PM2..."
        sudo npm install -g pm2
    fi
    
    # Устанавливаем Git если не установлен
    if ! command -v git &> /dev/null; then
        echo "📥 Устанавливаем Git..."
        sudo apt-get update
        sudo apt-get install -y git
    fi
ENDSSH

echo ""
echo "📤 Копируем файлы проекта на сервер..."

# Создаем временный архив проекта
echo "📦 Создаем архив проекта..."
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='excel-data.json' \
    --exclude='read-excel.js' \
    --exclude='калькуляция.xlsx' \
    -czf /tmp/sofa-calculator.tar.gz .

# Копируем архив на сервер
echo "📤 Загружаем архив на сервер..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no /tmp/sofa-calculator.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Распаковываем и устанавливаем на сервере
echo "📥 Распаковываем и устанавливаем на сервере..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP bash -s << ENDSSH
    PROJECT_DIR="$PROJECT_DIR"
    cd \$PROJECT_DIR
    
    # Распаковываем архив
    tar -xzf /tmp/sofa-calculator.tar.gz
    
    # Устанавливаем зависимости (включая dev для сборки)
    echo "📦 Устанавливаем зависимости..."
    npm install
    
    # Собираем проект
    echo "🔨 Собираем проект..."
    npm run build
    
    # Останавливаем старый процесс если есть
    pm2 delete divcalc 2>/dev/null || true
    
    # Запускаем приложение
    echo "🚀 Запускаем приложение..."
    pm2 start npm --name "divcalc" -- start
    pm2 save
    
    # Настраиваем автозапуск
    pm2 startup systemd -u $USER --hp /home/$USER | grep -v PM2 | sudo bash || true
    
    # Очищаем временный файл
    rm -f /tmp/sofa-calculator.tar.gz
    
    echo "✅ Приложение установлено и запущено!"
ENDSSH

# Настраиваем Nginx
echo ""
echo "🌐 Настраиваем Nginx..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP bash -s << ENDSSH
    DOMAIN="$DOMAIN"
    # Устанавливаем Nginx если не установлен
    if ! command -v nginx &> /dev/null; then
        echo "📥 Устанавливаем Nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
    fi
    
    # Создаем конфигурацию Nginx
    sudo tee /etc/nginx/sites-available/\$DOMAIN > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name divcalc.flyplaza.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_CONFIG

    # Активируем конфигурацию
    sudo ln -sf /etc/nginx/sites-available/\$DOMAIN /etc/nginx/sites-enabled/
    
    # Удаляем дефолтную конфигурацию если она активна
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Проверяем конфигурацию
    sudo nginx -t
    
    # Перезагружаем Nginx
    sudo systemctl reload nginx
    
    echo "✅ Nginx настроен!"
ENDSSH

# Очищаем локальный архив
rm -f /tmp/sofa-calculator.tar.gz

echo ""
echo "✅ Деплой завершен успешно!"
echo ""
echo "🌐 Приложение доступно по адресу: http://$DOMAIN"
echo ""
echo "📋 Полезные команды:"
echo "   Проверка статуса: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "   Просмотр логов: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 logs divcalc'"
echo "   Перезапуск: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 restart divcalc'"

