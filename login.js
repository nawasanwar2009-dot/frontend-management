const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");
const flashMessage = document.getElementById("flashMessage");
const loginSubmitBtn = loginForm.querySelector("button[type='submit']");

// If we already have a token, skip straight to the dashboard.
if (getToken()) {
  window.location.href = "dashboard.html";
}

// If helpers.js's handleAuthError() sent us here because the session
// ended, show that message now.
const flash = consumeAuthFlashMessage();
if (flash) {
  flashMessage.textContent = flash;
  flashMessage.style.display = "block";
}

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  hideMessage(errorMessage);

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === "") {
    showError(errorMessage, "Username cannot be empty.");
    return;
  }

  if (password === "") {
    showError(errorMessage, "Password cannot be empty.");
    return;
  }

  // Disable the button and show "Logging in..." for the duration of
  // the request, so a slow network can't lead to a double submit.
  const restoreButton = setButtonLoading(loginSubmitBtn, "Logging in...");

  try {
    const data = await apiRequest("/login", "POST", {
      username: username,
      password: password,
    });

    const token = data.token || data.access_token;

    if (!token) {
      showError(errorMessage, "Login succeeded but no token was returned.");
      return;
    }

    saveSession(token, username);
    window.location.href = "dashboard.html";
  } catch (err) {
    showError(errorMessage, err.message);
  } finally {
    restoreButton();
  }
});