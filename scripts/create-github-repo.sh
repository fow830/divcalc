#!/bin/bash

# Скрипт для создания репозитория на GitHub через API
# Требует GitHub Personal Access Token

REPO_NAME="divcalc"
GITHUB_USER="fow830"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GitHub токен не найден"
    echo ""
    echo "Для создания репозитория через API нужен Personal Access Token"
    echo ""
    echo "Вариант 1: Создать через веб-интерфейс"
    echo "  1. Откройте: https://github.com/new"
    echo "  2. Название: $REPO_NAME"
    echo "  3. Публичный"
    echo "  4. НЕ добавляйте README/.gitignore"
    echo ""
    echo "Вариант 2: Использовать токен"
    echo "  export GITHUB_TOKEN=your_token"
    echo "  ./scripts/create-github-repo.sh"
    exit 1
fi

echo "📦 Создаем репозиторий $REPO_NAME на GitHub..."

# Создание репозитория через API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Калькулятор стоимости диванов\",\"public\":true}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Репозиторий успешно создан!"
    echo ""
    echo "📤 Пушим код в ветку stage..."
    git push -u origin stage
else
    if echo "$BODY" | grep -q "already exists"; then
        echo "ℹ️  Репозиторий уже существует"
        echo ""
        echo "📤 Пушим код в ветку stage..."
        git push -u origin stage
    else
        echo "❌ Ошибка создания репозитория:"
        echo "$BODY" | head -5
        exit 1
    fi
fi

