# Установка GitHub CLI (gh)

## 🍎 macOS

### Способ 1: Через Homebrew (рекомендуется)

```bash
# Установите Homebrew (если еще не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установите GitHub CLI
brew install gh

# Проверьте установку
gh --version
```

### Способ 2: Прямая установка бинарника

```bash
# Скачайте последнюю версию для macOS
cd /tmp
curl -L https://github.com/cli/cli/releases/latest/download/gh_$(curl -s https://api.github.com/repos/cli/cli/releases/latest | grep tag_name | cut -d '"' -f 4 | cut -d 'v' -f 2)_macOS_amd64.tar.gz -o gh.tar.gz

# Распакуйте
tar -xzf gh.tar.gz

# Переместите в /usr/local/bin (требует sudo)
sudo mv gh_*/bin/gh /usr/local/bin/

# Проверьте
gh --version
```

## 🔐 Авторизация в GitHub CLI

После установки выполните:

```bash
gh auth login
```

Следуйте инструкциям:
1. Выберите `GitHub.com`
2. Выберите протокол: `HTTPS` (рекомендуется)
3. Аутентификация: `Login with a web browser`
4. Скопируйте код и вставьте в браузер

## ✅ Проверка

```bash
gh auth status
```

Должно показать, что вы авторизованы.

## 🚀 После установки

Запустите скрипт настройки secrets:

```bash
./scripts/setup-github-secrets.sh
```

