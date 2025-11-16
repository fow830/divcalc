# 🚀 Пуш кода в GitHub

## ✅ Что уже готово

- ✅ Git репозиторий инициализирован
- ✅ Создан начальный коммит
- ✅ Создана ветка `stage`
- ✅ Remote настроен: `git@github.com:fow830/divcalc.git`

## 📋 Создание репозитория на GitHub

### Шаг 1: Создайте репозиторий

1. Откройте: **https://github.com/new**
2. Заполните форму:
   - **Repository name**: `divcalc`
   - **Description**: `Калькулятор стоимости диванов - Next.js приложение`
   - **Visibility**: ✅ **Public**
   - ⚠️ **НЕ** ставьте галочки на:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
3. Нажмите **"Create repository"**

### Шаг 2: Запушьте код

После создания репозитория выполните:

```bash
git push -u origin stage
```

## 🎯 Альтернативные варианты

### Вариант 1: Через скрипт

```bash
./scripts/setup-github.sh
```

### Вариант 2: Через GitHub CLI (если установлен)

```bash
gh repo create divcalc --public --source=. --remote=origin --push
```

### Вариант 3: Через API (с токеном)

```bash
export GITHUB_TOKEN=your_github_token
./scripts/create-github-repo.sh
```

## ✅ После успешного пуша

Репозиторий будет доступен по адресу:
**https://github.com/fow830/divcalc**

Ветка `stage` будет содержать весь код проекта.

## 📊 Текущее состояние

```bash
# Проверка статуса
git status

# Просмотр веток
git branch -a

# Просмотр коммитов
git log --oneline

# Просмотр remote
git remote -v
```

## 🔄 Структура веток

- **main** - основная ветка (пока пустая, можно использовать для production)
- **stage** - ветка для стейджинга (содержит текущий код)

## 📝 Следующие шаги после пуша

1. ✅ Код будет в GitHub
2. Можно настроить GitHub Actions для автоматического деплоя
3. Можно создать ветку `dev` для разработки
4. Можно настроить защиту веток в настройках репозитория

