/* =========================================================
   ASSIGNMENT TRACKER
========================================================= */

let tasks = JSON.parse(localStorage.getItem("schoolTasks")) || [];
let editingIndex = -1;


/* =========================================================
   CLASS SCHEDULE
========================================================= */

let schedules = JSON.parse(localStorage.getItem("classSchedules")) || [];

let editingScheduleIndex = -1;

let calendarDate = new Date();
let weeklyDate = new Date();

let selectedCalendarDate = null;


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


    mainTabs.forEach(button => {
        button.classList.remove("active");
    });


    if (tab === "assignments") {

        assignmentsTab.style.display = "block";
        scheduleTab.style.display = "none";

        mainTabs[0].classList.add("active");

        displayTasks();

    } else {

        assignmentsTab.style.display = "none";
        scheduleTab.style.display = "block";

        mainTabs[1].classList.add("active");

        renderCalendar();
        renderWeeklySchedule();
        displaySavedSchedules();
    }
}


/* =========================================================
   ASSIGNMENT FUNCTIONS
========================================================= */

function addTask() {

    const subject =
        document.getElementById("subject").value;

    const task =
        document.getElementById("task").value.trim();

    const dueDate =
        document.getElementById("dueDate").value;

    const priority =
        document.getElementById("priority").value;


    if (!subject || !task || !dueDate) {

        alert(
            "Please complete all assignment fields."
        );

        return;
    }


    const taskData = {

        subject: subject,

        task: task,

        dueDate: dueDate,

        priority: priority,

        completed: false

    };


    if (editingIndex >= 0) {

        taskData.completed =
            tasks[editingIndex].completed;

        tasks[editingIndex] =
            taskData;

        editingIndex = -1;


        document.getElementById(
            "addTaskButton"
        ).textContent =
            "Add Assignment";

    } else {

        tasks.push(taskData);
    }


    saveTasks();


    document.getElementById(
        "subject"
    ).value = "";

    document.getElementById(
        "task"
    ).value = "";

    document.getElementById(
        "dueDate"
    ).value = "";

    document.getElementById(
        "priority"
    ).value = "Medium";


    displayTasks();
}


/* =========================================================
   DISPLAY TASKS
========================================================= */

