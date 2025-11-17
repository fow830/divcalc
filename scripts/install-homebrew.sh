#!/bin/bash

# Скрипт для установки Homebrew
# Запустите этот скрипт в терминале, чтобы иметь возможность ввести пароль

set -e

echo "🍺 Установка Homebrew..."
echo ""
echo "⚠️  Вам будет предложено ввести пароль администратора"
echo ""

# Проверяем, не установлен ли уже Homebrew
if [ -f /opt/homebrew/bin/brew ] || [ -f /usr/local/bin/brew ]; then
    echo "✅ Homebrew уже установлен!"
    if [ -f /opt/homebrew/bin/brew ]; then
        /opt/homebrew/bin/brew --version
    else
        /usr/local/bin/brew --version
    fi
    exit 0
fi

# Устанавливаем Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Определяем путь установки
if [ -d "/opt/homebrew" ]; then
    BREW_PATH="/opt/homebrew"
    echo "✅ Homebrew установлен в /opt/homebrew"
elif [ -d "/usr/local" ]; then
    BREW_PATH="/usr/local"
    echo "✅ Homebrew установлен в /usr/local"
else
    echo "❌ Не удалось определить путь установки Homebrew"
    exit 1
fi

# Добавляем в PATH
echo ""
echo "📝 Добавление Homebrew в PATH..."

if [ "$BREW_PATH" == "/opt/homebrew" ]; then
    if ! grep -q "brew shellenv" ~/.zprofile 2>/dev/null; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        echo "✅ Добавлено в ~/.zprofile"
    fi
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    if ! grep -q "brew shellenv" ~/.zprofile 2>/dev/null; then
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        echo "✅ Добавлено в ~/.zprofile"
    fi
    eval "$(/usr/local/bin/brew shellenv)"
fi

# Проверяем установку
echo ""
echo "🔍 Проверка установки..."
brew --version

echo ""
echo "✅ Homebrew успешно установлен!"
echo ""
echo "🚀 Теперь можно установить GitHub CLI:"
echo "   brew install gh"

