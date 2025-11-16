#!/bin/bash

# Скрипт для создания репозитория на GitHub и пуша кода

REPO_NAME="divcalc"
GITHUB_USER="fow830"
BRANCH="stage"

echo "🚀 Настройка GitHub репозитория..."
echo ""

# Проверка наличия GitHub CLI
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI найден"
    echo "📦 Создаем публичный репозиторий $REPO_NAME..."
    gh repo create $REPO_NAME --public --source=. --remote=origin --push 2>&1 || {
        echo "⚠️  Репозиторий уже существует или ошибка создания"
    }
else
    echo "⚠️  GitHub CLI не установлен"
    echo ""
    echo "📋 Инструкция:"
    echo "1. Откройте https://github.com/new"
    echo "2. Создайте публичный репозиторий с именем: $REPO_NAME"
    echo "3. НЕ инициализируйте с README, .gitignore или лицензией"
    echo "4. После создания выполните:"
    echo "   git push -u origin $BRANCH"
    echo ""
    read -p "Нажмите Enter после создания репозитория на GitHub..."
fi

# Пуш в ветку stage
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
    echo "❌ Ошибка при пуше. Убедитесь, что:"
    echo "   1. Репозиторий создан на GitHub"
    echo "   2. У вас есть права на запись"
    echo "   3. SSH ключ добавлен в GitHub"
fi

