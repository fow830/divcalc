# 🔄 Workflow проекта - Калькулятор стоимости диванов

## 📋 Обзор проекта

**Название**: Калькулятор стоимости диванов  
**Технологии**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui  
**Деплой**: Сервер 31.130.147.54, домен divcalc.flyplaza.ru

---

## 🏗️ Архитектура проекта

### Структура файлов

```
/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── sofa-data/
│   │       └── route.ts         # API endpoint для получения данных
│   ├── layout.tsx                # Главный layout приложения
│   ├── page.tsx                  # Главная страница
│   └── globals.css               # Глобальные стили
│
├── components/                    # React компоненты
│   ├── sofa-calculator.tsx       # Основной компонент калькулятора
│   └── ui/                       # UI компоненты (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── select.tsx
│
├── lib/                          # Бизнес-логика и утилиты
│   ├── data.ts                   # Данные моделей и параметров (константы)
│   ├── calculator.ts             # Логика расчета стоимости
│   └── utils.ts                  # Вспомогательные функции
│
├── scripts/                       # Скрипты для деплоя
│   ├── deploy-to-server.sh       # Автоматический деплой
│   ├── check-timeweb.js          # Проверка API Timeweb
│   └── timeweb-api.js            # Клиент Timeweb API
│
└── public/                       # Статические файлы
```

---

## 🔄 Полный Workflow

### 1. 📊 Источник данных

**Исходные данные**: Excel файл `калькуляция.xlsx` (уже извлечен)

**Текущее состояние**: 
- ✅ Данные извлечены из Excel
- ✅ Сохранены в `lib/data.ts` как константы
- ✅ Excel файл больше не используется в проекте

**Файл данных**: `lib/data.ts`
```typescript
- FIXED_DATA: Фиксированные параметры (цены, расходы)
- SOFA_MODELS: Массив из 5 моделей диванов
```

---

### 2. 💻 Локальная разработка

#### Запуск dev сервера

```bash
npm run dev
```

**Процесс**:
1. Next.js запускает dev сервер на порту 3000
2. Hot reload активен - изменения применяются автоматически
3. TypeScript компилируется на лету
4. Tailwind CSS обрабатывается через PostCSS

#### Структура запросов

```
Браузер
  ↓
http://localhost:3000
  ↓
app/page.tsx (SSR)
  ↓
components/sofa-calculator.tsx (Client Component)
  ↓
useEffect → fetch('/api/sofa-data')
  ↓
app/api/sofa-data/route.ts
  ↓
lib/calculator.ts → getSofaData()
  ↓
lib/data.ts → возвращает константы
  ↓
JSON ответ → компонент получает данные
  ↓
Расчет стоимости через calculateSofaCost()
  ↓
Отображение результатов в UI
```

#### Hot Reload процесс

1. **Изменение файла** → Next.js обнаруживает изменение
2. **Компиляция** → TypeScript/JSX компилируется
3. **Обновление модуля** → Webpack обновляет модуль
4. **HMR (Hot Module Replacement)** → React обновляет компонент
5. **UI обновляется** → Без перезагрузки страницы

---

### 3. 🧮 Логика расчета стоимости

#### Функция расчета: `lib/calculator.ts`

```typescript
calculateSofaCost(
  model: SofaModel,           // Выбранная модель
  backrestWidth: number,      // Ширина спинки (вводит пользователь)
  fabricPrice: number,       // Цена обивки (вводит пользователь)
  fabricType: 'мп' | 'м2',   // Тип измерения (выбирает пользователь)
  fixedData: FixedData       // Фиксированные данные
)
```

#### Формулы расчета

**1. Производство локтей:**
```
Стоимость = Ширина локтей × Цена производства × Коэф. сложности × Коэф. наценки
```

**2. Производство спинки:**
```
Стоимость = Ширина спинки × Цена производства × Коэф. сложности × Коэф. наценки
```

**3. Обивка локтей:**
```
Расход = Ширина локтей × Расход обивки (м² или мп)
Стоимость = Расход × Цена обивки
```

**4. Обивка спинки:**
```
Расход = Ширина спинки × Расход обивки (м² или мп)
Стоимость = Расход × Цена обивки
```

**5. Итого:**
```
Итого = Производство локтей + Производство спинки + Обивка локтей + Обивка спинки
```

#### Real-time обновление

- Используется `useMemo` для оптимизации расчетов
- Пересчет происходит при изменении любого параметра
- Без перезагрузки страницы
- Без запросов к серверу (все расчеты на клиенте)

---

### 4. 🔌 API Endpoint

#### `/api/sofa-data`

**Метод**: GET  
**Ответ**: JSON

```json
{
  "fixedData": {
    "armrestProductionPrice": 254.59,
    "backrestProductionPrice": 297.03,
    ...
  },
  "models": [
    {
      "name": "Chesterfield",
      "armrestWidth": 70,
      "complexityCoefficient": 1,
      "markupCoefficient": 2.5
    },
    ...
  ]
}
```

**Процесс**:
1. Клиент делает GET запрос
2. API route вызывает `getSofaData()`
3. Функция возвращает данные из `lib/data.ts`
4. Данные сериализуются в JSON
5. Отправляются клиенту

