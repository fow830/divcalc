#!/bin/bash

# Скрипт для настройки PATH для Homebrew
# Добавляет Homebrew в PATH текущей сессии

echo "🔍 Поиск Homebrew..."

# Проверяем стандартные места
if [ -f /opt/homebrew/bin/brew ]; then
    echo "✅ Homebrew найден в /opt/homebrew"
    export PATH="/opt/homebrew/bin:$PATH"
    BREW_PATH="/opt/homebrew/bin"
elif [ -f /usr/local/bin/brew ]; then
    echo "✅ Homebrew найден в /usr/local"
    export PATH="/usr/local/bin:$PATH"
    BREW_PATH="/usr/local/bin"
else
    echo "❌ Homebrew не найден в стандартных местах"
    echo "Проверьте, что Homebrew установлен:"
    echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Проверяем работу
if $BREW_PATH/brew --version &> /dev/null; then
    echo "✅ Homebrew работает!"
    $BREW_PATH/brew --version
    echo ""
    echo "📝 Для постоянного добавления в PATH выполните:"
    if [ "$BREW_PATH" == "/opt/homebrew/bin" ]; then
        echo "  echo 'eval \"\$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zprofile"
        echo "  eval \"\$(/opt/homebrew/bin/brew shellenv)\""
    else
        echo "  echo 'eval \"\$(/usr/local/bin/brew shellenv)\"' >> ~/.zprofile"
        echo "  eval \"\$(/usr/local/bin/brew shellenv)\""
    fi
else
    echo "❌ Homebrew найден, но не работает"
    exit 1
fi