function displayTasks() {

    const taskList =
        document.getElementById("taskList");

    const dateFilterElement =
        document.getElementById("dateFilter");

    const specificDateElement =
        document.getElementById("specificDate");


    if (!taskList || !dateFilterElement) {
        return;
    }


    const dateFilter =
        dateFilterElement.value;

    const specificDate =
        specificDateElement
            ? specificDateElement.value
            : "";


    taskList.innerHTML = "";


    let filteredTasks = tasks.filter(task => {

        /* =========================================
           NORMALIZE FILTER VALUE
        ========================================= */

        const filter =
            String(dateFilter)
                .trim()
                .toLowerCase();


        /* =========================================
           ALL DATES
        ========================================= */

        if (
            filter === "all" ||
            filter === ""
        ) {

            return true;
        }


        /* =========================================
           TODAY
        ========================================= */

        if (
            filter === "today"
        ) {

            return (
                task.dueDate ===
                getTodayString()
            );
        }


        /* =========================================
           TOMORROW
        ========================================= */

        if (
            filter === "tomorrow"
        ) {

            return (
                task.dueDate ===
                getDateAfterDays(1)
            );
        }


        /* =========================================
           NEXT 7 DAYS

           Includes:
           Today
           + next 6 days

           Example:
           Sept 17 -> Sept 23

           Sept 30 = NOT INCLUDED
        ========================================= */

        if (
            filter === "next7" ||
            filter === "week"
        ) {

            const today =
                new Date();


            today.setHours(
                0,
                0,
                0,
                0
            );


            const endDate =
                new Date(today);


            endDate.setDate(
                today.getDate() + 6
            );


            endDate.setHours(
                23,
                59,
                59,
                999
            );


            const taskDate =
                new Date(
                    task.dueDate +
                    "T00:00:00"
                );


            return (
                taskDate >= today &&
                taskDate <= endDate
            );
        }


        /* =========================================
           OVERDUE
        ========================================= */

        if (
            filter === "overdue"
        ) {

            const today =
                new Date();


            today.setHours(
                0,
                0,
                0,
                0
            );


            const taskDate =
                new Date(
                    task.dueDate +
                    "T00:00:00"
                );


            return taskDate < today;
        }


        /* =========================================
           SPECIFIC DATE
        ========================================= */

        if (
            filter === "specific"
        ) {

            return (
                specificDate !== "" &&
                task.dueDate === specificDate
            );
        }


        /* =========================================
           UNKNOWN FILTER
           Do NOT show everything.
        ========================================= */

        return false;
    });


    /* =========================================
       NO RESULTS
    ========================================= */

    if (filteredTasks.length === 0) {

        taskList.innerHTML = `

            <div class="empty-details">

                <div>📋</div>

                <p>
                    No assignments found.
                </p>

            </div>

        `;

    } else {


        /* =========================================
           DISPLAY TASKS
        ========================================= */

        filteredTasks.forEach(task => {

            const originalIndex =
                tasks.indexOf(task);


            const taskItem =
                document.createElement("div");


            taskItem.className =
                "task-item" +
                (
                    task.completed
                        ? " completed"
                        : ""
                );


            const priorityClass =

                task.priority === "High"
                    ? "priority-high"

                    : task.priority === "Medium"
                        ? "priority-medium"

                        : "priority-low";


            taskItem.innerHTML = `

                <input
                    type="checkbox"
                    class="task-checkbox"
                    ${task.completed ? "checked" : ""}
                    onchange="toggleTask(${originalIndex})"
                >

                <div class="task-info">

                    <div class="task-subject">
                        ${escapeHtml(task.subject)}
                    </div>

                    <div class="task-name">
                        ${escapeHtml(task.task)}
                    </div>

                    <div class="task-due">
                        Due: ${formatDate(task.dueDate)}
                    </div>

                </div>

                <span class="priority ${priorityClass}">
                    ${escapeHtml(task.priority)}
                </span>

                <div class="task-actions">

                    <button
                        class="edit-button"
                        onclick="editTask(${originalIndex})"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-button"
                        onclick="deleteTask(${originalIndex})"
                    >
                        Delete
                    </button>

                </div>

            `;


            taskList.appendChild(
                taskItem
            );
        });
    }


    updateTaskCounter(
        filteredTasks.length
    );


    updateProgress();
}


/* =========================================================
   TASK ACTIONS
========================================================= */

function toggleTask(index) {

    tasks[index].completed =
        !tasks[index].completed;


    saveTasks();

    displayTasks();
}


function editTask(index) {

    const task =
        tasks[index];


    document.getElementById(
        "subject"
    ).value =
        task.subject;


    document.getElementById(
        "task"
    ).value =
        task.task;


    document.getElementById(
        "dueDate"
    ).value =
        task.dueDate;


    document.getElementById(
        "priority"
    ).value =
        task.priority;


    editingIndex =
        index;


    document.getElementById(
        "addTaskButton"
    ).textContent =
        "Update Assignment";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


function deleteTask(index) {

    if (
        !confirm(
            "Delete this assignment?"
        )
    ) {
        return;
    }


    tasks.splice(
        index,
        1
    );


    saveTasks();

    displayTasks();
}


/* =========================================================
   DATE FILTER
========================================================= */

function handleDateFilter() {

    const filterElement =
        document.getElementById(
            "dateFilter"
        );

    const specificDate =
        document.getElementById(
            "specificDate"
        );


    if (!filterElement) {
        return;
    }


    const filter =
        filterElement.value
            .trim()
            .toLowerCase();


    if (
        filter === "specific"
    ) {

        if (specificDate) {

            specificDate.style.display =
                "block";
        }

    } else {

        if (specificDate) {

            specificDate.style.display =
                "none";

            specificDate.value = "";
        }
    }


    displayTasks();
}


/* =========================================================
   TASK STORAGE
========================================================= */

function saveTasks() {

    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );
}


