// helpers.js
// Shared functions used by more than one page (login, register, dashboard).
// Keeping them here means each page's own JS file can stay short and
// focused on what's unique to that page.

// ---------- Message boxes (errors / success) ----------

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
}

function hideMessage(element) {
  element.textContent = "";
  element.style.display = "none";
}

// ---------- Session (JWT) storage ----------

function saveSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

// ---------- Auth-error "flash message" ----------
// When we bounce the user back to the login page because their session
// ended, we can't just show an error box on THIS page (dashboard) since
// we're about to navigate away from it. Instead we stash a short-lived
// message in localStorage, and index.html checks for it on load.

const AUTH_FLASH_KEY = "task_app_auth_flash";

function setAuthFlashMessage(message) {
  localStorage.setItem(AUTH_FLASH_KEY, message);
}

// Reads (and clears) the flash message, if any. Returns null if there
// isn't one. Call this once, when a page first loads.
function consumeAuthFlashMessage() {
  const message = localStorage.getItem(AUTH_FLASH_KEY);
  if (message) {
    localStorage.removeItem(AUTH_FLASH_KEY);
  }
  return message;
}

// Called whenever the API tells us the token is missing/expired/invalid.
// Clears whatever session we had, leaves a message for the login page,
// and redirects there.
function handleAuthError() {
  clearSession();
  setAuthFlashMessage("Your session has ended. Please log in again.");
  window.location.href = "index.html";
}

// ---------- Loading state helpers ----------
// Disables a button and swaps its label while a request is in flight,
// then restores it afterwards. This is what satisfies "prevent
// accidental repeated submissions" and "show a loading state" at once,
// since a disabled button can't be clicked twice.
//
// Usage:
//   const restore = setButtonLoading(myButton, "Saving...");
//   try { await doSomething(); } finally { restore(); }

function setButtonLoading(button, loadingText) {
  const originalText = button.textContent;
  const wasDisabled = button.disabled;

  button.disabled = true;
  button.textContent = loadingText;

  // Returns a "restore" function so the caller doesn't have to
  // remember the original text/disabled state themselves.
  return function restore() {
    button.disabled = wasDisabled;
    button.textContent = originalText;
  };
}

// Small utility to avoid HTML injection when we insert task text
// (title/description) into the page with innerHTML.
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : text;
  return div.innerHTML;
}

// ---------- The API wrapper ----------
// Every page-specific JS file calls this instead of using fetch()
// directly. It attaches the JWT automatically, parses JSON, and turns
// non-OK responses into a thrown Error with a readable message.
//
// requiresAuth (4th argument, default true):
//   true  -> protected endpoints (/tasks...). A missing/expired/rejected
//            token ends the session and sends the user to the login page.
//   false -> /login and /register. A 401 there just means "wrong
//            username or password", so we must NOT treat it as an
//            expired session - we show the API's own error message.

async function apiRequest(path, method = "GET", body = null, requiresAuth = true) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      // Token is MISSING: no point calling the API at all.
      handleAuthError();
      throw new Error("Session expired.");
    }
    headers["Authorization"] = "Bearer " + token;
  }

  const options = {
    method: method,
    headers: headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(API_BASE_URL + path, options);
  } catch (networkErr) {
    // fetch() itself throws on network failure (server down, no
    // internet, CORS block, etc) - this is different from the server
    // responding with an error status.
    throw new Error(
      "Could not reach the server. Check that the API is running."
    );
  }

  // Read the JSON body first, because we need it to tell a rejected
  // token apart from an ordinary validation error.
  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null; // Response had no JSON body (e.g. a 204 No Content).
  }

  // Token EXPIRED or REJECTED by the backend.
  //   401 -> expired / missing token
  //   422 + "msg" -> flask-jwt-extended's reply for a malformed token
  // (a normal validation 422 has no "msg", so it is not treated as a
  // session problem)
  const tokenRejected =
    response.status === 401 || (response.status === 422 && data && data.msg);

  if (requiresAuth && tokenRejected) {
    handleAuthError();
    // Throw anyway so any awaiting code stops running instead of
    // continuing as if the request succeeded.
    throw new Error("Session expired.");
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error || data.msg)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}