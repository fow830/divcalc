#!/bin/bash

# Скрипт для деплоя stage ветки на сервер 31.130.147.54
# Субдомен: stage-divcalc.flyplaza.ru

set -e

SERVER_IP="31.130.147.54"
SERVER_USER="root"
SSH_KEY="~/.ssh/sofa_calculator_deploy"
PROJECT_DIR="/var/www/divcalc-stage"
DOMAIN="stage-divcalc.flyplaza.ru"
PM2_NAME="divcalc-stage"
PORT="3001"

echo "🚀 Начинаем деплой STAGE на сервер $SERVER_IP..."
echo "📁 Директория проекта: $PROJECT_DIR"
echo "🌐 Домен: $DOMAIN"
echo "🔌 Порт: $PORT"
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
    sudo mkdir -p /var/www/divcalc-stage
    sudo chown -R $USER:$USER /var/www/divcalc-stage
    
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
echo "📤 Клонируем/обновляем проект из GitHub (stage branch)..."

# Клонируем или обновляем проект на сервере
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP bash -s << ENDSSH
    PROJECT_DIR="$PROJECT_DIR"
    GITHUB_REPO="https://github.com/fow830/divcalc.git"
    BRANCH="stage"
    PORT="$PORT"
    
    if [ -d "\$PROJECT_DIR/.git" ]; then
        echo "📥 Обновляем проект из GitHub (ветка \$BRANCH)..."
        cd \$PROJECT_DIR
        git fetch origin
        git checkout \$BRANCH
        # Сбрасываем локальные изменения перед pull
        git reset --hard origin/\$BRANCH
    else
        echo "📥 Клонируем проект из GitHub (ветка \$BRANCH)..."
        rm -rf \$PROJECT_DIR
        mkdir -p \$PROJECT_DIR
        git clone -b \$BRANCH \$GITHUB_REPO \$PROJECT_DIR
        cd \$PROJECT_DIR
    fi
    
    echo "✅ Проект обновлен из ветки \$BRANCH"
    
    # Устанавливаем зависимости (включая dev для сборки)
    echo "📦 Устанавливаем зависимости..."
    npm install
    
    # Собираем проект с передачей мета-информации через env
    echo "🔨 Собираем проект..."
    APP_VERSION=\$(node -p "require('./package.json').version")
    COMMIT_SHA=\$(git rev-parse --short HEAD)
    COMMIT_DATE=\$(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M:%S')
    BRANCH_NAME=\$(git rev-parse --abbrev-ref HEAD)

    NEXT_PUBLIC_APP_VERSION="\$APP_VERSION" \\
    NEXT_PUBLIC_GIT_COMMIT="\$COMMIT_SHA" \\
    NEXT_PUBLIC_GIT_COMMIT_DATE="\$COMMIT_DATE" \\
    NEXT_PUBLIC_GIT_BRANCH="\$BRANCH_NAME" \\
      npm run build
    
    # Останавливаем старый процесс если есть
    pm2 delete $PM2_NAME 2>/dev/null || true
    
    # Запускаем приложение на порту 3001
    echo "🚀 Запускаем приложение на порту \$PORT..."
    PORT=\$PORT pm2 start npm --name "$PM2_NAME" -- start
    pm2 save
    
    # Настраиваем автозапуск
    pm2 startup systemd -u $USER --hp /home/$USER | grep -v PM2 | sudo bash || true
    
    echo "✅ Приложение установлено и запущено!"
ENDSSH

# Настраиваем Nginx
echo ""
echo "🌐 Настраиваем Nginx..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP bash -s << ENDSSH
    DOMAIN="$DOMAIN"
    PORT="$PORT"
    # Устанавливаем Nginx если не установлен
    if ! command -v nginx &> /dev/null; then
        echo "📥 Устанавливаем Nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
    fi
    
    # Создаем конфигурацию Nginx
    cat << 'NGINX_CONFIG' | sudo tee /etc/nginx/sites-available/\$DOMAIN > /dev/null
server {
    listen 80;
    server_name stage-divcalc.flyplaza.ru;

    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stage-divcalc.flyplaza.ru;

    ssl_certificate /etc/letsencrypt/live/stage-divcalc.flyplaza.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stage-divcalc.flyplaza.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_CONFIG

    # Активируем конфигурацию
    sudo ln -sf /etc/nginx/sites-available/\$DOMAIN /etc/nginx/sites-enabled/
    
    # Проверяем конфигурацию
    sudo nginx -t
    
    # Перезагружаем Nginx
    sudo systemctl reload nginx
    
    echo "✅ Nginx настроен!"
ENDSSH

echo ""
echo "✅ Деплой STAGE завершен успешно!"
echo ""
echo "🌐 Приложение доступно по адресу: https://$DOMAIN"
echo ""
echo "📋 Полезные команды:"
echo "   Проверка статуса: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "   Просмотр логов: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 logs $PM2_NAME'"
echo "   Перезапуск: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP 'pm2 restart $PM2_NAME'"

