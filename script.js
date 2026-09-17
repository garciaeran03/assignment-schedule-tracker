/* =========================================================
   ASSIGNMENT TRACKER
   ========================================================= */

let tasks = JSON.parse(localStorage.getItem("schoolTasks")) || [];

let editingIndex = -1;


/* ============================= */
/* ADD / EDIT TASK */
/* ============================= */

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


/* ============================= */
/* DISPLAY TASKS */
/* ============================= */

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


/* ============================= */
/* EDIT TASK */
/* ============================= */

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


/* ============================= */
/* DATE FILTER */
/* ============================= */

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


/* ============================= */
/* DATE FUNCTIONS */
/* ============================= */

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


/* ============================= */
/* TASK COUNTER */
/* ============================= */

function updateTaskCounter(count) {

    const taskCounter = document.getElementById("taskCounter");

    if (count === 1) {

        taskCounter.textContent = "1 Task";

    } else {

        taskCounter.textContent = count + " Tasks";
    }
}


/* ============================= */
/* PROGRESS */
/* ============================= */

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


/* ============================= */
/* SAVE TASKS */
/* ============================= */

function saveTasks() {

    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );
}



/* =========================================================
   MAIN TABS
   ========================================================= */

function showMainTab(tab) {

    const assignmentsTab =
        document.getElementById("assignmentsTab");

    const scheduleTab =
        document.getElementById("scheduleTab");

    const mainTabs =
        document.querySelectorAll(".main-tab");


    if (tab === "assignments") {

        assignmentsTab.style.display = "block";
        scheduleTab.style.display = "none";

    } else {

        assignmentsTab.style.display = "none";
        scheduleTab.style.display = "block";

        renderCalendar();
        renderWeeklySchedule();
        displaySavedSchedules();
    }


    mainTabs.forEach(function(button) {

        button.classList.remove("active");

    });


    if (tab === "assignments") {

        mainTabs[0].classList.add("active");

    } else {

        mainTabs[1].classList.add("active");
    }
}



/* =========================================================
   CLASS SCHEDULE
   ========================================================= */

let schedules =
    JSON.parse(localStorage.getItem("classSchedules")) || [];

let editingScheduleIndex = -1;

let calendarDate = new Date();

let weeklyDate = new Date();

let selectedCalendarDate = null;


/* ============================= */
/* ADD SCHEDULE */
/* ============================= */

function addSchedule() {

    const subject =
        document.getElementById("scheduleSubject").value;

    const day =
        document.getElementById("scheduleDay").value;

    const startTime =
        document.getElementById("startTime").value;

    const endTime =
        document.getElementById("endTime").value;


    if (convertTimeToMinutes(endTime) <=
        convertTimeToMinutes(startTime)) {

        alert("End time must be later than start time.");
        return;
    }


    const scheduleData = {

        subject: subject,
        day: day,
        startTime: startTime,
        endTime: endTime

    };


    if (editingScheduleIndex !== -1) {

        schedules[editingScheduleIndex] = scheduleData;

        editingScheduleIndex = -1;

        document.getElementById("addScheduleButton")
            .textContent = "Add Schedule";

    } else {

        schedules.push(scheduleData);
    }


    saveSchedules();

    renderCalendar();
    renderWeeklySchedule();
    displaySavedSchedules();


    document.getElementById("scheduleSubject").selectedIndex = 0;
    document.getElementById("scheduleDay").selectedIndex = 0;
    document.getElementById("startTime").selectedIndex = 0;
    document.getElementById("endTime").selectedIndex = 0;
}


/* ============================= */
/* SAVE SCHEDULES */
/* ============================= */

function saveSchedules() {

    localStorage.setItem(
        "classSchedules",
        JSON.stringify(schedules)
    );
}


/* ============================= */
/* EDIT SCHEDULE */
/* ============================= */

function editSchedule(index) {

    const schedule = schedules[index];

    document.getElementById("scheduleSubject").value =
        schedule.subject;

    document.getElementById("scheduleDay").value =
        schedule.day;

    document.getElementById("startTime").value =
        schedule.startTime;

    document.getElementById("endTime").value =
        schedule.endTime;


    editingScheduleIndex = index;

    document.getElementById("addScheduleButton")
        .textContent = "Save Changes";


    document.getElementById("scheduleSubject")
        .focus();
}


