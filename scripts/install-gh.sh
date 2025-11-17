#!/bin/bash

# Скрипт для установки GitHub CLI (gh)
# Поддерживает macOS и Linux

set -e

echo "🔧 Установка GitHub CLI..."

# Определяем ОС
OS="$(uname -s)"
ARCH="$(uname -m)"

if [ "$OS" == "Darwin" ]; then
    echo "📦 Обнаружен macOS"
    
    # Проверяем наличие Homebrew
    if command -v brew &> /dev/null; then
        echo "✅ Homebrew найден, устанавливаю через brew..."
        brew install gh
        echo "✅ GitHub CLI установлен!"
        gh --version
        exit 0
    fi
    
    # Если Homebrew нет, пробуем установить его
    echo "⚠️  Homebrew не найден"
    echo "📥 Установка Homebrew..."
    
    if [ -z "$NONINTERACTIVE" ]; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv)" || eval "$(/usr/local/bin/brew shellenv)"
        brew install gh
        echo "✅ GitHub CLI установлен через Homebrew!"
        gh --version
        exit 0
    else
        echo "❌ Требуется интерактивная установка Homebrew"
        echo "Выполните вручную:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo "  brew install gh"
        exit 1
    fi
    
elif [ "$OS" == "Linux" ]; then
    echo "📦 Обнаружен Linux"
    
    # Определяем дистрибутив
    if [ -f /etc/debian_version ]; then
        echo "📥 Установка для Debian/Ubuntu..."
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install gh -y
        echo "✅ GitHub CLI установлен!"
        gh --version
        exit 0
    elif [ -f /etc/redhat-release ]; then
        echo "📥 Установка для RHEL/CentOS/Fedora..."
        sudo dnf install 'dnf-command(config-manager)' -y
        sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/github-cli.repo
        sudo dnf install gh -y
        echo "✅ GitHub CLI установлен!"
        gh --version
        exit 0
    else
        echo "❌ Неподдерживаемый дистрибутив Linux"
        exit 1
    fi
else
    echo "❌ Неподдерживаемая ОС: $OS"
    exit 1
fi

