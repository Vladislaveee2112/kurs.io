const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('tasks');
const filterStatusSelect = document.getElementById('filter-status');
const filterCategorySelect = document.getElementById('filter-category');
const filterPrioritySelect = document.getElementById('filter-priority'); 
const filterDateSelect = document.getElementById('filter-date');


function getTasksFromLocalStorage() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  return tasks;
}


function saveTasksToLocalStorage(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}


let tasks = getTasksFromLocalStorage();
renderTasks();


function addTask(event) {
  event.preventDefault();

  const taskName = document.getElementById('task-name').value;
  const taskDescription = document.getElementById('task-description').value;
  const taskDeadline = document.getElementById('task-deadline').value;
  const taskPriority = document.getElementById('task-priority').value;
  const taskCategory = document.getElementById('task-category').value; 
  const taskFile = document.getElementById('task-file').files[0]; 

  const newTask = {
    id: Date.now(), 
    name: taskName,
    description: taskDescription,
    deadline: taskDeadline,
    priority: taskPriority,
    completed: false,
    category: taskCategory, 
    file: taskFile ? taskFile.name : null, 
  };

  tasks.push(newTask);
  saveTasksToLocalStorage(tasks);
  renderTasks();


  taskForm.reset();
  initCalendar();
}


function renderTasks() {
  taskList.innerHTML = ''; 
  tasks = getTasksFromLocalStorage(); 


  const filteredTasks = tasks
    .filter(task => filterTasksByStatus(filterStatusSelect.value, task)) 
    .filter(task => filterTasksByCategory(filterCategorySelect.value, task)) 
    .filter(task => filterTasksByPriority(filterPrioritySelect.value, task)) 
    .filter(task => filterTasksByDate(filterDateSelect.value, task)); 

  filteredTasks.forEach(task => {
    const newTaskElement = document.createElement('li');
    newTaskElement.setAttribute('data-task-id', task.id); 


    let priorityClass = '';
    if (task.priority === 'высокий') {
      priorityClass = 'high-priority';
    } else if (task.priority === 'средний') {
      priorityClass = 'medium-priority';
    }


    newTaskElement.innerHTML = `
      <div>
        <h3 class="${priorityClass}">${task.name}</h3>
        <p>${task.description}</p>
        <p>Срок сдачи: ${task.deadline}</p>
        ${task.file ? `<p>Файл: <a href="${task.file}" download>${task.file}</a></p>` : ''}  
      </div>
      <div class="task-timer">
        <span class="timer-value"></span>
        <span class="timer-label">до</span>
      </div>
      <div>
        <button class="complete ${task.completed ? 'completed' : ''}">Завершить</button>
        <button class="delete">Удалить</button>
      </div>
    `;


    const categorySpan = document.createElement('span');
    categorySpan.classList.add('task-category');
    categorySpan.textContent = `(${task.category})`; 
    newTaskElement.querySelector('div').appendChild(categorySpan);


    newTaskElement.querySelector('.complete').addEventListener('click', () => {
      toggleTaskCompletion(task.id);
      renderTasks();
    });

    
    newTaskElement.querySelector('.delete').addEventListener('click', () => {
      deleteTask(task.id);
      renderTasks();
    });

    
    taskList.appendChild(newTaskElement);

    
    startTimer(newTaskElement, task.deadline);
  });

  
  updateCategoryFilterOptions();
}


function toggleTaskCompletion(taskId) {
  tasks.forEach(task => {
    if (task.id === taskId) {
      task.completed = !task.completed;
    }
  });
  saveTasksToLocalStorage(tasks);
}


function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasksToLocalStorage(tasks);
}


function filterTasksByStatus(status, task) {
  if (status === 'all') {
    return true;
  } else if (status === 'completed' && task.completed) {
    return true;
  } else if (status === 'pending' && !task.completed) {
    return true;
  }
  return false;
}


function filterTasksByCategory(category, task) {
  if (category === 'all') {
    return true;
  } else if (task.category === category) {
    return true;
  }
  return false;
}


function filterTasksByPriority(priority, task) {
  if (priority === 'all') {
    return true;
  } else if (task.priority === priority) {
    return true;
  }
  return false;
}


function filterTasksByDate(dateFilter, task) {
  if (dateFilter === 'all') {
    return true;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() - today.getDay() + 7);

  const taskDeadline = new Date(task.deadline);

  if (dateFilter === 'today' && taskDeadline.getDate() === today.getDate()) {
    return true;
  } else if (dateFilter === 'tomorrow' && taskDeadline.getDate() === tomorrow.getDate()) {
    return true;
  } else if (dateFilter === 'this-week' && taskDeadline >= thisWeekStart && taskDeadline < nextWeekStart) {
    return true;
  } else if (dateFilter === 'next-week' && taskDeadline >= nextWeekStart) {
    return true;
  }

  return false;
}


function updateCategoryFilterOptions() {
  const uniqueCategories = new Set(tasks.map(task => task.category));
  filterCategorySelect.innerHTML = '<option value="all" selected>Все</option>';
  uniqueCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.text = category;
    filterCategorySelect.appendChild(option);
  });
}


function startTimer(taskElement, deadline) {
  const timerElement = taskElement.querySelector('.timer-value');
  const deadlineDate = new Date(deadline);
  const taskId = taskElement.getAttribute('data-task-id'); 


  if (tasks.find(task => task.id === parseInt(taskId) && task.completed)) {
    timerElement.textContent = 'Задание выполнено!';
    return; 
  }

  let timerInterval = setInterval(() => {

    if (tasks.find(task => task.id === parseInt(taskId) && task.completed)) {
      clearInterval(timerInterval);
      timerElement.textContent = 'Задание выполнено!';
      return;
    }

    const now = new Date();
    const timeLeft = deadlineDate - now;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      timerElement.textContent = 'Просрочено!';
      return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    timerElement.textContent = `${days}д ${hours}ч ${minutes}м ${seconds}с`;
  }, 1000);
}


function initCalendar() {
  const calendarEl = document.getElementById('calendar');


  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: function(fetchInfo, successCallback, failureCallback) {
      const events = tasks.map(task => ({
        title: task.name,
        start: task.deadline,
        id: task.id, 
        category: task.category 
      }));
      successCallback(events);
    },
    eventClick: function(info) {

      console.log('Event Clicked:', info.event);
    },
    eventDidMount: function(info) {
      const eventEl = info.el;
      const category = info.event.extendedProps.category;
      if (category) {
        eventEl.classList.add(`category-${category.replace(/\s+/g, '-').toLowerCase()}`); 
      }
    }
  });

  calendar.render();
}


initCalendar();


taskForm.addEventListener('submit', addTask);
filterStatusSelect.addEventListener('change', renderTasks);
filterCategorySelect.addEventListener('change', renderTasks);
filterPrioritySelect.addEventListener('change', renderTasks); 
filterDateSelect.addEventListener('change', renderTasks);