**Особенности**:
- Нет базы данных
- Нет внешних API
- Все данные в коде
- Мгновенный ответ

---

### 5. 🎨 UI Компоненты

#### Компонент: `SofaCalculator`

**Состояние (State)**:
```typescript
- fixedData: FixedData | null      // Загруженные фиксированные данные
- models: SofaModel[]              // Список моделей
- selectedModel: SofaModel | null // Выбранная модель
- backrestWidth: number            // Ширина спинки
- fabricPrice: number              // Цена обивки
- fabricType: 'мп' | 'м2'          // Тип измерения
```

**Жизненный цикл**:
1. **Mount** → `useEffect` загружает данные через API
2. **Загрузка данных** → Обновляет `fixedData` и `models`
3. **Выбор модели** → Обновляет `selectedModel`
4. **Изменение параметров** → Триггерит пересчет через `useMemo`
5. **Отображение** → Рендерит результаты в UI

#### UI компоненты (shadcn/ui)

- **Card** - карточки для группировки контента
- **Input** - поля ввода (ширина спинки, цена обивки)
- **Select** - выпадающие списки (модель, тип измерения)
- **Label** - подписи к полям

---

### 6. 🏗️ Процесс сборки

#### Команда: `npm run build`

**Этапы сборки**:

1. **TypeScript компиляция**
   - Проверка типов
   - Компиляция в JavaScript
   - Проверка ошибок

2. **Next.js сборка**
   - Оптимизация компонентов
   - Создание production bundle
   - Генерация статических страниц
   - Минификация кода

3. **CSS обработка**
   - Tailwind CSS → PostCSS
   - Удаление неиспользуемых стилей
   - Минификация CSS

4. **Результат**:
   ```
   .next/
   ├── static/          # Статические файлы (JS, CSS)
   ├── server/          # Server-side код
   └── routes-manifest  # Манифест маршрутов
   ```

**Выходные файлы**:
- Оптимизированный JavaScript
- Минифицированный CSS
- Статические страницы (где возможно)
- Server components

---

### 7. 🚀 Процесс деплоя

#### Автоматический деплой: `scripts/deploy-to-server.sh`

**Этапы**:

1. **Подготовка локально**
   ```bash
   - Создание архива проекта (tar.gz)
   - Исключение node_modules, .next, .git
   ```

2. **Подключение к серверу**
   ```bash
   - SSH подключение (31.130.147.54)
   - Проверка доступности
   ```

3. **Установка зависимостей на сервере**
   ```bash
   - Node.js 20 (если не установлен)
   - PM2 (для управления процессом)
   - Nginx (веб-сервер)
   - Git (опционально)
   ```

4. **Копирование файлов**
   ```bash
   - Загрузка архива на сервер (scp)
   - Распаковка в /var/www/divcalc
   ```

5. **Установка и сборка**
   ```bash
   - npm install (все зависимости)
   - npm run build (сборка проекта)
   ```

6. **Запуск приложения**
   ```bash
   - pm2 start npm --name "divcalc" -- start
   - pm2 save (сохранение конфигурации)
   - pm2 startup (автозапуск)
   ```

7. **Настройка Nginx**
   ```bash
   - Создание конфигурации для divcalc.flyplaza.ru
   - Проксирование на localhost:3000
   - Перезагрузка Nginx
   ```

#### Ручной деплой

См. `DEPLOY_SERVER.md` для детальных инструкций.

---

### 8. 🌐 Production Workflow

#### Запрос пользователя

```
Пользователь
  ↓
http://divcalc.flyplaza.ru
  ↓
Nginx (порт 80)
  ↓
Проксирование на localhost:3000
  ↓
Next.js приложение (PM2)
  ↓
Обработка запроса
  ↓
Ответ (HTML/JSON)
  ↓
Nginx → Пользователь
```

#### Процесс обработки запроса

