// Nodus Todo - Desktop Application State & Logic

const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: 'Work', color: '#38bdf8' },
  { id: 'cat-personal', name: 'Personal', color: '#10b981' },
  { id: 'cat-learning', name: 'Learning', color: '#a855f7' },
  { id: 'cat-errands', name: 'Errands', color: '#f59e0b' }
];

const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Welcome to Nodus Desktop Todo! 👋',
    completed: false,
    starred: true,
    priority: 'high',
    categoryId: 'cat-work',
    dueDate: new Date().toISOString().split('T')[0],
    notes: 'A native-feel Windows 11 Fluent styled desktop task manager with glassmorphism, offline persistence, and seamless window controls.',
    subtasks: [
      { id: 'sub-1', title: 'Try minimizing and maximizing the custom titlebar', done: false },
      { id: 'sub-2', title: 'Create your first custom task or category', done: false },
      { id: 'sub-3', title: 'Use Ctrl+K to search your tasks anytime', done: false }
    ],
    createdAt: Date.now() - 3600000
  },
  {
    id: 'task-2',
    title: 'Design high-converting landing page mockups',
    completed: false,
    starred: false,
    priority: 'medium',
    categoryId: 'cat-work',
    dueDate: '',
    notes: 'Draft wireframes in Figma with modern dark mode aesthetic.',
    subtasks: [],
    createdAt: Date.now() - 7200000
  },
  {
    id: 'task-3',
    title: 'Daily workout & 30 min cardio',
    completed: true,
    starred: false,
    priority: 'low',
    categoryId: 'cat-personal',
    dueDate: new Date().toISOString().split('T')[0],
    notes: 'Stay hydrated and stretch before session.',
    subtasks: [],
    createdAt: Date.now() - 86400000
  }
];