function updateTaskCounter(count) {

    const counter =
        document.getElementById(
            "taskCounter"
        );


    if (!counter) {
        return;
    }


    counter.textContent =
        `${count} ${
            count === 1
                ? "assignment"
                : "assignments"
        }`;
}


function updateProgress() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const pending =
        total - completed;


    const percentage =
        total === 0

            ? 0

            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );


    const totalElement =
        document.getElementById(
            "totalTasks"
        );

    const completedElement =
        document.getElementById(
            "completedTasks"
        );

    const pendingElement =
        document.getElementById(
            "pendingTasks"
        );

    const progressFill =
        document.getElementById(
            "progressFill"
        );

    const progressText =
        document.getElementById(
            "progressText"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }


    if (completedElement) {
        completedElement.textContent =
            completed;
    }


    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }


    if (progressFill) {

        progressFill.style.width =
            percentage + "%";
    }


    if (progressText) {

        progressText.textContent =
            `${percentage}% Complete`;
    }
}


/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayString() {

    const today =
        new Date();


    return getDateString(
        today
    );
}


function getDateAfterDays(days) {

    const date =
        new Date();


    date.setDate(
        date.getDate() +
        days
    );


    return getDateString(
        date
    );
}


function getDateString(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;
}


/* =========================================================
   SCHEDULE TIME DROPDOWNS
========================================================= */

function generateTimeOptions() {

    const startTime =
        document.getElementById(
            "startTime"
        );

    const endTime =
        document.getElementById(
            "endTime"
        );


    if (
        !startTime ||
        !endTime
    ) {
        return;
    }


    startTime.innerHTML =
        `<option value="">Start Time</option>`;


    endTime.innerHTML =
        `<option value="">End Time</option>`;


    /* =========================================
       START TIME
       7:00 AM - 10:00 PM
    ========================================= */

    for (
        let hour = 7;
        hour <= 22;
        hour++
    ) {

        for (
            let minute of [0, 30]
        ) {

            if (
                hour === 22 &&
                minute === 30
            ) {
                continue;
            }


            const value =
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;


            const label =
                formatTime(value);


            startTime.innerHTML +=
                `<option value="${value}">${label}</option>`;
        }
    }


    /* =========================================
       END TIME
       7:30 AM - 11:00 PM
    ========================================= */

    for (
        let hour = 7;
        hour <= 23;
        hour++
    ) {

        for (
            let minute of [0, 30]
        ) {

            if (
                hour === 7 &&
                minute === 0
            ) {
                continue;
            }


            if (
                hour === 23 &&
                minute === 30
            ) {
                continue;
            }


            const value =
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;


            const label =
                formatTime(value);


            endTime.innerHTML +=
                `<option value="${value}">${label}</option>`;
        }
    }
}


function formatTime(time) {

    if (!time) {
        return "";
    }


    const [
        hourString,
        minute
    ] =
        time.split(":");


    let hour =
        parseInt(
            hourString
        );


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    if (hour === 0) {

        hour = 12;

    } else if (
        hour > 12
    ) {

        hour -= 12;
    }


    return `${hour}:${minute} ${suffix}`;
}


function convertTimeToMinutes(time) {

    const [
        hours,
        minutes
    ] =
        time
            .split(":")
            .map(Number);


    return (
        hours * 60 +
        minutes
    );
}


/* =========================================================
   ADD / EDIT / DELETE SCHEDULE
========================================================= */