/* ============================= */
/* DELETE SCHEDULE */
/* ============================= */

function deleteSchedule(index) {

    schedules.splice(index, 1);

    saveSchedules();

    renderCalendar();
    renderWeeklySchedule();
    displaySavedSchedules();

    showScheduleDetails(null);
}



/* =========================================================
   SCHEDULE VIEW TABS
   ========================================================= */

function showScheduleView(view) {

    const calendarView =
        document.getElementById("calendarView");

    const weeklyView =
        document.getElementById("weeklyView");

    const scheduleTabs =
        document.querySelectorAll(".schedule-tab");


    if (view === "calendar") {

        calendarView.style.display = "block";
        weeklyView.style.display = "none";

        renderCalendar();

        scheduleTabs[0].classList.add("active");
        scheduleTabs[1].classList.remove("active");

    } else {

        calendarView.style.display = "none";
        weeklyView.style.display = "block";

        renderWeeklySchedule();

        scheduleTabs[0].classList.remove("active");
        scheduleTabs[1].classList.add("active");
    }
}



/* =========================================================
   CALENDAR VIEW
   ========================================================= */

function renderCalendar() {

    const calendarGrid =
        document.getElementById("calendarGrid");

    const calendarMonth =
        document.getElementById("calendarMonth");


    if (!calendarGrid || !calendarMonth) {
        return;
    }


    calendarGrid.innerHTML = "";


    const year = calendarDate.getFullYear();

    const month = calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });


    calendarMonth.textContent = monthName;


    const firstDay =
        new Date(year, month, 1).getDay();


    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    const todayString = getTodayString();


    /* EMPTY DAYS BEFORE MONTH */

    for (let i = 0; i < firstDay; i++) {

        const emptyDay =
            document.createElement("div");

        emptyDay.classList.add(
            "calendar-day",
            "empty"
        );

        calendarGrid.appendChild(emptyDay);
    }


    /* DAYS */

    for (let day = 1; day <= daysInMonth; day++) {

        const dayCell =
            document.createElement("div");

        dayCell.classList.add("calendar-day");


        const dateString =
            year + "-" +
            String(month + 1).padStart(2, "0") + "-" +
            String(day).padStart(2, "0");


        if (dateString === todayString) {

            dayCell.classList.add("today");
        }


        if (dateString === selectedCalendarDate) {

            dayCell.classList.add("selected");
        }


        const dateText =
            document.createElement("div");

        dateText.classList.add("calendar-date");

        dateText.textContent = day;


        dayCell.appendChild(dateText);


        const dayOfWeek =
            new Date(year, month, day).getDay();


        const dayName =
            getDayName(dayOfWeek);


        const daySchedules =
            schedules.filter(function(schedule) {

                return schedule.day === dayName;

            }).sort(function(a, b) {

                return convertTimeToMinutes(a.startTime) -
                       convertTimeToMinutes(b.startTime);

            });


        daySchedules.forEach(function(schedule) {

            const event =
                document.createElement("div");

            event.classList.add("calendar-event");


            const eventTime =
                document.createElement("div");

            eventTime.classList.add(
                "calendar-event-time"
            );

            eventTime.textContent =
                schedule.startTime;


            const eventSubject =
                document.createElement("div");

            eventSubject.classList.add(
                "calendar-event-subject"
            );

            eventSubject.textContent =
                getShortSubject(schedule.subject);


            event.appendChild(eventTime);
            event.appendChild(eventSubject);


            event.addEventListener("click", function(e) {

                e.stopPropagation();

                selectedCalendarDate = dateString;

                showScheduleDetails(schedule, dateString);

                renderCalendar();
            });


            dayCell.appendChild(event);

        });


        dayCell.addEventListener("click", function() {

            selectedCalendarDate = dateString;

            if (daySchedules.length > 0) {

                showScheduleDetails(
                    daySchedules[0],
                    dateString
                );

            } else {

                showScheduleDetails(null);
            }

            renderCalendar();

        });


        calendarGrid.appendChild(dayCell);
    }
}


/* ============================= */
/* CHANGE MONTH */
/* ============================= */

