// Nodus Desktop - High Craft Minimalist Task Management
// Precision keyboard navigation, zero artificial bloat, local state persistence

const DEFAULT_CATEGORIES = [
  { id: 'cat-core', name: 'Architecture', color: '#71717a' },
  { id: 'cat-frontend', name: 'Interface', color: '#3b82f6' },
  { id: 'cat-ops', name: 'Systems', color: '#10b981' }
];

const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Precision Swiss architecture & design system',
    completed: false,
    starred: true,
    priority: 'high',
    categoryId: 'cat-frontend',
    dueDate: new Date().toISOString().split('T')[0],
    notes: 'Crafted with zero gradients or cartoon glow. Strict 14:1 contrast, Inter & JetBrains Mono typographic hierarchy, and vim-like keyboard navigation.',
    subtasks: [
      { id: 'sub-1', title: 'Press J / K to navigate up and down the task stream', done: true },
      { id: 'sub-2', title: 'Press Space to toggle completion without a mouse', done: false },
      { id: 'sub-3', title: 'Press N or / to quickly add or search tasks', done: false }
    ],
    createdAt: Date.now() - 3600000
  },
  {
    id: 'task-2',
    title: 'Benchmark SQLite local indexing & cold start performance',
    completed: false,
    starred: false,
    priority: 'medium',
    categoryId: 'cat-core',
    dueDate: '',
    notes: 'Ensure instant cold start under 120ms with local schema validation.',
    subtasks: [],
    createdAt: Date.now() - 7200000
  },
  {
    id: 'task-3',
    title: 'Refactor IPC security boundaries in electron preload bridge',
    completed: true,
    starred: false,
    priority: 'low',
    categoryId: 'cat-ops',
    dueDate: new Date().toISOString().split('T')[0],
    notes: 'Audit contextIsolation and nodeIntegration policies.',
    subtasks: [],
    createdAt: Date.now() - 86400000
  }
];

class NodusApp {
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
    this.selectedIndex = 0;

    this.initWindowControls();
    this.initDOMElements();
    this.bindEvents();
    this.bindKeyboardShortcuts();
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

  /* ================= Window Chrome Controls ================= */
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
      btnMin?.addEventListener('click', () => console.log('Minimize'));
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

  /* ================= Cache DOM ================= */
  initDOMElements() {
    this.taskListEl = document.getElementById('tasks-list');
    this.emptyStateEl = document.getElementById('empty-state');
    this.categoryListEl = document.getElementById('category-list');
    this.quickInput = document.getElementById('quick-input');
    this.quickDueDate = document.getElementById('quick-due-date');
    this.quickCatSelect = document.getElementById('quick-category-select');
    this.quickPriorityBtn = document.getElementById('toggle-quick-priority');
    this.quickPriorityLabel = document.getElementById('quick-priority-label');
    this.searchInput = document.getElementById('search-input');
    this.priorityFilterEl = document.getElementById('priority-filter');
    this.sortFilterEl = document.getElementById('sort-filter');
    this.viewTitleEl = document.getElementById('current-view-title');
    this.filterCounterEl = document.getElementById('task-filter-counter');
    this.titlebarBreadcrumb = document.getElementById('titlebar-current-view');

    // Inspector Pane
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

    // Modal
    this.catModal = document.getElementById('category-modal');
    this.newCatName = document.getElementById('new-cat-name');
    this.selectedCatColor = '#71717a';
  }

  /* ================= Keyboard Shortcuts (Vim / Desktop First) ================= */
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

      // Esc closes inspector or modal
      if (e.key === 'Escape') {
        if (!this.catModal?.classList.contains('hidden')) {
          this.catModal?.classList.add('hidden');
          return;
        }
        if (!this.detailPane?.classList.contains('collapsed')) {
          this.closeDetailPane();
          return;
        }
        if (isInputFocused) {
          activeEl.blur();
          return;
        }
      }

