# Task Management Frontend (Vanilla JavaScript)

A simple, beginner-friendly frontend for the Task Management API, built with
plain HTML, CSS, and JavaScript (no frameworks, no build tools).

## Folder Structure

All files live flat in the project root — there are no `css/` or `js/`
subfolders. This keeps the project easy to navigate and means the `<link>`
and `<script>` tags in the HTML files can just reference filenames directly.

```
frontend-management/
├── index.html          (Login page)
├── register.html        (Register page)
├── dashboard.html        (Dashboard - create/view/edit/delete tasks)
├── style.css             (All styling)
├── config.js              (API base URL + storage keys)
├── helpers.js              (Shared helpers, incl. the apiRequest fetch wrapper)
├── login.js
├── register.js
└── dashboard.js
```

## Features

- **Login / Register** — Credentials are validated in the browser, then sent
  to the API. On success, the JWT token is saved in `localStorage` so the
  user stays logged in across page refreshes.
- **Dashboard** — On load, the page checks `localStorage` for a token. If
  there isn't one, the user is redirected to the login page. If there is
  one, it's attached to every API request as an `Authorization: Bearer <token>`
  header.
- **Task CRUD** — Tasks are loaded from `GET /tasks`, created with
  `POST /tasks`, updated with `PUT /tasks/:id`, and removed with
  `DELETE /tasks/:id`.
- **Edit Task** — Click "Edit" on any task to turn it into an inline form,
  pre-filled with its current title, description, priority, and status.
  "Save" sends the update; "Cancel" discards changes.
- **Task Status** — Each task shows a Pending/Completed badge. A one-click
  "Mark Completed" / "Mark Pending" button toggles it without opening the
  full edit form.
- **Task Priority** — Low/Medium/High, selectable when creating or editing a
  task, shown as a color-coded badge.
- **Loading States** — Buttons disable and show a loading label
  (e.g. "Saving...") while a request is in flight, which also prevents
  accidental double submissions. The task list shows "Loading tasks..."
  on initial load.
- **Delete Confirmation** — A confirmation dialog appears before any task is
  deleted.
- **Responsive Design** — Layout adapts for tablet and mobile screens: task
  cards stack vertically, forms never overflow, and buttons keep a
  comfortable tap target size.
- **Auth Error Handling** — Any `401` response from the API (missing,
  expired, or rejected token) automatically clears the stored session and
  redirects to the login page with a "Your session has ended" message.

## Setup & Running

1. Make sure your Flask Task Management API is running. By default this
   project expects it at:

   ```
   http://127.0.0.1:5000
   ```

   If your API runs somewhere else, open `config.js` and change:

   ```js
   const API_BASE_URL = "http://127.0.0.1:5000";
   ```

2. Open `index.html` directly in your browser (double-click it, or right
   click → "Open with" → your browser). No build step or server is required
   for the frontend itself.

   - If your browser blocks requests when opening the file directly (a CORS
     or "file://" issue), instead serve the folder with a simple local
     server, for example:

     ```
     cd frontend-management
     python -m http.server 5500
     ```

     Then visit `http://127.0.0.1:5500` in your browser.

3. Make sure CORS is enabled on your Flask API (e.g. via `flask-cors`) so the
   browser allows requests from the page to your API.

## Adjusting to Match Your API's Response Shapes

This project assumes:

- `POST /login` returns `{ "token": "..." }` (or `access_token`).
- `GET /tasks` returns either a plain array of tasks, or `{ "tasks": [...] }`.
- Each task object has `id`, `title`, `description`, `status`
  (`"pending"` / `"completed"`), and `priority` (`"low"` / `"medium"` / `"high"`).
- `PUT /tasks/:id` accepts `{ title, description, priority, status }` and
  updates the task.
- Error responses include a `message` or `error` field with a readable
  string.

If your actual API returns slightly different field names, the places to
adjust are:

- `login.js` — look for `data.token || data.access_token`
- `dashboard.js` — look for `Array.isArray(data) ? data : data.tasks`,
  and the request bodies inside `addTask()`, `saveEdit()`, and
  `toggleStatus()`

## Validation Implemented

- Username cannot be empty (login & register)
- Password cannot be empty (login & register)
- Confirm password must match password (register)
- Task title cannot be empty (create & edit)
- All API error messages are displayed to the user in a red message box

## Testing Checklist

- [ ] Register a new user
- [ ] Login successfully
- [ ] Login with an incorrect password
- [ ] Create a task
- [ ] Edit a task's title/description
- [ ] Change task status
- [ ] Change task priority
- [ ] Delete a task and test the confirmation dialog
- [ ] Test the application with no tasks
- [ ] Test invalid or missing form values
- [ ] Log out and verify the dashboard cannot be accessed without authentication
- [ ] Let the token expire (or manually clear it) and confirm you're redirected
      to login with a session-ended message
- [ ] Resize the browser and test the tablet/mobile layout

## Notes for Beginners

- Every JS file is heavily commented to explain what each part does.
- `helpers.js` contains an `apiRequest()` function that all pages use to talk
  to the API. It automatically attaches the JWT token, converts the
  response to JSON, and handles expired/invalid sessions — so the
  page-specific JS files stay short and focused on what's unique to that
  page.
- `setButtonLoading()` (also in `helpers.js`) is the one function every
  action button (add, save, delete, toggle status) reuses to show a loading
  state and block double-submits.
- There is no build tool, npm, or bundler involved — these are plain files
  that any browser can run directly.