function addSchedule() {

    const subject =
        document.getElementById(
            "scheduleSubject"
        ).value;


    const date =
        document.getElementById(
            "scheduleDate"
        ).value;


    const startTime =
        document.getElementById(
            "startTime"
        ).value;


    const endTime =
        document.getElementById(
            "endTime"
        ).value;


    if (
        !subject ||
        !date ||
        !startTime ||
        !endTime
    ) {

        alert(
            "Please complete all schedule fields."
        );

        return;
    }


    if (
        convertTimeToMinutes(
            endTime
        ) <=
        convertTimeToMinutes(
            startTime
        )
    ) {

        alert(
            "End time must be later than start time."
        );

        return;
    }


    const scheduleData = {

        subject: subject,

        date: date,

        startTime: startTime,

        endTime: endTime

    };


    if (
        editingScheduleIndex >= 0
    ) {

        schedules[
            editingScheduleIndex
        ] =
            scheduleData;


        editingScheduleIndex =
            -1;


        document.getElementById(
            "addScheduleButton"
        ).textContent =
            "Add Schedule";

    } else {

        schedules.push(
            scheduleData
        );
    }


    saveSchedules();


    /* RESET FORM */

    document.getElementById(
        "scheduleSubject"
    ).value = "";


    document.getElementById(
        "scheduleDate"
    ).value = "";


    document.getElementById(
        "startTime"
    ).value = "";


    document.getElementById(
        "endTime"
    ).value = "";


    renderCalendar();

    renderWeeklySchedule();

    displaySavedSchedules();
}


function saveSchedules() {

    localStorage.setItem(
        "classSchedules",
        JSON.stringify(
            schedules
        )
    );
}


function editSchedule(index) {

    const schedule =
        schedules[index];


    document.getElementById(
        "scheduleSubject"
    ).value =
        schedule.subject;


    document.getElementById(
        "scheduleDate"
    ).value =
        schedule.date;


    document.getElementById(
        "startTime"
    ).value =
        schedule.startTime;


    document.getElementById(
        "endTime"
    ).value =
        schedule.endTime;


    editingScheduleIndex =
        index;


    document.getElementById(
        "addScheduleButton"
    ).textContent =
        "Update Schedule";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


function deleteSchedule(index) {

    if (
        !confirm(
            "Delete this class schedule?"
        )
    ) {
        return;
    }


    schedules.splice(
        index,
        1
    );


    saveSchedules();


    renderCalendar();

    renderWeeklySchedule();

    displaySavedSchedules();

    showScheduleDetails(null);
}


/* =========================================================
   SCHEDULE VIEWS
========================================================= */

function showScheduleView(view) {

    const calendarView =
        document.getElementById(
            "calendarView"
        );


    const weeklyView =
        document.getElementById(
            "weeklyView"
        );


    const tabs =
        document.querySelectorAll(
            ".schedule-tab"
        );


    tabs.forEach(tab => {

        tab.classList.remove(
            "active"
        );
    });


    if (
        view === "calendar"
    ) {

        calendarView.style.display =
            "block";


        weeklyView.style.display =
            "none";


        tabs[0].classList.add(
            "active"
        );


        renderCalendar();

    } else {

        calendarView.style.display =
            "none";


        weeklyView.style.display =
            "block";


        tabs[1].classList.add(
            "active"
        );


        renderWeeklySchedule();
    }
}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const grid =
        document.getElementById(
            "calendarGrid"
        );


    const monthTitle =
        document.getElementById(
            "calendarMonth"
        );


    if (
        !grid ||
        !monthTitle
    ) {
        return;
    }


    grid.innerHTML = "";


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    const monthName =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    monthTitle.textContent =
        monthName;


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /* EMPTY DAYS */

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const emptyDay =
            document.createElement(
                "div"
            );


        emptyDay.className =
            "calendar-day empty";


        grid.appendChild(
            emptyDay
        );
    }


    const todayString =
        getTodayString();


    /* DAYS */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const dateString =
            getDateString(
                date
            );


        const dayElement =
            document.createElement(
                "div"
            );


        dayElement.className =
            "calendar-day";


        if (
            dateString ===
            todayString
        ) {

            dayElement.classList.add(
                "today"
            );
        }


        dayElement.onclick =
            function () {

                showScheduleDetailsForDate(
                    dateString
                );
            };


        const dateNumber =
            document.createElement(
                "div"
            );


        dateNumber.className =
            "calendar-date-number";


        dateNumber.textContent =
            day;


        dayElement.appendChild(
            dateNumber
        );


        /* EXACT DATE ONLY */

        const daySchedules =
            schedules.filter(
                schedule =>
                    schedule.date ===
                    dateString
            );


        daySchedules.sort(
            (a, b) =>
                convertTimeToMinutes(
                    a.startTime
                ) -
                convertTimeToMinutes(
                    b.startTime
                )
        );


        daySchedules.forEach(
            schedule => {

                const event =
                    document.createElement(
                        "div"
                    );


                event.className =
                    "calendar-event";


                event.onclick =
                    function (
                        eventObject
                    ) {

                        eventObject.stopPropagation();

                        showScheduleDetails(
                            schedule
                        );
                    };


                event.innerHTML = `

                    <div class="calendar-event-subject">
                        ${escapeHtml(
                            getShortSubject(
                                schedule.subject
                            )
                        )}
                    </div>

                    <div class="calendar-event-time">
                        ${formatTime(
                            schedule.startTime
                        )}
                        -
                        ${formatTime(
                            schedule.endTime
                        )}
                    </div>

                `;


                dayElement.appendChild(
                    event
                );
            }
        );


        grid.appendChild(
            dayElement
        );
    }


    if (
        selectedCalendarDate
    ) {

        showScheduleDetailsForDate(
            selectedCalendarDate
        );
    }
}


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

