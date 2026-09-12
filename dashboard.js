requireLogin();

// ---------- Element references ----------

const welcomeUsername = document.getElementById("welcomeUsername");
const logoutBtn = document.getElementById("logoutBtn");

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskPriorityInput = document.getElementById("taskPriority");
const addTaskBtn = document.getElementById("addTaskBtn");

const taskList = document.getElementById("taskList");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const errorMessage = document.getElementById("errorMessage");

welcomeUsername.textContent = getUsername() || "User";

// Keep the last-loaded tasks in memory. This lets us pre-fill the edit
// form without making an extra GET request for a single task, and lets
// us re-render after a status/priority change without a full reload.
let currentTasks = [];

// Which task (by id) is currently being edited, if any. Only one task
// can be in edit mode at a time - this keeps the UI simple and avoids
// juggling multiple unsaved forms.
let editingTaskId = null;

// ---------- Small display helpers ----------

// Turns "pending" into "Pending", "high" into "High", etc. for display.
function capitalize(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Normalizes whatever the API sends back so the rest of the code can
// always rely on task.status and task.priority existing. If your API
// uses different field names or values, this is the place to adjust.
function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title || "",
    description: task.description || "",
    status: task.status || "pending",
    priority: task.priority || "medium",
  };
}

// ---------- Rendering ----------

function renderTasks(tasks) {
  currentTasks = tasks.map(normalizeTask);

  taskList.innerHTML = "";

  if (currentTasks.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  currentTasks.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    if (task.id === editingTaskId) {
      li.appendChild(buildEditForm(task));
    } else {
      li.appendChild(buildTaskView(task));
    }

    taskList.appendChild(li);
  });
}

// Builds the normal (read-only) view of one task card.
function buildTaskView(task) {
  const wrapper = document.createElement("div");
  wrapper.className = "task-view";

  const isCompleted = task.status === "completed";

  wrapper.innerHTML = `
    <div class="task-main">
      <div class="task-title-row">
        <span class="task-title ${isCompleted ? "task-title-done" : ""}">${escapeHtml(task.title)}</span>
        <span class="badge priority-${task.priority}">${capitalize(task.priority)}</span>
        <span class="badge status-${task.status}">${capitalize(task.status)}</span>
      </div>
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
    </div>
    <div class="task-actions">
      <button class="status-btn" type="button">
        ${isCompleted ? "Mark Pending" : "Mark Completed"}
      </button>
      <button class="edit-btn" type="button">Edit</button>
      <button class="delete-btn" type="button">Delete</button>
    </div>
  `;

  wrapper.querySelector(".status-btn").addEventListener("click", function (event) {
    toggleStatus(task, event.currentTarget);
  });

  wrapper.querySelector(".edit-btn").addEventListener("click", function () {
    editingTaskId = task.id;
    renderTasks(currentTasks);
  });

  wrapper.querySelector(".delete-btn").addEventListener("click", function (event) {
    confirmAndDelete(task, event.currentTarget);
  });

  return wrapper;
}

// Builds the inline edit form for one task, pre-filled with its
// current values (assignment requirement 1: "Pre-fill the existing
// task information").
function buildEditForm(task) {
  const wrapper = document.createElement("div");
  wrapper.className = "task-edit";

  wrapper.innerHTML = `
    <input type="text" class="edit-title" value="${escapeHtml(task.title)}" placeholder="Task title" />
    <textarea class="edit-description" rows="2" placeholder="Description (optional)">${escapeHtml(task.description)}</textarea>
    <div class="edit-row">
      <select class="edit-priority">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select class="edit-status">
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
    </div>
    <div class="edit-error"></div>
    <div class="task-actions">
      <button class="save-btn" type="button">Save</button>
      <button class="cancel-btn" type="button">Cancel</button>
    </div>
  `;

  wrapper.querySelector(".edit-priority").value = task.priority;
  wrapper.querySelector(".edit-status").value = task.status;

  wrapper.querySelector(".cancel-btn").addEventListener("click", function () {
    editingTaskId = null;
    renderTasks(currentTasks);
  });

  wrapper.querySelector(".save-btn").addEventListener("click", function (event) {
    saveEdit(task, wrapper, event.currentTarget);
  });

  return wrapper;
}

