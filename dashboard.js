requireLogin();

const welcomeUsername = document.getElementById("welcomeUsername");
const logoutBtn = document.getElementById("logoutBtn");
const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const errorMessage = document.getElementById("errorMessage");

welcomeUsername.textContent = getUsername() || "User";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderTasks(tasks) {
  taskList.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  tasks.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "task-item";

    li.innerHTML = `
      <span>${escapeHtml(task.title)}</span>
      <button class="delete-btn" data-id="${task.id}">Delete</button>
    `;

    taskList.appendChild(li);
  });

  document.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const taskId = btn.getAttribute("data-id");
      deleteTask(taskId);
    });
  });
}

async function loadTasks() {
  hideMessage(errorMessage);
  try {
    const data = await apiRequest("/tasks", "GET");
    const tasks = Array.isArray(data) ? data : data.tasks;
    renderTasks(tasks);
  } catch (err) {
    showError(errorMessage, err.message);
  }
}

async function addTask(title) {
  hideMessage(errorMessage);
  try {
    await apiRequest("/tasks", "POST", { title: title });
    taskTitleInput.value = "";
    loadTasks();
  } catch (err) {
    showError(errorMessage, err.message);
  }
}

async function deleteTask(taskId) {
  hideMessage(errorMessage);
  try {
    await apiRequest(`/tasks/${taskId}`, "DELETE");
    loadTasks();
  } catch (err) {
    showError(errorMessage, err.message);
  }
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = taskTitleInput.value.trim();

  if (title === "") {
    showError(errorMessage, "Task title cannot be empty.");
    return;
  }

  addTask(title);
});

logoutBtn.addEventListener("click", function () {
  clearSession();
  window.location.href = "index.html";
});

loadTasks();