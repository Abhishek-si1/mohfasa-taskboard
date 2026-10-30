/* ==========================================================
   Mohfasa TaskBoard - task logic
   ========================================================== */

const STORAGE_KEY = "mohfasaTasks";
const THEME_KEY = "mohfasaTheme";

// Allowed values, used to build every dropdown and badge.
const STATUSES = ["Pending", "In Progress", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

// Colour tone for each badge (matches the .tone-* classes in style.css).
const TONE = {
  Low: "good",
  Medium: "warn",
  High: "bad",
  Pending: "warn",
  "In Progress": "info",
  Completed: "good",
};

// Sample tasks shown on the first visit.
const defaultTasks = [
  { id: 1, title: "Design login page", description: "Create wireframes for the login screen.", priority: "High", status: "In Progress" },
  { id: 2, title: "Set up database", description: "Create tables for users and projects.", priority: "High", status: "Pending" },
  { id: 3, title: "Write API docs", description: "Document all REST endpoints.", priority: "Medium", status: "Pending" },
  { id: 4, title: "Fix navbar bug", description: "Menu overlaps on small screens.", priority: "Low", status: "Completed" },
  { id: 5, title: "Team meeting notes", description: "Summarize decisions from Monday.", priority: "Medium", status: "Completed" },
];

/* ---------- DOM references ---------- */

const $ = (id) => document.getElementById(id);

const form = $("taskForm");
const titleInput = $("title");
const descriptionInput = $("description");
const priorityInput = $("priority");
const statusInput = $("status");
const titleError = $("titleError");
const searchInput = $("searchInput");
const filterStatus = $("filterStatus");
const taskList = $("taskList");
const emptyState = $("emptyState");
const toast = $("toast");
const themeToggle = $("themeToggle");

/* ---------- State and storage ---------- */

let tasks = loadTasks();
let toastTimer;

// Read saved tasks; fall back to the sample tasks if nothing valid is saved.
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [...defaultTasks];
  } catch {
    return [...defaultTasks];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable: the app still works for this session.
  }
}

// Every change (add, delete, update, clear) ends the same way:
// save, re-render and show a message.
function commit(message) {
  saveTasks();
  renderTasks();
  showToast(message);
}

/* ---------- Helpers ---------- */

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// Build <option> tags for a list, marking one as selected.
const optionsHTML = (list, selected) =>
  list.map((value) => `<option value="${value}"${value === selected ? " selected" : ""}>${value}</option>`).join("");

const badge = (value) => `<span class="badge tone-${TONE[value]}">${value}</span>`;

// Escape user text so it cannot inject HTML into the page.
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ---------- Rendering ---------- */

// Update the dashboard numbers from the full task list.
function updateStats() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const status = el.dataset.count;
    el.textContent = status === "All" ? tasks.length : tasks.filter((task) => task.status === status).length;
  });
}

// Apply the current search text and status filter.
function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const status = filterStatus.value;
  return tasks.filter(
    (task) => task.title.toLowerCase().includes(query) && (status === "All" || task.status === status)
  );
}

function renderTasks() {
  const visible = getVisibleTasks();
  emptyState.hidden = visible.length > 0;

  taskList.innerHTML = visible
    .map(
      (task) => `
      <li class="task">
        <div class="task-top">
          <h3>${escapeHTML(task.title)}</h3>
          <div>${badge(task.priority)}${badge(task.status)}</div>
        </div>
        <p>${escapeHTML(task.description) || "No description"}</p>
        <div class="task-actions">
          <select data-id="${task.id}" class="status-select" aria-label="Change status">
            ${optionsHTML(STATUSES, task.status)}
          </select>
          <select data-id="${task.id}" class="priority-select" aria-label="Change priority">
            ${optionsHTML(PRIORITIES, task.priority)}
          </select>
          <button class="delete-btn tone-bad" data-id="${task.id}">Delete</button>
        </div>
      </li>`
    )
    .join("");

  updateStats();
}

/* ---------- Task actions ---------- */

function addTask(event) {
  event.preventDefault();
  const title = titleInput.value.trim();

  // A title is required.
  if (!title) {
    titleError.textContent = "Task title is required.";
    titleInput.focus();
    return;
  }
  titleError.textContent = "";

  tasks.unshift({
    id: Date.now(),
    title,
    description: descriptionInput.value.trim(),
    priority: priorityInput.value,
    status: statusInput.value,
  });

  form.reset();
  commit("Task added successfully");
}

function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  tasks = tasks.filter((task) => task.id !== id);
  commit("Task deleted");
}

function updateStatus(id, newStatus) {
  const task = tasks.find((item) => item.id === id);
  if (task) task.status = newStatus;
  commit("Status updated");
}

function updatePriority(id, newPriority) {
  const task = tasks.find((item) => item.id === id);
  if (task) task.priority = newPriority;
  commit("Priority updated");
}

function clearCompleted() {
  const doneCount = tasks.filter((task) => task.status === "Completed").length;
  if (!doneCount) return showToast("No completed tasks to clear");
  if (!confirm(`Remove ${doneCount} completed task${doneCount > 1 ? "s" : ""}?`)) return;
  tasks = tasks.filter((task) => task.status !== "Completed");
  commit("Completed tasks cleared");
}

/* ---------- Theme toggle ---------- */

// The initial theme is already set by theme.js; this only handles the button.
function renderThemeButton() {
  const isDark = document.documentElement.dataset.theme === "dark";
  themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";
  themeToggle.setAttribute("aria-pressed", isDark);
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage unavailable: the theme just won't be remembered.
  }
  renderThemeButton();
}

/* ---------- Setup ---------- */

// Fill the dropdowns from the lists above.
priorityInput.innerHTML = optionsHTML(PRIORITIES, "Medium");
statusInput.innerHTML = optionsHTML(STATUSES, "Pending");
filterStatus.innerHTML = `<option value="All">All Statuses</option>${optionsHTML(STATUSES)}`;

form.addEventListener("submit", addTask);
titleInput.addEventListener("input", () => (titleError.textContent = ""));
searchInput.addEventListener("input", renderTasks);
filterStatus.addEventListener("change", renderTasks);
$("clearCompleted").addEventListener("click", clearCompleted);
themeToggle.addEventListener("click", toggleTheme);

// Event delegation: one listener covers every delete button and dropdown.
taskList.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) deleteTask(Number(event.target.dataset.id));
});

taskList.addEventListener("change", (event) => {
  const id = Number(event.target.dataset.id);
  if (event.target.classList.contains("status-select")) updateStatus(id, event.target.value);
  if (event.target.classList.contains("priority-select")) updatePriority(id, event.target.value);
});

renderThemeButton();
renderTasks();