function changeMonth(amount) {

    calendarDate.setMonth(
        calendarDate.getMonth() + amount
    );

    selectedCalendarDate = null;

    renderCalendar();

    showScheduleDetails(null);
}



/* =========================================================
   SCHEDULE DETAILS
   ========================================================= */

function showScheduleDetails(schedule, dateString) {

    const details =
        document.getElementById("scheduleDetails");


    if (!schedule) {

        details.innerHTML = `
            <h3>Schedule Details</h3>
            <p class="empty-details">
                Select a class from the calendar.
            </p>
        `;

        return;
    }


    let dateText = schedule.day;


    if (dateString) {

        const date =
            new Date(dateString + "T00:00:00");

        dateText =
            date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });
    }


    details.innerHTML = `

        <h3>Schedule Details</h3>

        <div class="schedule-detail-subject">
            ${schedule.subject}
        </div>

        <p class="schedule-detail-item">
            📅 <strong>Day:</strong> ${dateText}
        </p>

        <p class="schedule-detail-item">
            🕐 <strong>Time:</strong>
            ${schedule.startTime} - ${schedule.endTime}
        </p>

        <p class="schedule-detail-item">
            💻 <strong>Online Class</strong>
        </p>

    `;
}



/* =========================================================
   WEEKLY VIEW
   ========================================================= */

function renderWeeklySchedule() {

    const weeklyGrid =
        document.getElementById("weeklyGrid");

    const weeklyTitle =
        document.getElementById("weeklyTitle");


    if (!weeklyGrid || !weeklyTitle) {
        return;
    }


    weeklyGrid.innerHTML = "";


    const startOfWeek =
        getStartOfWeek(weeklyDate);


    const endOfWeek =
        new Date(startOfWeek);

    endOfWeek.setDate(
        endOfWeek.getDate() + 6
    );


    weeklyTitle.textContent =
        formatWeekRange(
            startOfWeek,
            endOfWeek
        );


    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];


    days.forEach(function(dayName, index) {

        const column =
            document.createElement("div");

        column.classList.add("weekly-column");


        const currentDate =
            new Date(startOfWeek);

        currentDate.setDate(
            startOfWeek.getDate() + index
        );


        const header =
            document.createElement("div");

        header.classList.add(
            "weekly-day-header"
        );


        const dayTitle =
            document.createElement("div");

        dayTitle.textContent = dayName;


        const dateText =
            document.createElement("span");

        dateText.classList.add(
            "weekly-date"
        );

        dateText.textContent =
            currentDate.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            );


        header.appendChild(dayTitle);
        header.appendChild(dateText);


        column.appendChild(header);


        const daySchedules =
            schedules.filter(function(schedule) {

                return schedule.day === dayName;

            }).sort(function(a, b) {

                return convertTimeToMinutes(a.startTime) -
                       convertTimeToMinutes(b.startTime);

            });


        if (daySchedules.length === 0) {

            const empty =
                document.createElement("div");

            empty.classList.add(
                "weekly-empty"
            );

            empty.textContent =
                "No class";

            column.appendChild(empty);

        } else {

            daySchedules.forEach(function(schedule) {

                const event =
                    document.createElement("div");

                event.classList.add(
                    "weekly-event"
                );


                const eventTime =
                    document.createElement("div");

                eventTime.classList.add(
                    "weekly-event-time"
                );

                eventTime.textContent =
                    schedule.startTime +
                    " - " +
                    schedule.endTime;


                const eventSubject =
                    document.createElement("div");

                eventSubject.classList.add(
                    "weekly-event-subject"
                );

                eventSubject.textContent =
                    getShortSubject(
                        schedule.subject
                    );


                event.appendChild(eventTime);
                event.appendChild(eventSubject);


                event.addEventListener(
                    "click",
                    function() {

                        selectedCalendarDate =
                            getDateString(currentDate);

                        showScheduleDetails(
                            schedule,
                            getDateString(currentDate)
                        );

                        showScheduleView("calendar");
                    }
                );


                column.appendChild(event);

            });
        }


        weeklyGrid.appendChild(column);

    });
}


/* ============================= */
/* CHANGE WEEK */
/* ============================= */