class TodoApp {
  constructor() {
    this.tasks = this.load('nodus_tasks', DEFAULT_TASKS);
    this.categories = this.load('nodus_categories', DEFAULT_CATEGORIES);
    this.currentFilter = 'all';
    this.currentCategoryFilter = null;
    this.searchQuery = '';
    this.priorityFilter = 'all';
    this.sortBy = 'created-desc';
    this.selectedTaskId = null;
    this.quickPriority = 'normal';

    this.initWindowControls();
    this.initDOMElements();
    this.bindEvents();
    this.render();
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  save() {
    localStorage.setItem('nodus_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('nodus_categories', JSON.stringify(this.categories));
  }

  /* ================= Window Controls ================= */
  initWindowControls() {
    const btnMin = document.getElementById('btn-minimize');
    const btnMax = document.getElementById('btn-maximize');
    const btnClose = document.getElementById('btn-close');
    const iconMax = document.getElementById('icon-max');
    const iconRestore = document.getElementById('icon-restore');

    if (window.electronAPI) {
      btnMin?.addEventListener('click', () => window.electronAPI.minimize());
      btnMax?.addEventListener('click', () => window.electronAPI.toggleMaximize());
      btnClose?.addEventListener('click', () => window.electronAPI.close());

      window.electronAPI.onWindowStateChange(({ isMaximized }) => {
        if (isMaximized) {
          iconMax?.classList.add('hidden');
          iconRestore?.classList.remove('hidden');
        } else {
          iconMax?.classList.remove('hidden');
          iconRestore?.classList.add('hidden');
        }
      });
    } else {
      // Browser fallback
      btnMin?.addEventListener('click', () => console.log('Minimize window'));
      btnMax?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
      btnClose?.addEventListener('click', () => window.close());
    }
  }

  /* ================= DOM Element Caching ================= */
  initDOMElements() {
    this.taskListEl = document.getElementById('tasks-list');
    this.emptyStateEl = document.getElementById('empty-state');
    this.categoryListEl = document.getElementById('category-list');
    this.quickInput = document.getElementById('quick-input');
    this.quickDueDate = document.getElementById('quick-due-date');
    this.quickCatSelect = document.getElementById('quick-category-select');
    this.quickPriorityBtn = document.getElementById('toggle-quick-priority');
    this.searchInput = document.getElementById('search-input');
    this.priorityFilterEl = document.getElementById('priority-filter');
    this.sortFilterEl = document.getElementById('sort-filter');
    this.viewTitleEl = document.getElementById('current-view-title');
    this.filterCounterEl = document.getElementById('task-filter-counter');
    this.titlebarSubtitle = document.getElementById('titlebar-subtitle');

    // Detail Pane Elements
    this.detailPane = document.getElementById('task-detail-pane');
    this.detailTitle = document.getElementById('detail-title');
    this.detailPriority = document.getElementById('detail-priority');
    this.detailCategory = document.getElementById('detail-category');
    this.detailDueDate = document.getElementById('detail-due-date');
    this.detailNotes = document.getElementById('detail-notes');
    this.detailSubtaskList = document.getElementById('subtask-list');
    this.subtaskProgress = document.getElementById('subtask-progress');
    this.newSubtaskInput = document.getElementById('new-subtask-input');
    this.detailCreatedAt = document.getElementById('detail-created-at');

    // Category Modal
    this.catModal = document.getElementById('category-modal');
    this.newCatName = document.getElementById('new-cat-name');
    this.selectedCatColor = '#38bdf8';
  }

  /* ================= Event Listeners ================= */
  bindEvents() {
    // Quick Add
    document.getElementById('btn-quick-add')?.addEventListener('click', () => this.addQuickTask());
    this.quickInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addQuickTask();
    });

    // Quick Priority Toggle
    this.quickPriorityBtn?.addEventListener('click', () => {
      const order = ['normal', 'medium', 'high'];
      const next = order[(order.indexOf(this.quickPriority) + 1) % order.length];
      this.quickPriority = next;
      this.updateQuickPriorityUI();
    });

    // Navigation Filters
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.cat-item').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.currentCategoryFilter = null;
        this.render();
      });
    });

    // Search & Shortcuts
    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTasks();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.searchInput?.focus();
      }
      if (e.key === 'Escape') {
        this.closeDetailPane();
        this.catModal?.classList.add('hidden');
      }
    });

    // Priority & Sort Change
    this.priorityFilterEl?.addEventListener('change', (e) => {
      this.priorityFilter = e.target.value;
      this.renderTasks();
    });

    this.sortFilterEl?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderTasks();
    });

    // Clear completed
    document.getElementById('btn-clear-completed')?.addEventListener('click', () => {
      this.tasks = this.tasks.filter((t) => !t.completed);
      this.save();
      this.render();
    });

    // Detail pane close & updates
    document.getElementById('btn-close-detail')?.addEventListener('click', () => this.closeDetailPane());

    this.detailTitle?.addEventListener('input', (e) => this.updateActiveTask({ title: e.target.value }));
    this.detailPriority?.addEventListener('change', (e) => this.updateActiveTask({ priority: e.target.value }));
    this.detailCategory?.addEventListener('change', (e) => this.updateActiveTask({ categoryId: e.target.value }));
    this.detailDueDate?.addEventListener('change', (e) => this.updateActiveTask({ dueDate: e.target.value }));
    this.detailNotes?.addEventListener('input', (e) => this.updateActiveTask({ notes: e.target.value }));

    // Delete task button
    document.getElementById('btn-delete-task')?.addEventListener('click', () => {
      if (this.selectedTaskId) {
        this.tasks = this.tasks.filter((t) => t.id !== this.selectedTaskId);
        this.selectedTaskId = null;
        this.save();
        this.closeDetailPane();
        this.render();
      }
    });

    // Subtasks add
    document.getElementById('btn-add-subtask')?.addEventListener('click', () => this.addSubtask());
    this.newSubtaskInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addSubtask();
    });

    // Category modal
    document.getElementById('btn-add-category')?.addEventListener('click', () => {
      this.catModal?.classList.remove('hidden');
      this.newCatName.value = '';
      this.newCatName.focus();
    });
    document.getElementById('btn-close-cat-modal')?.addEventListener('click', () => {
      this.catModal?.classList.add('hidden');
    });
    document.getElementById('btn-cancel-cat')?.addEventListener('click', () => {
      this.catModal?.classList.add('hidden');
    });

    document.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');
        this.selectedCatColor = swatch.dataset.color;
      });
    });

    document.getElementById('btn-save-cat')?.addEventListener('click', () => {
      const name = this.newCatName.value.trim();
      if (!name) return;
      const newCat = {
        id: 'cat-' + Date.now(),
        name,
        color: this.selectedCatColor
      };
      this.categories.push(newCat);
      this.save();
      this.catModal?.classList.add('hidden');
      this.renderCategories();
      this.populateCategoryDropdowns();
    });

    document.getElementById('btn-open-create-modal')?.addEventListener('click', () => {
      this.quickInput?.focus();
    });
  }

  updateQuickPriorityUI() {
    const label = this.quickPriority.charAt(0).toUpperCase() + this.quickPriority.slice(1);
    this.quickPriorityBtn.innerHTML = `<span class="dot-priority ${this.quickPriority}"></span> ${label}`;
    this.quickPriorityBtn.dataset.priority = this.quickPriority;
  }

  /* ================= Task Operations ================= */
  addQuickTask() {
    let title = this.quickInput.value.trim();
    if (!title) return;

    let priority = this.quickPriority === 'normal' ? 'low' : this.quickPriority;
    let categoryId = this.quickCatSelect.value || (this.categories[0] ? this.categories[0].id : '');
    let dueDate = this.quickDueDate.value;

    // Smart inline parse: !high or !med or @Work
    if (title.includes('!high')) { priority = 'high'; title = title.replace('!high', '').trim(); }
    if (title.includes('!medium') || title.includes('!med')) { priority = 'medium'; title = title.replace(/!med(ium)?/, '').trim(); }
    if (title.includes('!low')) { priority = 'low'; title = title.replace('!low', '').trim(); }

    const catMatch = title.match(/@(\w+)/);
    if (catMatch) {
      const found = this.categories.find(c => c.name.toLowerCase() === catMatch[1].toLowerCase());
      if (found) {
        categoryId = found.id;
        title = title.replace(catMatch[0], '').trim();
      }
    }

    const newTask = {
      id: 'task-' + Date.now(),
      title,
      completed: false,
      starred: false,
      priority,
      categoryId,
      dueDate,
      notes: '',
      subtasks: [],
      createdAt: Date.now()
    };

    this.tasks.unshift(newTask);
    this.quickInput.value = '';
    this.save();
    this.render();
  }

  toggleTaskCompleted(id, e) {
    e?.stopPropagation();
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
      this.render();
      if (this.selectedTaskId === id) this.renderDetailPane();
    }
  }

  toggleTaskStarred(id, e) {
    e?.stopPropagation();
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.starred = !task.starred;
      this.save();
      this.render();
    }
  }

  selectTask(id) {
    this.selectedTaskId = id;
    this.renderTasks();
    this.renderDetailPane();
  }

  closeDetailPane() {
    this.selectedTaskId = null;
    this.detailPane.classList.add('collapsed');
    this.renderTasks();
  }

  updateActiveTask(updates) {
    if (!this.selectedTaskId) return;
    const task = this.tasks.find(t => t.id === this.selectedTaskId);
    if (task) {
      Object.assign(task, updates);
      this.save();
      this.renderTasks();
      this.updateCounts();
    }
  }

  addSubtask() {
    const title = this.newSubtaskInput.value.trim();
    if (!title || !this.selectedTaskId) return;

    const task = this.tasks.find(t => t.id === this.selectedTaskId);
    if (task) {
      task.subtasks = task.subtasks || [];
      task.subtasks.push({
        id: 'sub-' + Date.now(),
        title,
        done: false
      });
      this.newSubtaskInput.value = '';
      this.save();
      this.renderDetailPane();
    }
  }

  toggleSubtask(subId) {
    const task = this.tasks.find(t => t.id === this.selectedTaskId);
    if (task && task.subtasks) {
      const sub = task.subtasks.find(s => s.id === subId);
      if (sub) {
        sub.done = !sub.done;
        this.save();
        this.renderDetailPane();
      }
    }
  }

  deleteSubtask(subId) {
    const task = this.tasks.find(t => t.id === this.selectedTaskId);
    if (task && task.subtasks) {
      task.subtasks = task.subtasks.filter(s => s.id !== subId);
      this.save();
      this.renderDetailPane();
    }
  }

  /* ================= Rendering Logic ================= */
  render() {
    this.renderCategories();
    this.populateCategoryDropdowns();
    this.renderTasks();
    this.updateCounts();
  }

  renderCategories() {
    this.categoryListEl.innerHTML = '';
    this.categories.forEach((cat) => {
      const count = this.tasks.filter(t => t.categoryId === cat.id && !t.completed).length;
      const btn = document.createElement('button');
      btn.className = `cat-item ${this.currentCategoryFilter === cat.id ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="cat-dot" style="background: ${cat.color};"></span>
        <span class="nav-text">${this.escapeHTML(cat.name)}</span>
        <span class="badge">${count}</span>
      `;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.cat-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategoryFilter = cat.id;
        this.currentFilter = null;
        this.render();
      });
      this.categoryListEl.appendChild(btn);
    });
  }

  populateCategoryDropdowns() {
    const options = this.categories.map(c => `<option value="${c.id}">${this.escapeHTML(c.name)}</option>`).join('');
    if (this.quickCatSelect) this.quickCatSelect.innerHTML = options;
    if (this.detailCategory) this.detailCategory.innerHTML = options;
  }

  getFilteredTasks() {
    const todayStr = new Date().toISOString().split('T')[0];

    return this.tasks.filter((task) => {
      // Category filter
      if (this.currentCategoryFilter) {
        if (task.categoryId !== this.currentCategoryFilter) return false;
      } else if (this.currentFilter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (this.currentFilter === 'starred') {
        if (!task.starred) return false;
      } else if (this.currentFilter === 'completed') {
        if (!task.completed) return false;
      }

      // Priority filter
      if (this.priorityFilter !== 'all' && task.priority !== this.priorityFilter) {
        return false;
      }

      // Search query
      if (this.searchQuery) {
        const titleMatch = task.title.toLowerCase().includes(this.searchQuery);
        const notesMatch = (task.notes || '').toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !notesMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (this.sortBy === 'created-asc') return a.createdAt - b.createdAt;
      if (this.sortBy === 'created-desc') return b.createdAt - a.createdAt;
      if (this.sortBy === 'due-date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (this.sortBy === 'priority') {
        const weight = { high: 3, medium: 2, low: 1 };
        return (weight[b.priority] || 1) - (weight[a.priority] || 1);
      }
      return 0;
    });
  }

  renderTasks() {
    const filtered = this.getFilteredTasks();

    // Update Header
    let title = 'All Tasks';
    if (this.currentCategoryFilter) {
      const cat = this.categories.find(c => c.id === this.currentCategoryFilter);
      title = cat ? cat.name : 'Category';
    } else if (this.currentFilter === 'today') {
      title = "Today's Tasks";
    } else if (this.currentFilter === 'starred') {
      title = 'Priority & Starred';
    } else if (this.currentFilter === 'completed') {
      title = 'Completed Tasks';
    }

    if (this.viewTitleEl) this.viewTitleEl.textContent = title;
    if (this.titlebarSubtitle) this.titlebarSubtitle.textContent = title;
    if (this.filterCounterEl) this.filterCounterEl.textContent = `${filtered.length} task${filtered.length === 1 ? '' : 's'}`;

    this.taskListEl.innerHTML = '';

    if (filtered.length === 0) {
      this.emptyStateEl.classList.remove('hidden');
    } else {
      this.emptyStateEl.classList.add('hidden');
    }

    filtered.forEach((task) => {
      const cat = this.categories.find(c => c.id === task.categoryId);
      const isSelected = this.selectedTaskId === task.id;

      const card = document.createElement('div');
      card.className = `task-card ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="task-checkbox-custom" data-id="${task.id}">
          <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="task-body">
          <span class="task-title">${this.escapeHTML(task.title)}</span>
          <div class="task-meta">
            ${cat ? `<span class="meta-tag" style="background: ${cat.color}20; color: ${cat.color};"><span class="cat-dot" style="background: ${cat.color};"></span> ${this.escapeHTML(cat.name)}</span>` : ''}
            <span class="priority-pill ${task.priority}">${task.priority}</span>
            ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
            ${task.subtasks && task.subtasks.length > 0 ? `<span>☑️ ${task.subtasks.filter(s => s.done).length}/${task.subtasks.length}</span>` : ''}
          </div>
        </div>
        <button class="task-star-btn ${task.starred ? 'starred' : ''}" title="Star Task">
          <svg viewBox="0 0 24 24" fill="${task.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
      `;

      card.addEventListener('click', () => this.selectTask(task.id));
      card.querySelector('.task-checkbox-custom').addEventListener('click', (e) => this.toggleTaskCompleted(task.id, e));
      card.querySelector('.task-star-btn').addEventListener('click', (e) => this.toggleTaskStarred(task.id, e));

      this.taskListEl.appendChild(card);
    });
  }

  renderDetailPane() {
    if (!this.selectedTaskId) return;
    const task = this.tasks.find(t => t.id === this.selectedTaskId);
    if (!task) return;

    this.detailPane.classList.remove('collapsed');
    this.detailTitle.value = task.title;
    this.detailPriority.value = task.priority;
    this.detailCategory.value = task.categoryId || '';
    this.detailDueDate.value = task.dueDate || '';
    this.detailNotes.value = task.notes || '';
    this.detailCreatedAt.textContent = `Created ${new Date(task.createdAt).toLocaleDateString()}`;

    // Subtasks
    this.detailSubtaskList.innerHTML = '';
    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter(s => s.done).length;
    this.subtaskProgress.textContent = `${completedCount}/${subtasks.length}`;

    subtasks.forEach((sub) => {
      const item = document.createElement('div');
      item.className = `subtask-item ${sub.done ? 'done' : ''}`;
      item.innerHTML = `
        <input type="checkbox" ${sub.done ? 'checked' : ''} />
        <span>${this.escapeHTML(sub.title)}</span>
        <button title="Delete subtask">✕</button>
      `;
      item.querySelector('input').addEventListener('change', () => this.toggleSubtask(sub.id));
      item.querySelector('button').addEventListener('click', () => this.deleteSubtask(sub.id));
      this.detailSubtaskList.appendChild(item);
    });
  }

  updateCounts() {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalAll = this.tasks.length;
    const completedAll = this.tasks.filter(t => t.completed).length;
    const leftAll = totalAll - completedAll;

    const countAll = this.tasks.filter(t => !t.completed).length;
    const countToday = this.tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
    const countStarred = this.tasks.filter(t => t.starred && !t.completed).length;
    const countCompleted = completedAll;

    document.getElementById('count-all').textContent = countAll;
    document.getElementById('count-today').textContent = countToday;
    document.getElementById('count-starred').textContent = countStarred;
    document.getElementById('count-completed').textContent = countCompleted;

    // Progress Bar
    const percent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
    document.getElementById('progress-bar-fill').style.width = `${percent}%`;
    document.getElementById('completion-rate').textContent = `${percent}% completed`;
    document.getElementById('pending-count').textContent = `${leftAll} left`;
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});
