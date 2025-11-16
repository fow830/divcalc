# Инструкция по деплою

## Быстрый старт

### 1. Подготовка проекта

Убедитесь, что:
- ✅ Файл `калькуляция.xlsx` находится в корне проекта
- ✅ Все зависимости установлены: `npm install`
- ✅ Проект собирается: `npm run build`

### 2. Выберите платформу деплоя

## Vercel (самый простой способ)

### Через веб-интерфейс:
1. Зайдите на [vercel.com](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Vercel автоматически определит Next.js проект
4. Нажмите "Deploy"

### Через CLI:
```bash
npm i -g vercel
vercel
```

## Docker

### Сборка образа:
```bash
docker build -t sofa-calculator .
```

### Запуск:
```bash
docker run -p 3000:3000 sofa-calculator
```

### Docker Compose:
Создайте `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

Запуск:
```bash
docker-compose up -d
```

## Обычный сервер (VPS/Cloud)

### Требования:
- Node.js 20+
- npm или yarn

### Шаги:

1. **Клонируйте репозиторий:**
```bash
git clone <your-repo-url>
cd 5
```

2. **Установите зависимости:**
```bash
npm ci --production
```

3. **Соберите проект:**
```bash
npm run build
```

4. **Запустите с PM2 (рекомендуется):**
```bash
npm install -g pm2
pm2 start npm --name "sofa-calculator" -- start
pm2 save
pm2 startup  # для автозапуска при перезагрузке
```

5. **Настройте Nginx (опционально):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Railway

1. Подключите GitHub репозиторий
2. Railway автоматически определит Next.js
3. Убедитесь, что файл `калькуляция.xlsx` включен в репозиторий

## Netlify

1. Подключите репозиторий
2. Настройки сборки:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Добавьте переменные окружения если нужно

## Важные замечания

✅ **Важно:**
- Все данные уже включены в код проекта (`lib/data.ts`)
- Дополнительные файлы не требуются

## Проверка после деплоя

1. Откройте приложение в браузере
2. Проверьте, что данные загружаются (должны быть видны 5 моделей диванов)
3. Проверьте расчет стоимости - введите параметры и убедитесь, что расчет работает корректно

## Мониторинг

Для продакшена рекомендуется настроить:
- Логирование ошибок
- Мониторинг производительности
- Резервное копирование данных