function changeWeek(amount) {

    weeklyDate.setDate(
        weeklyDate.getDate() +
        (amount * 7)
    );

    renderWeeklySchedule();
}


/* ============================= */
/* START OF WEEK */
/* ============================= */

function getStartOfWeek(date) {

    const result =
        new Date(date);

    result.setHours(0, 0, 0, 0);

    const day =
        result.getDay();

    result.setDate(
        result.getDate() - day
    );

    return result;
}


/* ============================= */
/* WEEK RANGE */
/* ============================= */

function formatWeekRange(start, end) {

    const startText =
        start.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        );


    const endText =
        end.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );


    return startText + " - " + endText;
}



/* =========================================================
   SAVED SCHEDULES
   ========================================================= */

function displaySavedSchedules() {

    const list =
        document.getElementById(
            "savedScheduleList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (schedules.length === 0) {

        const empty =
            document.createElement("p");

        empty.classList.add(
            "empty-details"
        );

        empty.textContent =
            "No schedules saved yet.";

        list.appendChild(empty);

        return;
    }


    const sortedSchedules =
        schedules
            .map(function(schedule, index) {

                return {
                    schedule: schedule,
                    index: index
                };

            })
            .sort(function(a, b) {

                const dayA =
                    getDayOrder(a.schedule.day);

                const dayB =
                    getDayOrder(b.schedule.day);


                if (dayA !== dayB) {
                    return dayA - dayB;
                }


                return convertTimeToMinutes(
                    a.schedule.startTime
                ) -
                convertTimeToMinutes(
                    b.schedule.startTime
                );

            });


    sortedSchedules.forEach(function(item) {

        const schedule =
            item.schedule;

        const index =
            item.index;


        const container =
            document.createElement("div");

        container.classList.add(
            "saved-schedule-item"
        );


        const info =
            document.createElement("div");

        info.classList.add(
            "saved-schedule-info"
        );


        const subject =
            document.createElement("div");

        subject.classList.add(
            "saved-schedule-subject"
        );

        subject.textContent =
            schedule.subject;


        const time =
            document.createElement("div");

        time.classList.add(
            "saved-schedule-time"
        );

        time.textContent =
            schedule.day +
            " • " +
            schedule.startTime +
            " - " +
            schedule.endTime;


        info.appendChild(subject);
        info.appendChild(time);


        const actions =
            document.createElement("div");

        actions.classList.add(
            "saved-schedule-actions"
        );


        const editButton =
            document.createElement("button");

        editButton.textContent = "✏️ Edit";

        editButton.classList.add(
            "schedule-edit-btn"
        );

        editButton.addEventListener(
            "click",
            function() {

                editSchedule(index);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );


        const deleteButton =
            document.createElement("button");

        deleteButton.textContent = "🗑️ Delete";

        deleteButton.classList.add(
            "schedule-delete-btn"
        );

        deleteButton.addEventListener(
            "click",
            function() {

                deleteSchedule(index);

            }
        );


        actions.appendChild(editButton);
        actions.appendChild(deleteButton);


        container.appendChild(info);
        container.appendChild(actions);


        list.appendChild(container);

    });
}



/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function getDayName(dayNumber) {

    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    return days[dayNumber];
}


function getDayOrder(dayName) {

    const order = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
    };

    return order[dayName];
}


function convertTimeToMinutes(timeString) {

    const parts =
        timeString.split(" ");

    const time =
        parts[0];

    const period =
        parts[1];


    let timeParts =
        time.split(":");


    let hour =
        parseInt(timeParts[0]);

    const minute =
        parseInt(timeParts[1]);


    if (period === "AM") {

        if (hour === 12) {
            hour = 0;
        }

    } else {

        if (hour !== 12) {
            hour += 12;
        }
    }


    return (hour * 60) + minute;
}


function getShortSubject(subject) {

    const dashIndex =
        subject.indexOf(" - ");


    if (dashIndex !== -1) {

        return subject.substring(
            0,
            dashIndex
        );
    }


    return subject;
}


function getDateString(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return year + "-" + month + "-" + day;
}



/* =========================================================
   INITIAL LOAD
   ========================================================= */

displayTasks();

renderCalendar();

renderWeeklySchedule();

displaySavedSchedules();
