# 🌱 СоциоПортал — Портал участия в социальных проектах

Курсовой проект по дисциплине **ПМ04 Проектирование и обеспечение бесперебойной работы web-сайта**

## Описание
Веб-платформа для поиска и участия в социальных проектах. Пользователи могут регистрироваться, просматривать проекты, подавать заявки на участие и создавать собственные проекты.

## Стек технологий
- **Frontend:** React 18, React Router v6, Axios, CSS
- **Backend:** Node.js, Express.js
- **База данных:** MongoDB + Mongoose
- **Аутентификация:** JWT + bcryptjs

## Запуск проекта

### 1. Требования
- Node.js (v16+)
- MongoDB (локально или MongoDB Atlas)

### 2. Бэкенд
```bash
cd backend
npm install
cp .env.example .env
# Заполните .env своими данными
npm run dev
```

### 3. Фронтенд
```bash
cd frontend
npm install
npm start
```

Фронтенд запустится на http://localhost:3000  
Бэкенд на http://localhost:5000

## API Эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/auth/me | Текущий пользователь |
| GET | /api/projects | Все проекты |
| GET | /api/projects/:id | Один проект |
| POST | /api/projects | Создать проект |
| PUT | /api/projects/:id | Обновить проект |
| DELETE | /api/projects/:id | Удалить проект |
| POST | /api/applications | Подать заявку |
| GET | /api/applications/my | Мои заявки |
| DELETE | /api/applications/:id | Отменить заявку |

## Автор
Студент группы по 2403 Полатбек Ақнұр 
Дата: 2026