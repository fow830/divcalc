# Используем официальный Node.js образ
FROM node:20-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы (Excel файл не требуется)
COPY . .

# Собираем приложение
RUN npm run build

# Запускаем приложение
EXPOSE 3000

ENV PORT 3000
ENV NODE_ENV production

CMD ["npm", "start"]

