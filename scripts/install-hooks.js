#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const hooksDir = path.join(repoRoot, '.git', 'hooks');

if (!fs.existsSync(hooksDir)) {
  console.error('⚠️  .git/hooks directory not found. Skipping hook installation.');
  process.exit(0);
}

// Post-commit hook: обновляет .env.local
const postCommitHook = `#!/bin/bash
cd "$(git rev-parse --show-toplevel)" || exit 0
npm run env:local >/dev/null 2>&1
`;

// Pre-checkout hook: блокирует checkout на production ветку
const preCheckoutHook = `#!/bin/bash
# Защита: на локале работаем ТОЛЬКО со stage веткой!
# Production ветка запрещена на локальной машине.

protected_branch='production'
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\\(.*\\),\\1,')

# Проверяем, если пытаемся переключиться на production
if [ "$3" = "refs/heads/$protected_branch" ] || [ "$3" = "$protected_branch" ]; then
  echo "❌ ОШИБКА: Ветка '$protected_branch' ЗАПРЕЩЕНА на локальной машине!"
  echo ""
  echo "📋 Правило: на локале работаем ТОЛЬКО со 'stage' веткой!"
  echo "   Production ветка используется только на сервере."
  echo ""
  exit 1
fi

# Проверяем, если пытаемся создать production ветку
if [ "$1" = "0" ] && [ "$3" = "refs/heads/$protected_branch" ]; then
  echo "❌ ОШИБКА: Создание ветки '$protected_branch' ЗАПРЕЩЕНО!"
  echo ""
  echo "📋 Правило: на локале работаем ТОЛЬКО со 'stage' веткой!"
  exit 1
fi

exit 0
`;

// Post-checkout hook: автоматически возвращает на stage, если оказались на production
const postCheckoutHook = `#!/bin/bash
# Автоматическая защита: если оказались на production, возвращаем на stage

protected_branch='production'
current_branch=$(git symbolic-ref HEAD 2>/dev/null | sed -e 's,.*/\\(.*\\),\\1,')

if [ "$current_branch" = "$protected_branch" ]; then
  echo ""
  echo "❌ ОШИБКА: Обнаружена ветка '$protected_branch'!"
  echo ""
  echo "📋 Правило: на локале работаем ТОЛЬКО со 'stage' веткой!"
  echo "   Автоматически переключаю на 'stage' и удаляю '$protected_branch'..."
  echo ""
  
  # Переключаемся на stage
  git checkout stage 2>/dev/null || {
    echo "⚠️  Не удалось переключиться на stage автоматически."
    echo "   Выполните вручную: git checkout stage"
    exit 1
  }
  
  # Удаляем локальную ветку production
  git branch -D "$protected_branch" 2>/dev/null && {
    echo "✅ Локальная ветка '$protected_branch' удалена"
  } || true
  
  echo "✅ Переключено на ветку 'stage'"
  echo ""
fi

exit 0
`;

// Pre-push hook: дополнительная защита при push
const prePushHook = `#!/bin/bash
# Защита от случайного push в production

protected_branch='production'
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\\(.*\\),\\1,')

while read local_ref local_sha remote_ref remote_sha
do
  if [[ "$remote_ref" == "refs/heads/$protected_branch" ]]; then
    echo "❌ ОШИБКА: Push в '$protected_branch' ЗАПРЕЩЁН с локальной машины!"
    echo ""
    echo "📋 Правило: на локале работаем ТОЛЬКО со 'stage' веткой!"
    echo "   Production обновляется только через CI/CD или вручную на сервере."
    echo ""
    exit 1
  fi
done

exit 0
`;

try {
  // Устанавливаем post-commit hook
  fs.writeFileSync(path.join(hooksDir, 'post-commit'), postCommitHook, { mode: 0o755 });
  console.log('✅ post-commit hook installed: npm run env:local');
  
  // Устанавливаем pre-checkout hook
  fs.writeFileSync(path.join(hooksDir, 'pre-checkout'), preCheckoutHook, { mode: 0o755 });
  console.log('✅ pre-checkout hook installed: защита от checkout на production');
  
  // Устанавливаем post-checkout hook
  fs.writeFileSync(path.join(hooksDir, 'post-checkout'), postCheckoutHook, { mode: 0o755 });
  console.log('✅ post-checkout hook installed: автоматический возврат на stage');
  
  // Устанавливаем pre-push hook
  fs.writeFileSync(path.join(hooksDir, 'pre-push'), prePushHook, { mode: 0o755 });
  console.log('✅ pre-push hook installed: защита от push в production');
  
  console.log('');
  console.log('🔒 Правило закреплено: на локале работаем ТОЛЬКО со stage веткой!');
} catch (error) {
  console.error('⚠️  Failed to install hooks:', error);
  process.exit(1);
}

