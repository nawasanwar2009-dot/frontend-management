# Task Management Frontend (Vanilla JavaScript)

A simple, beginner-friendly frontend for the Task Management API, built with
plain HTML, CSS, and JavaScript (no frameworks).

## Folder Structure

```
task-frontend/
├── index.html          (Login page)
├── register.html       (Register page)
├── dashboard.html       (Dashboard - create/view/delete tasks)
├── css/
│   └── style.css       (All styling)
└── js/
    ├── config.js        (API base URL + storage keys)
    ├── helpers.js        (Shared helper functions, incl. fetch wrapper)
    ├── login.js
    ├── register.js
    └── dashboard.js
```

## How It Works

1. **Login / Register** – The user enters credentials, which are validated in
   the browser, then sent to the API. On a successful login, the JWT token
   returned by the API is saved in `localStorage` so the user stays logged in
   across page refreshes.
2. **Dashboard** – On load, the page checks `localStorage` for a token. If
   there isn't one, the user is redirected back to the login page. If there
   is one, it's attached to every API request as an `Authorization: Bearer
   <token>` header.
3. **Tasks** – Tasks are loaded from `GET /tasks`, created with `POST
   /tasks`, and removed with `DELETE /tasks/:id`. The page re-fetches the
   task list after every add/delete so it always reflects the current state.

## Setup & Running

1. Make sure your Flask Task Management API is running. By default this
   project expects it at:

   ```
   http://127.0.0.1:5000
   ```

   If your API runs somewhere else, open `js/config.js` and change:

   ```js
   const API_BASE_URL = "http://127.0.0.1:5000";
   ```

2. Open `index.html` directly in your browser (double-click it, or right
   click → "Open with" → your browser). No build step or server is required
   for the frontend itself.

   - If your browser blocks requests when opening the file directly (a CORS
     or "file://" issue), instead serve the folder with a simple local
     server, for example:

     ```bash
     cd task-frontend
     python -m http.server 5500
     ```

     Then visit `http://127.0.0.1:5500` in your browser.

3. Make sure CORS is enabled on your Flask API (e.g. via `flask-cors`) so the
   browser allows requests from the page to your API.

## Adjusting to Match Your API's Response Shapes

This project assumes:

- `POST /login` returns `{ "token": "..." }` (or `access_token`).
- `GET /tasks` returns either a plain array of tasks, or `{ "tasks": [...] }`.
- Each task object has at least `id` and `title` fields.
- Error responses include a `message` or `error` field with a readable
  string.

If your actual API returns slightly different field names, the places to
adjust are:

- `js/login.js` — look for `data.token || data.access_token`
- `js/dashboard.js` — look for `Array.isArray(data) ? data : data.tasks`

## Validation Implemented

- Username cannot be empty (login & register)
- Password cannot be empty (login & register)
- Confirm password must match password (register)
- Task title cannot be empty (dashboard)
- All API error messages are displayed to the user in a red message box

## Notes for Beginners

- Every JS file is heavily commented to explain what each part does.
- `helpers.js` contains an `apiRequest()` function that all pages use to talk
  to the API. It automatically attaches the JWT token and converts the
  response to JSON, so the page-specific JS files stay short and focused on
  what's unique to that page.
- There is no build tool, npm, or bundler involved — these are plain files
  that any browser can run directly.