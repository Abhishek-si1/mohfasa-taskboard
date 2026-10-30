const STORAGE_KEY = "mohfasaTasks";
const THEME_KEY = "mohfasaTheme";

// Single source of truth for every status / priority in the app.
const STATUSES = ["Pending", "In Progress", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];
const TONE = { Low: "good", Medium: "warn", High: "bad", Pending: "warn", "In Progress": "info", Completed: "good" };

const defaultTasks = [
  { id: 1, title: "Design login page", description: "Create wireframes for the login screen.", priority: "High", status: "In Progress" },
  { id: 2, title: "Set up database", description: "Create tables for users and projects.", priority: "High", status: "Pending" },
  { id: 3, title: "Write API docs", description: "Document all REST endpoints.", priority: "Medium", status: "Pending" },
  { id: 4, title: "Fix navbar bug", description: "Menu overlaps on small screens.", priority: "Low", status: "Completed" },
  { id: 5, title: "Team meeting notes", description: "Summarize decisions from Monday.", priority: "Medium", status: "Completed" },
];

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

let tasks = loadTasks();
let toastTimer;

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
    /* storage unavailable: app still works for this session */
  }
}

// Every change (add / delete / update / clear) ends the same way.
function commit(message) {
  saveTasks();
  renderTasks();
  showToast(message);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

const optionsHTML = (list, selected) =>
  list.map((v) => `<option value="${v}"${v === selected ? " selected" : ""}>${v}</option>`).join("");

const badge = (value) => `<span class="badge tone-${TONE[value]}">${value}</span>`;

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateStats() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const status = el.dataset.count;
    el.textContent = status === "All" ? tasks.length : tasks.filter((t) => t.status === status).length;
  });
}

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
          <button class="delete-btn tone-bad" data-id="${task.id}">Delete</button>
        </div>
      </li>`
    )
    .join("");

  updateStats();
}

function addTask(event) {
  event.preventDefault();
  const title = titleInput.value.trim();

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
  tasks = tasks.filter((t) => t.id !== id);
  commit("Task deleted");
}

function updateStatus(id, newStatus) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.status = newStatus;
  commit("Status updated");
}

function clearCompleted() {
  const done = tasks.filter((t) => t.status === "Completed").length;
  if (!done) return showToast("No completed tasks to clear");
  if (!confirm(`Remove ${done} completed task${done > 1 ? "s" : ""}?`)) return;
  tasks = tasks.filter((t) => t.status !== "Completed");
  commit("Completed tasks cleared");
}

// Fill dropdowns from the lists above (no repeated <option> markup in HTML).
priorityInput.innerHTML = optionsHTML(PRIORITIES, "Medium");
statusInput.innerHTML = optionsHTML(STATUSES, "Pending");
filterStatus.innerHTML = `<option value="All">All Statuses</option>${optionsHTML(STATUSES)}`;

form.addEventListener("submit", addTask);
titleInput.addEventListener("input", () => (titleError.textContent = ""));
searchInput.addEventListener("input", renderTasks);
filterStatus.addEventListener("change", renderTasks);
$("clearCompleted").addEventListener("click", clearCompleted);

// Event delegation: one listener handles all delete buttons and status dropdowns
taskList.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) deleteTask(Number(e.target.dataset.id));
});
taskList.addEventListener("change", (e) => {
  if (e.target.classList.contains("status-select")) updateStatus(Number(e.target.dataset.id), e.target.value);
});

// Dark mode toggle (initial theme is already set by the script in <head>)
const themeToggle = $("themeToggle");

function renderThemeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeToggle.textContent = dark ? "☀️ Light" : "🌙 Dark";
  themeToggle.setAttribute("aria-pressed", dark);
}

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  renderThemeButton();
});

renderThemeButton();

renderTasks();