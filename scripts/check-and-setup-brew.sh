#!/bin/bash

# Скрипт для проверки и настройки Homebrew

echo "🔍 Проверка установки Homebrew..."
echo ""

# Проверяем все возможные места
BREW_LOCATIONS=(
    "/opt/homebrew/bin/brew"
    "/usr/local/bin/brew"
    "$HOME/homebrew/bin/brew"
    "/home/linuxbrew/.linuxbrew/bin/brew"
)

FOUND_BREW=""

for location in "${BREW_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        FOUND_BREW="$location"
        echo "✅ Homebrew найден: $location"
        break
    fi
done

if [ -z "$FOUND_BREW" ]; then
    echo "❌ Homebrew не найден"
    echo ""
    echo "📥 Для установки выполните в терминале:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo ""
    echo "После установки добавьте в PATH:"
    echo "   echo 'eval \"\$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zprofile"
    echo "   eval \"\$(/opt/homebrew/bin/brew shellenv)\""
    exit 1
fi

# Добавляем в PATH текущей сессии
BREW_DIR=$(dirname "$FOUND_BREW")
export PATH="$BREW_DIR:$PATH"

# Проверяем работу
if $FOUND_BREW --version &> /dev/null; then
    echo "✅ Homebrew работает!"
    $FOUND_BREW --version
    echo ""
    
    # Проверяем, добавлен ли в ~/.zprofile
    if ! grep -q "brew shellenv" ~/.zprofile 2>/dev/null; then
        echo "⚠️  Homebrew не добавлен в ~/.zprofile"
        echo "📝 Добавьте следующую строку в ~/.zprofile:"
        if [[ "$FOUND_BREW" == *"/opt/homebrew"* ]]; then
            echo "   eval \"\$(/opt/homebrew/bin/brew shellenv)\""
        else
            echo "   eval \"\$(/usr/local/bin/brew shellenv)\""
        fi
    else
        echo "✅ Homebrew уже в ~/.zprofile"
    fi
    
    echo ""
    echo "🚀 Теперь можно установить GitHub CLI:"
    echo "   $FOUND_BREW install gh"
else
    echo "❌ Homebrew найден, но не работает"
    exit 1
fi