function changeMonth(amount) {

    calendarDate.setMonth(
        calendarDate.getMonth() +
        amount
    );


    selectedCalendarDate =
        null;


    renderCalendar();

    showScheduleDetails(null);
}


/* =========================================================
   CALENDAR DETAILS
========================================================= */

function showScheduleDetails(schedule) {

    const details =
        document.getElementById(
            "scheduleDetails"
        );


    if (!schedule) {

        details.innerHTML = `

            <div class="empty-details">

                <div>📅</div>

                <p>
                    Select a class from the calendar
                    to see details.
                </p>

            </div>

        `;

        return;
    }


    selectedCalendarDate =
        schedule.date;


    details.innerHTML = `

        <div class="schedule-detail-subject">
            ${escapeHtml(
                schedule.subject
            )}
        </div>

        <div class="schedule-detail-item">
            <strong>📅 Date:</strong><br>
            ${formatDate(
                schedule.date
            )}
        </div>

        <div class="schedule-detail-item">
            <strong>🕐 Time:</strong><br>
            ${formatTime(
                schedule.startTime
            )}
            -
            ${formatTime(
                schedule.endTime
            )}
        </div>

        <div class="schedule-detail-item">
            <strong>💻 Class:</strong><br>
            Online Class
        </div>

    `;
}


function showScheduleDetailsForDate(
    dateString
) {

    selectedCalendarDate =
        dateString;


    const daySchedules =
        schedules.filter(
            schedule =>
                schedule.date ===
                dateString
        );


    if (
        daySchedules.length === 0
    ) {

        showScheduleDetails(
            null
        );

        return;
    }


    showScheduleDetails(
        daySchedules[0]
    );
}


/* =========================================================
   WEEKLY SCHEDULE
========================================================= */

function getStartOfWeek(date) {

    const result =
        new Date(date);


    const day =
        result.getDay();


    result.setDate(
        result.getDate() -
        day
    );


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;
}


