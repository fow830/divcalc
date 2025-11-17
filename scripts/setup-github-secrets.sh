#!/bin/bash

# Скрипт для настройки GitHub Secrets для автоматического деплоя
# Требует установленный GitHub CLI (gh) и авторизацию

set -e

REPO="fow830/divcalc"
SSH_KEY_PATH="$HOME/.ssh/sofa_calculator_deploy"

echo "🔐 Настройка GitHub Secrets для автоматического деплоя"
echo ""

# Проверка GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) не установлен"
    echo "Установите: brew install gh"
    exit 1
fi

# Проверка авторизации
if ! gh auth status &> /dev/null; then
    echo "⚠️  Необходима авторизация в GitHub CLI"
    echo "Выполните: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI установлен и авторизован"
echo ""

# Проверка SSH ключа
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH ключ не найден: $SSH_KEY_PATH"
    exit 1
fi

echo "📝 Настройка secrets для репозитория: $REPO"
echo ""

# Установка SSH_PRIVATE_KEY
echo "1️⃣  Устанавливаю SSH_PRIVATE_KEY..."
gh secret set SSH_PRIVATE_KEY --repo "$REPO" < "$SSH_KEY_PATH"
echo "✅ SSH_PRIVATE_KEY установлен"
echo ""

# Установка STAGE_SERVER_IP
echo "2️⃣  Устанавливаю STAGE_SERVER_IP..."
echo "31.130.147.54" | gh secret set STAGE_SERVER_IP --repo "$REPO"
echo "✅ STAGE_SERVER_IP установлен"
echo ""

# Установка STAGE_SERVER_USER
echo "3️⃣  Устанавливаю STAGE_SERVER_USER..."
echo "root" | gh secret set STAGE_SERVER_USER --repo "$REPO"
echo "✅ STAGE_SERVER_USER установлен"
echo ""

echo "🎉 Все secrets успешно настроены!"
echo ""
echo "📋 Проверка настроенных secrets:"
gh secret list --repo "$REPO" | grep -E "(SSH_PRIVATE_KEY|STAGE_SERVER_IP|STAGE_SERVER_USER)" || true
echo ""
echo "✅ Готово! Теперь при push в ветку stage будет автоматически запускаться деплой."

