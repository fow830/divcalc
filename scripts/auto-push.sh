#!/bin/bash

# Автоматический пуш после создания репозитория

REPO_NAME="divcalc"
GITHUB_USER="fow830"
BRANCH="stage"
MAX_ATTEMPTS=30
ATTEMPT=0

echo "🚀 Ожидаю создания репозитория и автоматически запушу код..."
echo ""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # Проверяем существование репозитория
    git ls-remote git@github.com:$GITHUB_USER/$REPO_NAME.git > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Репозиторий найден! Пушим код..."
        echo ""
        
        git push -u origin $BRANCH
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 Успешно запушено!"
            echo "🌐 Репозиторий: https://github.com/$GITHUB_USER/$REPO_NAME"
            echo "🌿 Ветка: $BRANCH"
            exit 0
        else
            echo "❌ Ошибка при пуше"
            exit 1
        fi
    else
        if [ $ATTEMPT -eq 1 ]; then
            echo "⏳ Ожидаю создания репозитория..."
            echo "   Создайте на: https://github.com/new"
            echo "   Название: $REPO_NAME"
            echo ""
        fi
        echo "   Попытка $ATTEMPT/$MAX_ATTEMPTS..."
        sleep 3
    fi
done

echo ""
echo "⏰ Время ожидания истекло"
echo "💡 Создайте репозиторий вручную на https://github.com/new"
echo "   Затем выполните: git push -u origin $BRANCH"