// ---------- API actions ----------

async function loadTasks() {
  hideMessage(errorMessage);
  loadingState.style.display = "block";
  taskList.innerHTML = "";
  emptyState.style.display = "none";

  try {
    const data = await apiRequest("/tasks", "GET");
    const tasks = Array.isArray(data) ? data : data.tasks;
    renderTasks(tasks || []);
  } catch (err) {
    showError(errorMessage, err.message);
  } finally {
    loadingState.style.display = "none";
  }
}

async function addTask(title, description, priority) {
  hideMessage(errorMessage);
  const restoreButton = setButtonLoading(addTaskBtn, "Adding...");

  try {
    await apiRequest("/tasks", "POST", {
      title: title,
      description: description,
      priority: priority,
      status: "pending",
    });
    taskTitleInput.value = "";
    taskDescriptionInput.value = "";
    taskPriorityInput.value = "medium";
    await loadTasks();
  } catch (err) {
    showError(errorMessage, err.message);
  } finally {
    restoreButton();
  }
}

// Saves an edited task (title/description/priority/status) - covers
// both requirement 1 (edit title/description) and part of requirement
// 3 (priority editable from the edit form).
async function saveEdit(task, formWrapper, saveButton) {
  const editErrorBox = formWrapper.querySelector(".edit-error");
  hideMessage(editErrorBox);

  const newTitle = formWrapper.querySelector(".edit-title").value.trim();
  const newDescription = formWrapper.querySelector(".edit-description").value.trim();
  const newPriority = formWrapper.querySelector(".edit-priority").value;
  const newStatus = formWrapper.querySelector(".edit-status").value;

  if (newTitle === "") {
    showError(editErrorBox, "Task title cannot be empty.");
    return;
  }

  const restoreButton = setButtonLoading(saveButton, "Saving...");

  try {
    await apiRequest(`/tasks/${task.id}`, "PUT", {
      title: newTitle,
      description: newDescription,
      priority: newPriority,
      status: newStatus,
    });
    editingTaskId = null;
    await loadTasks();
  } catch (err) {
    showError(editErrorBox, err.message);
    restoreButton();
  }
}

// Toggles a task between "pending" and "completed" without opening
// the full edit form - this is the quick one-click path requirement 2
// describes ("allow the user to change the status").
async function toggleStatus(task, button) {
  hideMessage(errorMessage);
  const newStatus = task.status === "completed" ? "pending" : "completed";
  const restoreButton = setButtonLoading(button, "Updating...");

  try {
    await apiRequest(`/tasks/${task.id}`, "PUT", {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: newStatus,
    });
    await loadTasks();
  } catch (err) {
    showError(errorMessage, err.message);
    restoreButton();
  }
}

// Asks for confirmation, then deletes - assignment requirement 5.
async function confirmAndDelete(task, button) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${task.title}"?`
  );
  if (!confirmed) {
    return;
  }

  hideMessage(errorMessage);
  const restoreButton = setButtonLoading(button, "Deleting...");

  try {
    await apiRequest(`/tasks/${task.id}`, "DELETE");
    await loadTasks();
  } catch (err) {
    showError(errorMessage, err.message);
    restoreButton();
  }
}

// ---------- Event listeners ----------

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const priority = taskPriorityInput.value;

  if (title === "") {
    showError(errorMessage, "Task title cannot be empty.");
    return;
  }

  addTask(title, description, priority);
});

logoutBtn.addEventListener("click", function () {
  clearSession();
  window.location.href = "index.html";
});

loadTasks();