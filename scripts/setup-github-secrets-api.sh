#!/bin/bash

# Альтернативный скрипт для настройки GitHub Secrets через API
# Требует GitHub Personal Access Token с правами repo

set -e

REPO_OWNER="fow830"
REPO_NAME="divcalc"
SSH_KEY_PATH="$HOME/.ssh/sofa_calculator_deploy"

echo "🔐 Настройка GitHub Secrets через API"
echo ""

# Проверка SSH ключа
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH ключ не найден: $SSH_KEY_PATH"
    exit 1
fi

# Запрос токена
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  Необходим GitHub Personal Access Token"
    echo "Создайте токен: https://github.com/settings/tokens"
    echo "Требуемые права: repo (полный доступ к репозиторию)"
    echo ""
    read -sp "Введите GitHub Token: " GITHUB_TOKEN
    echo ""
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Токен не предоставлен"
    exit 1
fi

# Функция для установки secret через GitHub API
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo "📝 Устанавливаю $secret_name..."
    
    # Получаем публичный ключ репозитория
    local key_id=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/public-key" | \
        jq -r '.key_id')
    
    local key=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/public-key" | \
        jq -r '.key')
    
    if [ "$key_id" == "null" ] || [ -z "$key" ]; then
        echo "❌ Не удалось получить публичный ключ"
        exit 1
    fi
    
    # Шифруем значение секрета
    local encrypted_value=$(echo -n "$secret_value" | \
        openssl pkeyutl -encrypt -pubin -inkey <(echo "$key" | base64 -d) -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | \
        base64 -w 0)
    
    # Устанавливаем секрет
    curl -s -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/secrets/$secret_name" \
        -d "{\"encrypted_value\":\"$encrypted_value\",\"key_id\":\"$key_id\"}" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ $secret_name установлен"
    else
        echo "❌ Ошибка при установке $secret_name"
        exit 1
    fi
}

# Установка SSH ключа
SSH_KEY_CONTENT=$(cat "$SSH_KEY_PATH")
set_secret "SSH_PRIVATE_KEY" "$SSH_KEY_CONTENT"

# Установка IP сервера
set_secret "STAGE_SERVER_IP" "31.130.147.54"

# Установка пользователя
set_secret "STAGE_SERVER_USER" "root"

echo ""
echo "🎉 Все secrets успешно настроены!"
echo ""
echo "✅ Готово! Теперь при push в ветку stage будет автоматически запускаться деплой."