      // If typing in input, let default typing happen except for specific shortcuts
      if (isInputFocused) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.searchInput?.focus();
        }
        return;
      }

      // Fast Focus Search
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        this.searchInput?.focus();
        this.searchInput?.select();
        return;
      }

      // Quick Add Trigger
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.quickInput?.focus();
        return;
      }

      const tasks = this.getFilteredTasks();
      if (tasks.length === 0) return;

      // J / Down Arrow: Move down
      if (e.key.toLowerCase() === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, tasks.length - 1);
        this.selectTask(tasks[this.selectedIndex].id, false);
      }

      // K / Up Arrow: Move up
      if (e.key.toLowerCase() === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.selectTask(tasks[this.selectedIndex].id, false);
      }

      // Space: Toggle active task completion
      if (e.code === 'Space') {
        e.preventDefault();
        const activeTask = tasks[this.selectedIndex];
        if (activeTask) this.toggleTaskCompleted(activeTask.id);
      }

      // S: Toggle Star
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        const activeTask = tasks[this.selectedIndex];
        if (activeTask) this.toggleTaskStarred(activeTask.id);
      }

      // E or Enter: Open inspector for selected task
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter') {
        e.preventDefault();
        const activeTask = tasks[this.selectedIndex];
        if (activeTask) {
          this.selectTask(activeTask.id, true);
          this.detailTitle?.focus();
        }
      }

      // Delete or Backspace (when not in input): Delete active task
      if (e.key === 'Delete' || (e.key === 'Backspace' && !isInputFocused)) {
        e.preventDefault();
        const activeTask = tasks[this.selectedIndex];
        if (activeTask) {
          this.tasks = this.tasks.filter(t => t.id !== activeTask.id);
          this.save();
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.render();
        }
      }
    });
  }

  /* ================= Standard Event Listeners ================= */
  bindEvents() {
    // Quick Add
    document.getElementById('btn-quick-add')?.addEventListener('click', () => this.addQuickTask());
    this.quickInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addQuickTask();
    });

    // Priority Cycle
    this.quickPriorityBtn?.addEventListener('click', () => {
      const order = ['normal', 'medium', 'high'];
      const next = order[(order.indexOf(this.quickPriority) + 1) % order.length];
      this.quickPriority = next;
      this.updateQuickPriorityUI();
    });

    // Sidebar navigation
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.currentCategoryFilter = null;
        this.selectedIndex = 0;
        this.render();
      });
    });

    // Search filter
    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.selectedIndex = 0;
      this.renderTasks();
    });

    // Priority & Sort selection
    this.priorityFilterEl?.addEventListener('change', (e) => {
      this.priorityFilter = e.target.value;
      this.selectedIndex = 0;
      this.renderTasks();
    });

    this.sortFilterEl?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.selectedIndex = 0;
      this.renderTasks();
    });

    // Clear completed
    document.getElementById('btn-clear-completed')?.addEventListener('click', () => {
      this.tasks = this.tasks.filter((t) => !t.completed);
      this.save();
      this.selectedIndex = 0;
      this.render();
    });

    // Inspector Events
    document.getElementById('btn-close-detail')?.addEventListener('click', () => this.closeDetailPane());

    this.detailTitle?.addEventListener('input', (e) => this.updateActiveTask({ title: e.target.value }));
    this.detailPriority?.addEventListener('change', (e) => this.updateActiveTask({ priority: e.target.value }));
    this.detailCategory?.addEventListener('change', (e) => this.updateActiveTask({ categoryId: e.target.value }));
    this.detailDueDate?.addEventListener('change', (e) => this.updateActiveTask({ dueDate: e.target.value }));
    this.detailNotes?.addEventListener('input', (e) => this.updateActiveTask({ notes: e.target.value }));

    // Delete task button in inspector
    document.getElementById('btn-delete-task')?.addEventListener('click', () => {
      if (this.selectedTaskId) {
        this.tasks = this.tasks.filter((t) => t.id !== this.selectedTaskId);
        this.selectedTaskId = null;
        this.save();
        this.closeDetailPane();
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.render();
      }
    });

    // Subtasks
    document.getElementById('btn-add-subtask')?.addEventListener('click', () => this.addSubtask());
    this.newSubtaskInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addSubtask();
    });

    // Category Modal
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

    document.querySelectorAll('.swatch-btn').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.swatch-btn').forEach((s) => s.classList.remove('active'));
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
  }

  updateQuickPriorityUI() {
    const label = this.quickPriority.charAt(0).toUpperCase() + this.quickPriority.slice(1);
    this.quickPriorityLabel.textContent = label;
    const dot = this.quickPriorityBtn.querySelector('.priority-dot');
    dot.className = `priority-dot ${this.quickPriority}`;
  }

  /* ================= Task Operations ================= */
  addQuickTask() {
    let title = this.quickInput.value.trim();
    if (!title) return;

    let priority = this.quickPriority === 'normal' ? 'low' : this.quickPriority;
    let categoryId = this.quickCatSelect.value || (this.categories[0] ? this.categories[0].id : '');
    let dueDate = this.quickDueDate.value;

    // Smart inline syntax
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
    this.selectedIndex = 0;
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

  selectTask(id, openInspector = true) {
    this.selectedTaskId = id;
    const tasks = this.getFilteredTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) this.selectedIndex = idx;

    this.renderTasks();
    if (openInspector) {
      this.renderDetailPane();
    }
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

  /* ================= Rendering Engine ================= */
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
      btn.className = `category-btn ${this.currentCategoryFilter === cat.id ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="project-dot" style="background: ${cat.color};"></span>
        <span class="nav-label">${this.escapeHTML(cat.name)}</span>
        <span class="nav-count">${count}</span>
      `;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategoryFilter = cat.id;
        this.currentFilter = null;
        this.selectedIndex = 0;
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
      if (this.currentCategoryFilter) {
        if (task.categoryId !== this.currentCategoryFilter) return false;
      } else if (this.currentFilter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (this.currentFilter === 'starred') {
        if (!task.starred) return false;
      } else if (this.currentFilter === 'completed') {
        if (!task.completed) return false;
      }

      if (this.priorityFilter !== 'all' && task.priority !== this.priorityFilter) {
        return false;
      }

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

    let title = 'Inbox';
    if (this.currentCategoryFilter) {
      const cat = this.categories.find(c => c.id === this.currentCategoryFilter);
      title = cat ? cat.name : 'Project';
    } else if (this.currentFilter === 'today') {
      title = 'Today';
    } else if (this.currentFilter === 'starred') {
      title = 'Priority Focus';
    } else if (this.currentFilter === 'completed') {
      title = 'Completed';
    }

    if (this.viewTitleEl) this.viewTitleEl.textContent = title;
    if (this.titlebarBreadcrumb) this.titlebarBreadcrumb.textContent = title;
    if (this.filterCounterEl) this.filterCounterEl.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

    this.taskListEl.innerHTML = '';

    if (filtered.length === 0) {
      this.emptyStateEl.classList.remove('hidden');
      return;
    } else {
      this.emptyStateEl.classList.add('hidden');
    }

    filtered.forEach((task, index) => {
      const cat = this.categories.find(c => c.id === task.categoryId);
      const isSelected = (this.selectedTaskId === task.id) || (!this.selectedTaskId && index === this.selectedIndex);

      const row = document.createElement('div');
      row.className = `task-row ${task.completed ? 'completed' : ''} ${isSelected ? 'active-selection' : ''}`;
      row.innerHTML = `
        <div class="check-trigger" data-id="${task.id}" title="Toggle (Space)">
          <svg viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-5" stroke-linecap="round"/></svg>
        </div>
        <div class="task-title-cell">${this.escapeHTML(task.title)}</div>
        <div class="task-meta-cell">
          ${cat ? `<span class="project-tag"><span class="project-dot" style="background: ${cat.color};"></span>${this.escapeHTML(cat.name)}</span>` : ''}
          ${task.priority === 'high' ? '<span class="priority-flag high">URGENT</span>' : ''}
          ${task.priority === 'medium' ? '<span class="priority-flag medium">MED</span>' : ''}
          ${task.dueDate ? `<span class="date-readout">${task.dueDate.slice(5)}</span>` : ''}
          ${task.subtasks && task.subtasks.length > 0 ? `<span class="subtask-readout">${task.subtasks.filter(s => s.done).length}/${task.subtasks.length}</span>` : ''}
        </div>
        <button class="star-action-btn ${task.starred ? 'starred' : ''}" title="Star (S)">
          <svg viewBox="0 0 16 16" fill="${task.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.3">
            <polygon points="8 1.5 10 5.5 14.5 6 11 9.5 12 14 8 11.5 4 14 5 9.5 1.5 6 6 5.5 8 1.5"></polygon>
          </svg>
        </button>
      `;

      row.addEventListener('click', () => {
        this.selectTask(task.id, true);
      });

      row.querySelector('.check-trigger').addEventListener('click', (e) => this.toggleTaskCompleted(task.id, e));
      row.querySelector('.star-action-btn').addEventListener('click', (e) => this.toggleTaskStarred(task.id, e));

      this.taskListEl.appendChild(row);
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
      const node = document.createElement('div');
      node.className = `subtask-node ${sub.done ? 'done' : ''}`;
      node.innerHTML = `
        <input type="checkbox" ${sub.done ? 'checked' : ''} />
        <span>${this.escapeHTML(sub.title)}</span>
        <button title="Remove">✕</button>
      `;
      node.querySelector('input').addEventListener('change', () => this.toggleSubtask(sub.id));
      node.querySelector('button').addEventListener('click', () => this.deleteSubtask(sub.id));
      this.detailSubtaskList.appendChild(node);
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

    const percent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
    document.getElementById('progress-bar-fill').style.width = `${percent}%`;
    document.getElementById('completion-rate').textContent = `${percent}% Done`;
    document.getElementById('pending-count').textContent = `${leftAll} Remaining`;
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new NodusApp();
});
