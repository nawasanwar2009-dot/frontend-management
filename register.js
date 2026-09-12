const registerForm = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const registerSubmitBtn = registerForm.querySelector("button[type='submit']");

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

  const restoreButton = setButtonLoading(registerSubmitBtn, "Creating account...");

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
    restoreButton();
  }
  // stops a user from clicking "Register" again during the 1.5s delay.
});