#!/bin/bash

# Создание репозитория и пуш кода

REPO_NAME="divcalc"
GITHUB_USER="fow830"
BRANCH="stage"

echo "🚀 Создание репозитория и пуш кода..."
echo ""

# Проверка SSH подключения
echo "🔍 Проверяем SSH подключение..."
ssh -T git@github.com > /dev/null 2>&1
if [ $? -eq 0 ] || [ $? -eq 1 ]; then
    echo "✅ SSH подключение работает"
else
    echo "❌ Ошибка SSH подключения"
    exit 1
fi

# Попытка создать репозиторий через API (если есть токен)
if [ -n "$GITHUB_TOKEN" ]; then
    echo "📦 Создаем репозиторий через API..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"description\":\"Калькулятор стоимости диванов\",\"public\":true}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 201 ]; then
        echo "✅ Репозиторий создан через API"
    elif echo "$BODY" | grep -q "already exists"; then
        echo "ℹ️  Репозиторий уже существует"
    else
        echo "⚠️  Не удалось создать через API, попробуем запушить напрямую"
    fi
else
    echo "ℹ️  GITHUB_TOKEN не установлен, попробуем запушить напрямую"
    echo "   (Если репозиторий не существует, создайте его на https://github.com/new)"
fi

# Пуш кода
echo ""
echo "📤 Пушим код в ветку $BRANCH..."
git push -u origin $BRANCH 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Код успешно запушен!"
    echo "🌐 Репозиторий: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo "🌿 Ветка: $BRANCH"
else
    echo ""
    echo "❌ Ошибка при пуше"
    echo ""
    echo "💡 Репозиторий нужно создать вручную:"
    echo "   1. Откройте: https://github.com/new"
    echo "   2. Название: $REPO_NAME"
    echo "   3. Публичный"
    echo "   4. БЕЗ README/.gitignore"
    echo "   5. Затем выполните: git push -u origin $BRANCH"
    exit 1
fi

