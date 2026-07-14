const registerForm = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  hideMessage(errorMessage);
  hideMessage(successMessage);

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (username === "") {
    showError(errorMessage, "Username cannot be empty.");
    return;
  }

  if (password === "") {
    showError(errorMessage, "Password cannot be empty.");
    return;
  }

  if (password !== confirmPassword) {
    showError(errorMessage, "Passwords do not match.");
    return;
  }

  try {
    await apiRequest("/register", "POST", {
      username: username,
      password: password,
    });

    successMessage.textContent = "Registration successful! Redirecting to login...";
    successMessage.style.display = "block";

    setTimeout(function () {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    showError(errorMessage, err.message);
  }
});