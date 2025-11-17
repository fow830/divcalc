# Установка Homebrew

## 🍎 macOS

Homebrew требует интерактивного ввода и прав администратора. 

### Шаги установки:

1. **Откройте терминал** (не через Cursor, а обычный Terminal.app)

2. **Выполните команду установки:**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **Следуйте инструкциям:**
   - Введите пароль администратора, когда будет запрошен
   - Нажмите Enter для подтверждения
   - Дождитесь завершения установки (может занять несколько минут)

4. **После установки добавьте Homebrew в PATH:**
   
   Для Apple Silicon (M1/M2/M3):
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```
   
   Для Intel Mac:
   ```bash
   echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/usr/local/bin/brew shellenv)"
   ```

5. **Проверьте установку:**
   ```bash
   brew --version
   ```

## ✅ После установки Homebrew

Установите GitHub CLI:
```bash
brew install gh
```

Затем авторизуйтесь:
```bash
gh auth login
```

И настройте secrets:
```bash
./scripts/setup-github-secrets.sh
```

## 🔍 Проверка

Если Homebrew уже установлен, но не в PATH, проверьте:
```bash
ls -la /opt/homebrew/bin/brew  # Apple Silicon
ls -la /usr/local/bin/brew     # Intel
```

