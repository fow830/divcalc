#!/bin/bash

# Автоматическое создание репозитория и пуш
# Требует GitHub Personal Access Token

REPO_NAME="divcalc"
GITHUB_USER="fow830"
BRANCH="stage"

echo "🚀 Автоматическое создание репозитория и пуш..."
echo ""

# Проверка токена
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN не установлен"
    echo ""
    echo "Для автоматического создания репозитория нужен GitHub Personal Access Token"
    echo ""
    echo "Создайте токен:"
    echo "1. Откройте: https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Выберите scope: repo (полный доступ к репозиториям)"
    echo "4. Скопируйте токен"
    echo ""
    echo "Затем выполните:"
    echo "export GITHUB_TOKEN=your_token_here"
    echo "./scripts/auto-create-repo.sh"
    exit 1
fi

# Создание репозитория
echo "📦 Создаем репозиторий $REPO_NAME..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"Калькулятор стоимости диванов - Next.js приложение\",\"public\":true}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Репозиторий успешно создан!"
elif echo "$BODY" | grep -q "already exists"; then
    echo "ℹ️  Репозиторий уже существует"
else
    echo "❌ Ошибка создания репозитория:"
    echo "$BODY" | head -5
    exit 1
fi

# Небольшая задержка для синхронизации
sleep 2

# Пуш кода
echo ""
echo "📤 Пушим код в ветку $BRANCH..."
git push -u origin $BRANCH 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Успешно!"
    echo "🌐 Репозиторий: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo "🌿 Ветка: $BRANCH"
    echo ""
    echo "🎉 Деплой завершен!"
else
    echo ""
    echo "❌ Ошибка при пуше"
    exit 1
fi

