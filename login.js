const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");

if (getToken()) {
  window.location.href = "dashboard.html";
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
  }
});