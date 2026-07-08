# NovaWork

A premium, production-ready project management tool inspired by Trello, ClickUp, and Asana.

## Features
- Landing page with animations and premium visuals
- Auth pages for login, register, and forgot password
- Responsive dashboard with charts and project overview
- Node/Express backend with MongoDB and JWT auth

## Run locally
1. Install dependencies: `npm run install:all`
2. Copy `.env.example` to `.env` and update values

3. Use MongoDB Atlas (recommended):
	- Create a free cluster at https://cloud.mongodb.com
	- Add your IP to the Network Access whitelist or allow access from anywhere (0.0.0.0/0)
	- Create a database user and get the connection string (mongodb+srv://...)
	- Paste the connection string into `MONGO_URI` in your `.env` and set `JWT_SECRET`.

4. Start the app: `npm run dev`

## Stack
- Frontend: React + Vite + Tailwind + Framer Motion + Recharts
- Backend: Express + MongoDB + Mongoose + JWT
