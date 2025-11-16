# Быстрый деплой

## ✅ Чек-лист перед деплоем

- [ ] Проект собирается: `npm run build`
- [ ] Все зависимости установлены: `npm install`
- [ ] Локально работает: `npm run dev`

## 🚀 Vercel (1 минута)

```bash
npm i -g vercel
vercel
```

Или через GitHub: https://vercel.com → New Project → Import Git Repository

## 🐳 Docker

```bash
docker-compose up -d
```

Или:
```bash
docker build -t sofa-calculator .
docker run -p 3000:3000 sofa-calculator
```

## 📦 Обычный сервер

```bash
npm ci --production
npm run build
npm start
```

С PM2:
```bash
pm2 start npm --name "sofa-calculator" -- start
pm2 save
```

## ✅ Важно

Все данные уже включены в код проекта, дополнительные файлы не требуются!

## 🔍 Проверка

После деплоя откройте приложение и убедитесь:
1. Загружаются модели диванов
2. Работает расчет стоимости
3. Нет ошибок в консоли

