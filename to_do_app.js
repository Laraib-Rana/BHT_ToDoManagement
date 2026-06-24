let tasks = JSON.parse(localStorage.getItem('all_tasks_key')) || [];
let currentFilter = 'all';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskPriority = document.getElementById('task-priority');
const taskDate = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('theme-toggle');

const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statCompleted = document.getElementById('stat-completed');
const statProgress = document.getElementById('stat-progress');

function updateAppData() {
    localStorage.setItem('all_tasks_key', JSON.stringify(tasks));
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    statTotal.innerText = total;
    statActive.innerText = active;
    statCompleted.innerText = completed;
    statProgress.innerText = `${percentage}%`;
}

function renderTasks() {
    taskList.innerHTML = '';
    const searchText = searchInput.value.toLowerCase();

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchText);
        if (currentFilter === 'active') return matchesSearch && !task.completed;
        if (currentFilter === 'completed') return matchesSearch && task.completed;
        return matchesSearch;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<li class="list-group-item text-center text-muted p-4">No tasks found matching criteria.</li>`;
        return;
    }

    filteredTasks.forEach(task => {
        const badgeColor = task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'success';
        const li = document.createElement('li');
        
        li.className = `list-group-item d-flex justify-content-between align-items-center p-3 ${task.completed ? 'bg-body-tertiary' : ''}`;
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-id', task.id);
        
        li.innerHTML = `
            <div class="d-flex align-items-center gap-3 style="flex: 1;"">
                <input type="checkbox" class="form-check-input" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${task.id})">
                <div class="${task.completed ? 'completed-task' : ''}">
                    <span class="fw-semibold d-block text-wrap-break">${task.text}</span>
                    <small class="text-muted d-inline-block me-2">${task.date ? '📅 ' + task.date : 'No Deadline'}</small>
                    <span class="badge bg-${badgeColor}-subtle text-${badgeColor} border border-${badgeColor} style="font-size: 0.7rem;"">${task.priority} Priority</span>
                </div>
            </div>
            <div class="d-flex gap-1 ms-2">
                <button class="btn btn-sm btn-light border" onclick="editTask(${task.id})" title="Edit">✏️</button>
                <button class="btn btn-sm btn-light border text-danger" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
            </div>
        `;
        
        setupDragAndDropEvents(li);
        taskList.appendChild(li);
    });
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTask = {
        id: Date.now(),
        text: taskInput.value.trim(),
        priority: taskPriority.value,
        date: taskDate.value,
        completed: false
    };
    tasks.push(newTask);
    updateAppData();
    renderTasks();
    taskForm.reset();
    taskPriority.value = "Medium";
});

window.toggleComplete = (id) => {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    updateAppData();
    renderTasks();
};

window.deleteTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    updateAppData();
    renderTasks();
};

window.editTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newText = prompt("Modify task description:", task.text);
    if (newText !== null && newText.trim() !== "") {
        task.text = newText.trim();
        updateAppData();
        renderTasks();
    }
};

searchInput.addEventListener('input', renderTasks);
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        renderTasks();
    });
});

let draggedItem = null;

function setupDragAndDropEvents(item) {
    item.addEventListener('dragstart', () => {
        draggedItem = item;
        setTimeout(() => item.classList.add('dragging'), 0);
    });

    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        
        const currentUIElements = [...taskList.querySelectorAll('.list-group-item')];
        const newOrderedTasks = [];
        
        currentUIElements.forEach(el => {
            const elId = parseInt(el.getAttribute('data-id'));
            const foundTask = tasks.find(t => t.id === elId);
            if (foundTask) newOrderedTasks.push(foundTask);
        });
        
        tasks = newOrderedTasks;
        updateAppData();
        draggedItem = null;
    });
}

taskList.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(taskList, e.clientY);
    if (afterElement == null) {
        taskList.appendChild(draggedItem);
    } else {
        taskList.insertBefore(draggedItem, afterElement);
    }
});

function getDragAfterElement(container, yPosition) {
    const draggableElements = [...container.querySelectorAll('.list-group-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = yPosition - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

themeToggle.addEventListener('click', () => {
    const htmlEl = document.getElementById('app-html');
    const isLight = htmlEl.getAttribute('data-bs-theme') === 'light';
    
    htmlEl.setAttribute('data-bs-theme', isLight ? 'dark' : 'light');
    themeToggle.innerText = isLight ? "☀️ Light Mode" : "🌙 Dark Mode";
    themeToggle.className = isLight ? "btn btn-outline-info btn-sm" : "btn btn-outline-secondary btn-sm";
});

updateAppData();
renderTasks();
