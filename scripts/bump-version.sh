#!/bin/bash

# Скрипт для обновления версии проекта
# Использование: ./scripts/bump-version.sh [major|minor|patch]

set -e

VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "❌ Неверный тип версии. Используйте: major, minor или patch"
    exit 1
fi

# Получаем текущую версию из package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Текущая версия: $CURRENT_VERSION"

# Разбиваем версию на части
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Обновляем версию в зависимости от типа
case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "🚀 Новая версия: $NEW_VERSION"

# Обновляем package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "✅ Версия обновлена в package.json"

# Обновляем lib/version.ts
npm run update-version 2>/dev/null || node -e "
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let commitHash = 'unknown';
let commitDate = 'unknown';
let gitBranch = 'unknown';

try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  commitDate = execSync('git log -1 --format=%cd --date=format:\"%Y-%m-%d %H:%M:%S\"', { encoding: 'utf-8' }).trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  
  // Нормализуем название ветки для отображения
  if (gitBranch === 'main' || gitBranch === 'master') {
    gitBranch = 'production';
  } else if (gitBranch === 'stage' || gitBranch === 'staging') {
    gitBranch = 'stage';
  }
} catch (error) {
  // Игнорируем ошибки
}

const versionFile = path.join(process.cwd(), 'lib', 'version.ts');
const content = \`// Версия приложения и информация о коммите
// Автоматически обновляется при изменении package.json и сборке

export const APP_VERSION = '\$NEW_VERSION';
export const COMMIT_HASH = '\${commitHash}';
export const COMMIT_DATE = '\${commitDate}';
export const GIT_BRANCH = '\${gitBranch}';
\`;
fs.writeFileSync(versionFile, content, 'utf-8');
"

echo "✅ Версия обновлена в lib/version.ts"

# Создаем git tag
echo "🏷️  Создаю git tag v$NEW_VERSION..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION" || true
git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"

echo ""
echo "✅ Версия обновлена до $NEW_VERSION"
echo "📝 Не забудьте обновить CHANGELOG.md с описанием изменений"
echo "🚀 Для отправки тега выполните: git push origin v$NEW_VERSION"

