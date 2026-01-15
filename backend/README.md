# Swasthya Backend

Express + Mongoose API powering authentication and other features for the Swasthya app.

## Requirements
- Node.js 18+
- MongoDB instance (Atlas or local)

## Environment Variables
Create a `.env` file in `backend/` with:

```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
PORT=5000
```

> Do not commit `.env`. It is already ignored via the repo `.gitignore`.

## Install & Run
From the `backend/` folder:

```bash
npm install
npm run dev
```

- `npm run dev` runs with nodemon for auto-restarts
- `npm start` runs once with Node

The server starts on `http://localhost:5000` by default.

## API Endpoints
Base URL: `http://localhost:5000`

- `POST /api/auth/register`
  - Body (JSON): `{ "name": "John", "email": "john@example.com", "password": "secret" }`
  - Response: `{ "user": { "id": "...", "name": "John", "email": "john@example.com" } }`

- `POST /api/auth/login`
  - Body (JSON): `{ "email": "john@example.com", "password": "secret" }`
  - Response: `{ "user": { "id": "...", "name": "John", "email": "john@example.com" } }`

### Example curl
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"secret"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret"}'
```

## Troubleshooting
- If `npm run dev` fails, ensure Node 18+ and MongoDB URI is valid.
- Confirm CORS is enabled (it is set in `src/app.js`).
- Check logs in the terminal; DB connection failures will exit the process.
