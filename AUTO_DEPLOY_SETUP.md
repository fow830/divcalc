# 🚀 Автоматический деплой на Stage - Быстрая настройка

## ✅ Что уже сделано

1. ✅ Создан GitHub Actions workflow (`.github/workflows/deploy-stage.yml`)
2. ✅ Workflow автоматически запускается при push в ветку `stage`
3. ✅ Созданы скрипты для настройки secrets

## 🔐 Настройка Secrets (один раз)

Для работы автоматического деплоя нужно настроить GitHub Secrets. Есть два способа:

### Способ 1: Через GitHub CLI (рекомендуется)

```bash
# Установите GitHub CLI (если еще не установлен)
brew install gh

# Авторизуйтесь
gh auth login

# Запустите скрипт настройки
./scripts/setup-github-secrets.sh
```

### Способ 2: Через GitHub API

```bash
# Установите зависимости (если нужно)
# brew install jq openssl

# Создайте Personal Access Token на GitHub:
# https://github.com/settings/tokens
# Требуемые права: repo (полный доступ)

# Запустите скрипт
export GITHUB_TOKEN=your_token_here
./scripts/setup-github-secrets-api.sh
```

### Способ 3: Вручную через веб-интерфейс

1. Перейдите: https://github.com/fow830/divcalc/settings/secrets/actions
2. Нажмите **New repository secret**
3. Добавьте секреты:

| Имя | Значение |
|-----|----------|
| `SSH_PRIVATE_KEY` | Содержимое файла `~/.ssh/sofa_calculator_deploy` |
| `STAGE_SERVER_IP` | `31.130.147.54` |
| `STAGE_SERVER_USER` | `root` |

## 🎯 Использование

После настройки secrets:

```bash
# Просто делайте push в ветку stage
git push origin stage
```

Деплой запустится автоматически! 

Проверить статус можно в разделе **Actions** на GitHub:
https://github.com/fow830/divcalc/actions

## 📋 Что происходит при деплое

1. ✅ Проверка кода
2. ✅ Установка зависимостей
3. ✅ Сборка проекта
4. ✅ Подключение к серверу через SSH
5. ✅ Обновление кода на сервере
6. ✅ Установка зависимостей на сервере
7. ✅ Сборка проекта на сервере
8. ✅ Перезапуск приложения через PM2
9. ✅ Health check

## 🔍 Проверка работы

После первого деплоя проверьте:
- https://stage-divcalc.flyplaza.ru - приложение должно быть доступно
- GitHub Actions - должен быть успешный workflow run

## ⚠️ Важно

- Secrets настраиваются **один раз**
- После настройки все последующие push в `stage` будут автоматически деплоиться
- Если деплой не запускается, проверьте настройку secrets

