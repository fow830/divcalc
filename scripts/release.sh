#!/bin/bash

# Скрипт для создания релиза
# Использование: ./scripts/release.sh [major|minor|patch] "Описание изменений"

set -e

VERSION_TYPE=${1:-patch}
DESCRIPTION=${2:-""}

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "❌ Неверный тип версии. Используйте: major, minor или patch"
    exit 1
fi

# Обновляем версию
./scripts/bump-version.sh "$VERSION_TYPE"

# Получаем новую версию
NEW_VERSION=$(node -p "require('./package.json').version")
DATE=$(date +%Y-%m-%d)

# Обновляем CHANGELOG.md
if [ -n "$DESCRIPTION" ]; then
    echo ""
    echo "📝 Обновляю CHANGELOG.md..."
    
    # Создаем временный файл с новой записью
    cat > /tmp/changelog_entry.md << EOF

## [$NEW_VERSION] - $DATE

### Изменено
- $DESCRIPTION
EOF

    # Вставляем после заголовка
    sed -i '' "2r /tmp/changelog_entry.md" CHANGELOG.md
    rm /tmp/changelog_entry.md
    
    git add CHANGELOG.md
    git commit --amend --no-edit || true
fi

echo ""
echo "🎉 Релиз $NEW_VERSION создан!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Проверьте CHANGELOG.md"
echo "   2. git push origin stage"
echo "   3. git push origin v$NEW_VERSION"

