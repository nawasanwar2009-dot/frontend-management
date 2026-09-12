
// Central place for settings that other files need.
// If your Flask API runs somewhere other than the default below,
// this is the only line you should need to change.

const API_BASE_URL = "http://127.0.0.1:5000";

// Keys used when saving things to the browser's localStorage.
// Kept here (instead of typed out everywhere) so a typo can't
// silently break login persistence.
const TOKEN_KEY = "task_app_token";
const USERNAME_KEY = "task_app_username";