1. **GET /** (главная страница)
   - Next.js рендерит `app/page.tsx`
   - SSR (Server-Side Rendering)
   - Отправка HTML с React компонентами

2. **Гидрирование на клиенте**
   - React "оживляет" статический HTML
   - Компоненты становятся интерактивными
   - Загрузка данных через API

3. **GET /api/sofa-data**
   - API route обрабатывает запрос
   - Возвращает данные из `lib/data.ts`
   - JSON ответ

4. **Расчет стоимости**
   - Происходит на клиенте
   - Использует `calculateSofaCost()`
   - Real-time обновление при изменении параметров

---

### 9. 📝 Обновление данных

#### Изменение параметров моделей

**Файл**: `lib/data.ts`

**Процесс**:
1. Открыть `lib/data.ts`
2. Изменить константы `FIXED_DATA` или `SOFA_MODELS`
3. Сохранить файл
4. Hot reload обновит приложение (dev)
5. Для production: пересобрать и перезапустить

**Пример изменения**:
```typescript
// Было
{ name: 'Chesterfield', armrestWidth: 70, ... }

// Стало
{ name: 'Chesterfield', armrestWidth: 75, ... }
```

#### Обновление на сервере

```bash
# Вариант 1: Через скрипт
./scripts/deploy-to-server.sh

# Вариант 2: Вручную
ssh root@31.130.147.54
cd /var/www/divcalc
git pull  # если используется git
npm install
npm run build
pm2 restart divcalc
```

---

### 10. 🔍 Мониторинг и отладка

#### Локальная разработка

**Логи**: Отображаются в терминале где запущен `npm run dev`

**DevTools**:
- Console - ошибки JavaScript
- Network - запросы к API
- React DevTools - состояние компонентов

#### Production

**PM2 команды**:
```bash
pm2 status              # Статус приложения
pm2 logs divcalc        # Просмотр логов
pm2 monit               # Мониторинг в реальном времени
pm2 restart divcalc     # Перезапуск
```

**Nginx логи**:
```bash
tail -f /var/log/nginx/access.log   # Логи доступа
tail -f /var/log/nginx/error.log    # Логи ошибок
```

---

### 11. 🔄 Полный цикл разработки

```
1. Локальная разработка
   ├── npm run dev
   ├── Редактирование кода
   ├── Hot reload
   └── Тестирование

2. Тестирование
   ├── Проверка UI
   ├── Проверка расчетов
   ├── Проверка API
   └── Проверка на разных устройствах

3. Сборка
   ├── npm run build
   ├── Проверка ошибок
   └── Проверка размера bundle

4. Деплой
   ├── ./scripts/deploy-to-server.sh
   ├── Автоматическая установка
   └── Автоматическая настройка

5. Проверка на production
   ├── Открыть divcalc.flyplaza.ru
   ├── Проверить работу калькулятора
   └── Проверить логи
```

---

### 12. 📦 Управление зависимостями

#### Установка зависимостей

```bash
npm install              # Установка всех зависимостей
npm ci                   # Чистая установка (для CI/CD)
```

#### Обновление зависимостей

```bash
npm update               # Обновление в пределах версий
npm outdated             # Проверка устаревших пакетов
```

#### Зависимости проекта

**Production**:
- next, react, react-dom
- tailwindcss, tailwindcss-animate
- class-variance-authority, clsx, tailwind-merge

**Development**:
- typescript
- @types/node, @types/react, @types/react-dom
- autoprefixer, postcss, tailwindcss

---

### 13. 🔐 Безопасность

#### Текущие меры

- ✅ Нет секретов в коде (данные публичные)
- ✅ SSH ключи для доступа к серверу
- ✅ Nginx как reverse proxy
- ✅ PM2 для изоляции процесса

#### Рекомендации

- Настроить SSL (Let's Encrypt)
- Регулярные обновления зависимостей
- Мониторинг логов на ошибки
- Резервное копирование данных

---

### 14. 📊 Схема данных

#### Поток данных

```
lib/data.ts (константы)
    ↓
lib/calculator.ts (getSofaData)
    ↓
app/api/sofa-data/route.ts (API)
    ↓
components/sofa-calculator.tsx (компонент)
    ↓
useState (состояние)
    ↓
useMemo (расчет)
    ↓
UI (отображение)
```

#### Типы данных

```typescript
FixedData {
  armrestProductionPrice: number
  backrestProductionPrice: number
  armrestFabricConsumptionM2: number
  backrestFabricConsumptionM2: number
  armrestFabricConsumptionMp: number
  backrestFabricConsumptionMp: number
}

SofaModel {
  name: string
  armrestWidth: number
  complexityCoefficient: number
  markupCoefficient: number
}

CalculationResult {
  armrestProductionCost: number
  backrestProductionCost: number
  armrestFabricCost: number
  backrestFabricCost: number
  total: number
}
```

---

### 15. 🎯 Ключевые особенности

#### ✅ Преимущества текущей архитектуры

1. **Нет базы данных** - все данные в коде, быстрый доступ
2. **Нет внешних зависимостей** - работает автономно
3. **Real-time расчеты** - все на клиенте, мгновенный отклик
4. **Простой деплой** - один скрипт, автоматизация
5. **TypeScript** - типобезопасность
6. **Hot reload** - быстрая разработка

#### 🔄 Процесс обновления

**Локально**:
- Изменение файла → Автоматическое обновление

**На сервере**:
- Изменение кода → Деплой → Перезапуск PM2

---

## 📚 Дополнительная документация

- `README.md` - Общая информация
- `LOCAL_DEV.md` - Локальная разработка
- `DEPLOY_SERVER.md` - Детальный деплой
- `QUICK_START.md` - Быстрый старт
- `TIMEWEB_SETUP.md` - Настройка Timeweb Cloud

---

## 🎓 Резюме Workflow

1. **Разработка** → Локально, с hot reload
2. **Данные** → В коде (`lib/data.ts`)
3. **Расчеты** → На клиенте, real-time
4. **API** → Простой endpoint, возвращает константы
5. **Сборка** → Next.js оптимизирует для production
6. **Деплой** → Автоматический скрипт
7. **Production** → PM2 + Nginx, стабильная работа

**Весь процесс от идеи до production занимает минуты!** ⚡