function renderWeeklySchedule() {

    const grid =
        document.getElementById(
            "weeklyGrid"
        );


    const title =
        document.getElementById(
            "weeklyTitle"
        );


    if (
        !grid ||
        !title
    ) {
        return;
    }


    grid.innerHTML = "";


    const weekStart =
        getStartOfWeek(
            weeklyDate
        );


    const weekEnd =
        new Date(
            weekStart
        );


    weekEnd.setDate(
        weekStart.getDate() +
        6
    );


    title.textContent =
        formatWeekRange(
            weekStart,
            weekEnd
        );


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const currentDate =
            new Date(
                weekStart
            );


        currentDate.setDate(
            weekStart.getDate() +
            i
        );


        const dateString =
            getDateString(
                currentDate
            );


        const dayColumn =
            document.createElement(
                "div"
            );


        dayColumn.className =
            "weekly-column";


        const dayHeader =
            document.createElement(
                "div"
            );


        dayHeader.className =
            "weekly-day-header";


        const dayName =
            currentDate.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );


        const dateText =
            currentDate.toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric"
                }
            );


        dayHeader.innerHTML = `

            <div>
                ${dayName}
            </div>

            <div class="weekly-date">
                ${dateText}
            </div>

        `;


        dayColumn.appendChild(
            dayHeader
        );


        /* EXACT DATE ONLY */

        const daySchedules =
            schedules.filter(
                schedule =>
                    schedule.date ===
                    dateString
            );


        daySchedules.sort(
            (a, b) =>
                convertTimeToMinutes(
                    a.startTime
                ) -
                convertTimeToMinutes(
                    b.startTime
                )
        );


        if (
            daySchedules.length === 0
        ) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "weekly-empty";


            empty.textContent =
                "No class";


            dayColumn.appendChild(
                empty
            );

        } else {

            daySchedules.forEach(
                schedule => {

                    const event =
                        document.createElement(
                            "div"
                        );


                    event.className =
                        "weekly-event";


                    event.onclick =
                        function () {

                            showScheduleDetails(
                                schedule
                            );


                            showScheduleView(
                                "calendar"
                            );


                            calendarDate =
                                new Date(
                                    schedule.date +
                                    "T00:00:00"
                                );


                            renderCalendar();
                        };


                    event.innerHTML = `

                        <div class="weekly-event-subject">
                            ${escapeHtml(
                                getShortSubject(
                                    schedule.subject
                                )
                            )}
                        </div>

                        <div class="weekly-event-time">
                            ${formatTime(
                                schedule.startTime
                            )}
                            -
                            ${formatTime(
                                schedule.endTime
                            )}
                        </div>

                    `;


                    dayColumn.appendChild(
                        event
                    );
                }
            );
        }


        grid.appendChild(
            dayColumn
        );
    }
}


/* =========================================================
   WEEK NAVIGATION
========================================================= */

function changeWeek(amount) {

    weeklyDate.setDate(
        weeklyDate.getDate() +
        (amount * 7)
    );


    renderWeeklySchedule();
}


function formatWeekRange(
    start,
    end
) {

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


    return `${startText} - ${endText}`;
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


    if (
        schedules.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-details">

                <div>📋</div>

                <p>
                    No saved class schedules yet.
                </p>

            </div>

        `;

        return;
    }


    const sortedSchedules =
        schedules
            .map(
                (schedule, index) => ({
                    schedule,
                    index
                })
            )
            .sort(
                (a, b) =>

                    a.schedule.date.localeCompare(
                        b.schedule.date
                    )

                    ||

                    a.schedule.startTime.localeCompare(
                        b.schedule.startTime
                    )
            );


    sortedSchedules.forEach(
        item => {

            const schedule =
                item.schedule;


            const index =
                item.index;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "saved-schedule-item";


            element.innerHTML = `

                <div class="saved-schedule-info">

                    <div class="saved-schedule-subject">
                        ${escapeHtml(
                            schedule.subject
                        )}
                    </div>

                    <div class="saved-schedule-date">
                        📅 ${formatDate(
                            schedule.date
                        )}
                    </div>

                    <div class="saved-schedule-time">
                        🕐
                        ${formatTime(
                            schedule.startTime
                        )}
                        -
                        ${formatTime(
                            schedule.endTime
                        )}
                    </div>

                </div>


                <div class="saved-schedule-actions">

                    <button
                        class="saved-edit"
                        onclick="editSchedule(${index})"
                    >
                        Edit
                    </button>

                    <button
                        class="saved-delete"
                        onclick="deleteSchedule(${index})"
                    >
                        Delete
                    </button>

                </div>

            `;


            list.appendChild(
                element
            );
        }
    );
}


/* =========================================================
   SUBJECT SHORT NAME
========================================================= */

function getShortSubject(subject) {

    if (!subject) {
        return "";
    }


    const parts =
        subject.split(
            " - "
        );


    return parts[0];
}


/* =========================================================
   INITIALIZE
========================================================= */

generateTimeOptions();

displayTasks();

renderCalendar();

renderWeeklySchedule();

displaySavedSchedules();
