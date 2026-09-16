let tasks = JSON.parse(localStorage.getItem("schoolTasks")) || [];

let editingIndex = -1;

function addTask() {
    const taskInput = document.getElementById("task");
    const subjectInput = document.getElementById("subject");
    const dueDateInput = document.getElementById("dueDate");
    const priorityInput = document.getElementById("priority");

    const task = taskInput.value.trim();
    const subject = subjectInput.value;
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    if (task === "") {
        alert("Please enter a topic.");
        return;
    }

    if (dueDate === "") {
        alert("Please select a due date.");
        return;
    }

    if (editingIndex !== -1) {

        tasks[editingIndex].task = task;
        tasks[editingIndex].subject = subject;
        tasks[editingIndex].dueDate = dueDate;
        tasks[editingIndex].priority = priority;

        editingIndex = -1;

        document.getElementById("addTaskButton").textContent = "Add Task";

    } else {

        const newTask = {
            task: task,
            subject: subject,
            dueDate: dueDate,
            priority: priority,
            completed: false
        };

        tasks.push(newTask);
    }

    saveTasks();
    displayTasks();

    taskInput.value = "";
    dueDateInput.value = "";
    priorityInput.value = "Medium";
}

function displayTasks() {
    const taskList = document.getElementById("taskList");
    const dateFilter = document.getElementById("dateFilter");
    const specificDateInput = document.getElementById("specificDate");

    const selectedFilter = dateFilter.value;
    const specificDate = specificDateInput.value;

    taskList.innerHTML = "";

    const today = getTodayString();
    const next7Days = getDateAfterDays(7);

    const filteredTasks = tasks
        .filter(function(task) {

            if (selectedFilter === "All") {
                return true;
            }

            if (selectedFilter === "Today") {
                return task.dueDate === today;
            }

            if (selectedFilter === "Next7") {
                return task.dueDate >= today && task.dueDate <= next7Days;
            }

            if (selectedFilter === "Overdue") {
                return task.dueDate < today && !task.completed;
            }

            if (selectedFilter === "Specific") {
                return task.dueDate === specificDate;
            }

            return true;
        })
        .sort(function(a, b) {
            return a.dueDate.localeCompare(b.dueDate);
        });

    filteredTasks.forEach(function(task) {

        const originalIndex = tasks.indexOf(task);

        const li = document.createElement("li");

        if (task.completed) {
            li.classList.add("completed");
        }

        const taskContent = document.createElement("div");
        taskContent.classList.add("task-content");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("task-checkbox");
        checkbox.checked = task.completed;

        const taskDetails = document.createElement("div");
        taskDetails.classList.add("task-details");

        const subjectText = document.createElement("div");
        subjectText.classList.add("task-subject");
        subjectText.textContent = task.subject;

        const topicText = document.createElement("div");
        topicText.classList.add("task-topic");
        topicText.textContent = task.task;

        const dueText = document.createElement("div");
        dueText.classList.add("task-due");
        dueText.textContent = "Due: " + formatDate(task.dueDate);

        taskDetails.appendChild(subjectText);
        taskDetails.appendChild(topicText);
        taskDetails.appendChild(dueText);

        taskContent.appendChild(checkbox);
        taskContent.appendChild(taskDetails);

        const taskBottom = document.createElement("div");
        taskBottom.classList.add("task-bottom");

        const priorityText = document.createElement("span");
        priorityText.classList.add("priority-badge");

        if (task.priority === "High") {
            priorityText.textContent = "High";
            priorityText.classList.add("priority-high");
        } else if (task.priority === "Medium") {
            priorityText.textContent = "Medium";
            priorityText.classList.add("priority-medium");
        } else {
            priorityText.textContent = "Low";
            priorityText.classList.add("priority-low");
        }

        const taskActions = document.createElement("div");
        taskActions.classList.add("task-actions");

        const editButton = document.createElement("button");
        editButton.textContent = "✏️";
        editButton.classList.add("edit-btn");

        editButton.addEventListener("click", function() {
            editTask(originalIndex);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.classList.add("delete-btn");

        deleteButton.addEventListener("click", function() {
            tasks.splice(originalIndex, 1);

            saveTasks();
            displayTasks();
        });

        checkbox.addEventListener("change", function() {
            task.completed = checkbox.checked;

            saveTasks();
            displayTasks();
        });

        taskActions.appendChild(editButton);
        taskActions.appendChild(deleteButton);

        taskBottom.appendChild(priorityText);
        taskBottom.appendChild(taskActions);

        li.appendChild(taskContent);
        li.appendChild(taskBottom);

        taskList.appendChild(li);
    });

    updateTaskCounter(filteredTasks.length);
    updateProgress();
}

function editTask(index) {
    const task = tasks[index];

    document.getElementById("subject").value = task.subject;
    document.getElementById("task").value = task.task;
    document.getElementById("dueDate").value = task.dueDate;
    document.getElementById("priority").value = task.priority;

    editingIndex = index;

    document.getElementById("addTaskButton").textContent = "Save Changes";

    document.getElementById("task").focus();
}

function handleDateFilter() {
    const dateFilter = document.getElementById("dateFilter");
    const specificDateInput = document.getElementById("specificDate");

    if (dateFilter.value === "Specific") {
        specificDateInput.style.display = "block";
    } else {
        specificDateInput.style.display = "none";
        specificDateInput.value = "";
    }

    displayTasks();
}

function getTodayString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function getDateAfterDays(days) {
    const date = new Date();

    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function updateTaskCounter(count) {
    const taskCounter = document.getElementById("taskCounter");

    if (count === 1) {
        taskCounter.textContent = "1 Task";
    } else {
        taskCounter.textContent = count + " Tasks";
    }
}

function updateProgress() {
    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(function(task) {
        return task.completed;
    }).length;

    const pendingTasks = totalTasks - completedTasks;

    let progress = 0;

    if (totalTasks > 0) {
        progress = Math.round((completedTasks / totalTasks) * 100);
    }

    document.getElementById("totalTasks").textContent = totalTasks;
    document.getElementById("completedTasks").textContent = completedTasks;
    document.getElementById("pendingTasks").textContent = pendingTasks;

    document.getElementById("progressFill").style.width = progress + "%";

    document.getElementById("progressText").textContent =
        progress + "% Complete";
}

function saveTasks() {
    localStorage.setItem("schoolTasks", JSON.stringify(tasks));
}

displayTasks();