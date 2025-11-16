# 🚀 Быстрый старт - Деплой на сервер

## Автоматический деплой (1 команда)

```bash
./scripts/deploy-to-server.sh
```

Этот скрипт автоматически:
- ✅ Подключится к серверу 31.130.147.54
- ✅ Установит все необходимые зависимости (Node.js, PM2, Nginx)
- ✅ Создаст директорию `/var/www/divcalc`
- ✅ Скопирует и установит проект
- ✅ Настроит Nginx для домена divcalc.flyplaza.ru
- ✅ Запустит приложение

## После деплоя

Приложение будет доступно по адресу:
**http://divcalc.flyplaza.ru**

## Полезные команды

### Проверка статуса
```bash
ssh -i ~/.ssh/sofa_calculator_deploy root@31.130.147.54 'pm2 status'
```

### Просмотр логов
```bash
ssh -i ~/.ssh/sofa_calculator_deploy root@31.130.147.54 'pm2 logs divcalc'
```

### Перезапуск приложения
```bash
ssh -i ~/.ssh/sofa_calculator_deploy root@31.130.147.54 'pm2 restart divcalc'
```

## Подробная документация

См. `DEPLOY_SERVER.md` для детальных инструкций.

