// ============================================================
// MY SCHOOL TRACKER
// ASSIGNMENTS + CLASS SCHEDULE
// SUPABASE CLOUD SYNC
// ============================================================

let currentUser = null;

let tasks = [];
let schedules = [];

let editingIndex = -1;
let editingScheduleIndex = -1;

let calendarDate = new Date();
let weeklyDate = new Date();

let selectedCalendarDate = null;


// ============================================================
// SUPABASE CHECK
// ============================================================

function getSupabase() {
    if (!window.supabaseClient) {
        alert("Supabase is not connected. Please check supabase-config.js.");
        return null;
    }

    return window.supabaseClient;
}


// ============================================================
// LOGIN SCREEN
// ============================================================

function createLoginScreen() {

    if (document.getElementById("loginScreen")) {
        return;
    }

    const loginScreen = document.createElement("div");

    loginScreen.id = "loginScreen";

    loginScreen.innerHTML = `
        <div class="login-card">

            <h2>🎓 My School Tracker</h2>

            <p>Login to access your school tracker.</p>

            <input
                type="email"
                id="loginEmail"
                placeholder="Email address"
            >

            <input
                type="password"
                id="loginPassword"
                placeholder="Password"
            >

            <button onclick="loginUser()">
                Login
            </button>

            <p id="loginMessage"></p>

        </div>
    `;

    document.body.appendChild(loginScreen);
}


// ============================================================
// LOGIN
// ============================================================

async function loginUser() {

    const supabase = getSupabase();

    if (!supabase) return;

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const message = document.getElementById("loginMessage");

    if (!email || !password) {

        message.textContent = "Please enter your email and password.";

        return;
    }

    message.textContent = "Logging in...";

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {

        message.textContent = error.message;

        return;
    }

    currentUser = data.user;

    const loginScreen =
        document.getElementById("loginScreen");

    if (loginScreen) {
        loginScreen.remove();
    }

    document.body.classList.remove("logged-out");

    await initializeTracker();
}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    const supabase = getSupabase();

    if (!supabase) return;

    await supabase.auth.signOut();

    currentUser = null;

    location.reload();
}


// ============================================================
// LOAD CLOUD DATA
// ============================================================

async function loadCloudData() {

    const supabase = getSupabase();

    if (!supabase || !currentUser) return;

    try {

        // -------------------------
        // ASSIGNMENTS
        // -------------------------

        const {
            data: cloudTasks,
            error: taskError
        } = await supabase
            .from("assignments")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("due_date", {
                ascending: true
            });

        if (taskError) {
            console.error(
                "Assignment load error:",
                taskError
            );
        } else {

            if (cloudTasks && cloudTasks.length > 0) {

                tasks = cloudTasks.map(task => ({
                    id: task.id,
                    subject: task.subject,
                    task: task.task,
                    dueDate: task.due_date,
                    priority: task.priority,
                    completed: task.completed,
                    createdAt: task.created_at
                }));

            } else {

                const localTasks =
                    JSON.parse(
                        localStorage.getItem("schoolTasks")
                    ) || [];

                tasks = localTasks;

                if (localTasks.length > 0) {

                    for (const task of localTasks) {

                        await supabase
                            .from("assignments")
                            .insert({
                                subject: task.subject,
                                task: task.task,
                                due_date: task.dueDate,
                                priority: task.priority,
                                completed: task.completed || false,
                                user_id: currentUser.id
                            });
                    }
                }
            }
        }


        // -------------------------
        // CLASS SCHEDULES
        // -------------------------

        const {
            data: cloudSchedules,
            error: scheduleError
        } = await supabase
            .from("class_schedules")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("schedule_date", {
                ascending: true
            });

        if (scheduleError) {

            console.error(
                "Schedule load error:",
                scheduleError
            );

        } else {

            if (
                cloudSchedules &&
                cloudSchedules.length > 0
            ) {

                schedules =
                    cloudSchedules.map(schedule => ({
                        id: schedule.id,
                        subject: schedule.subject,
                        scheduleDate: schedule.schedule_date,
                        startTime: schedule.start_time,
                        endTime: schedule.end_time,
                        createdAt: schedule.created_at
                    }));

            } else {

                const localSchedules =
                    JSON.parse(
                        localStorage.getItem("classSchedules")
                    ) || [];

                schedules = localSchedules;

                if (localSchedules.length > 0) {

                    for (const schedule of localSchedules) {

                        await supabase
                            .from("class_schedules")
                            .insert({
                                subject: schedule.subject,
                                schedule_date: schedule.scheduleDate,
                                start_time: schedule.startTime,
                                end_time: schedule.endTime,
                                user_id: currentUser.id
                            });
                    }
                }
            }
        }

        localStorage.setItem(
            "schoolTasks",
            JSON.stringify(tasks)
        );

        localStorage.setItem(
            "classSchedules",
            JSON.stringify(schedules)
        );

    } catch (error) {

        console.error(
            "Cloud sync error:",
            error
        );
    }
}


// ============================================================
// INITIALIZE TRACKER
// ============================================================

async function initializeTracker() {

    await loadCloudData();

    displayTasks();

    populateTimeDropdowns();

    renderCalendar();

    renderWeekly();

    displaySavedSchedules();

    updateProgress();

    addLogoutButton();
}


// ============================================================
// LOGOUT BUTTON
// ============================================================

function addLogoutButton() {

    if (document.getElementById("logoutButton")) {
        return;
    }

    const button = document.createElement("button");

    button.id = "logoutButton";

    button.textContent = "Logout";

    button.onclick = logoutUser;

    button.style.marginTop = "15px";

    const container =
        document.querySelector(".container");

    if (container) {
        container.appendChild(button);
    }
}


// ============================================================
// MAIN TABS
// ============================================================

function showMainTab(tab) {

    const assignmentsTab =
        document.getElementById("assignmentsTab");

    const scheduleTab =
        document.getElementById("scheduleTab");

    const tabs =
        document.querySelectorAll(".main-tab");

    tabs.forEach(button => {
        button.classList.remove("active");
    });

    if (tab === "assignments") {

        assignmentsTab.style.display = "block";

        scheduleTab.style.display = "none";

        tabs[0].classList.add("active");

    } else {

        assignmentsTab.style.display = "none";

        scheduleTab.style.display = "block";

        tabs[1].classList.add("active");

        renderCalendar();

        renderWeekly();

        displaySavedSchedules();
    }
}


// ============================================================
// ASSIGNMENTS
// ============================================================

async function addTask() {

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const supabase = getSupabase();

    if (!supabase) return;

    const subject =
        document.getElementById("subject").value;

    const task =
        document.getElementById("task").value.trim();

    const dueDate =
        document.getElementById("dueDate").value;

    const priority =
        document.getElementById("priority").value;

    if (!task || !dueDate) {

        alert("Please enter the topic and due date.");

        return;
    }


    // EDIT
    if (editingIndex !== -1) {

        const existingTask =
            tasks[editingIndex];

        const { error } =
            await supabase
                .from("assignments")
                .update({
                    subject: subject,
                    task: task,
                    due_date: dueDate,
                    priority: priority
                })
                .eq("id", existingTask.id)
                .eq("user_id", currentUser.id);

        if (error) {

            alert(
                "Unable to update task: " +
                error.message
            );

            return;
        }

        tasks[editingIndex] = {
            ...existingTask,
            subject,
            task,
            dueDate,
            priority
        };

        editingIndex = -1;

        document.getElementById(
            "addTaskButton"
        ).textContent = "Add Task";

    }

    // ADD
    else {

        const { data, error } =
            await supabase
                .from("assignments")
                .insert({
                    subject: subject,
                    task: task,
                    due_date: dueDate,
                    priority: priority,
                    completed: false,
                    user_id: currentUser.id
                })
                .select()
                .single();

        if (error) {

            alert(
                "Unable to add task: " +
                error.message
            );

            return;
        }

        tasks.push({
            id: data.id,
            subject: data.subject,
            task: data.task,
            dueDate: data.due_date,
            priority: data.priority,
            completed: data.completed,
            createdAt: data.created_at
        });
    }


    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );

    document.getElementById("task").value = "";

    document.getElementById("dueDate").value = "";

    displayTasks();

    updateProgress();
}


// ============================================================
// DISPLAY TASKS
// ============================================================

function displayTasks() {

    const list =
        document.getElementById("taskList");

    if (!list) return;

    list.innerHTML = "";

    const filter =
        document.getElementById("dateFilter").value;

    const specificDate =
        document.getElementById("specificDate").value;

    const today =
        new Date();

    today.setHours(0, 0, 0, 0);

    let filteredTasks = [...tasks];


    if (filter === "Today") {

        const todayString =
            formatDateInput(today);

        filteredTasks =
            tasks.filter(
                task => task.dueDate === todayString
            );

    }

    else if (filter === "Next7") {

        const sevenDays =
            new Date(today);

        sevenDays.setDate(
            sevenDays.getDate() + 7
        );

        filteredTasks =
            tasks.filter(task => {

                const due =
                    parseLocalDate(task.dueDate);

                return due >= today &&
                    due <= sevenDays;
            });

    }

    else if (filter === "Overdue") {

        filteredTasks =
            tasks.filter(task => {

                const due =
                    parseLocalDate(task.dueDate);

                return due < today &&
                    !task.completed;
            });

    }

    else if (
        filter === "Specific" &&
        specificDate
    ) {

        filteredTasks =
            tasks.filter(
                task =>
                    task.dueDate === specificDate
            );
    }


    filteredTasks.sort(
        (a, b) =>
            parseLocalDate(a.dueDate) -
            parseLocalDate(b.dueDate)
    );


    filteredTasks.forEach(task => {

        const actualIndex =
            tasks.indexOf(task);

        const li =
            document.createElement("li");

        li.className =
            task.completed
                ? "completed"
                : "";


        li.innerHTML = `
            <div class="task-info">

                <strong>
                    ${escapeHtml(task.task)}
                </strong>

                <small>
                    ${escapeHtml(task.subject)}
                </small>

                <small>
                    📅 ${formatDisplayDate(task.dueDate)}
                </small>

                <small>
                    Priority: ${escapeHtml(task.priority)}
                </small>

            </div>

            <div class="task-actions">

                <button onclick="toggleTask(${actualIndex})">
                    ${task.completed ? "↩️" : "✅"}
                </button>

                <button onclick="editTask(${actualIndex})">
                    ✏️
                </button>

                <button onclick="deleteTask(${actualIndex})">
                    🗑️
                </button>

            </div>
        `;

        list.appendChild(li);
    });


    const counter =
        document.getElementById("taskCounter");

    if (counter) {

        counter.textContent =
            filteredTasks.length +
            (
                filteredTasks.length === 1
                    ? " Task"
                    : " Tasks"
            );
    }

    updateProgress();
}


// ============================================================
// DATE FILTER
// ============================================================

function handleDateFilter() {

    const filter =
        document.getElementById("dateFilter").value;

    const specificDate =
        document.getElementById("specificDate");

    if (filter === "Specific") {

        specificDate.style.display =
            "block";

    } else {

        specificDate.style.display =
            "none";

        specificDate.value = "";
    }

    displayTasks();
}


// ============================================================
// TOGGLE TASK
// ============================================================

async function toggleTask(index) {

    if (!currentUser) return;

    const supabase = getSupabase();

    if (!supabase) return;

    const task = tasks[index];

    if (!task) return;

    const newStatus =
        !task.completed;

    const { error } =
        await supabase
            .from("assignments")
            .update({
                completed: newStatus
            })
            .eq("id", task.id)
            .eq("user_id", currentUser.id);

    if (error) {

        alert(
            "Unable to update task: " +
            error.message
        );

        return;
    }

    task.completed = newStatus;

    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );

    displayTasks();

    updateProgress();
}


// ============================================================
// EDIT TASK
// ============================================================

function editTask(index) {

    const task = tasks[index];

    if (!task) return;

    document.getElementById(
        "subject"
    ).value = task.subject;

    document.getElementById(
        "task"
    ).value = task.task;

    document.getElementById(
        "dueDate"
    ).value = task.dueDate;

    document.getElementById(
        "priority"
    ).value = task.priority;

    editingIndex = index;

    document.getElementById(
        "addTaskButton"
    ).textContent = "Save Changes";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// DELETE TASK
// ============================================================

async function deleteTask(index) {

    if (!currentUser) return;

    const task = tasks[index];

    if (!task) return;

    const confirmed =
        confirm(
            "Delete this assignment?"
        );

    if (!confirmed) return;

    const supabase = getSupabase();

    if (!supabase) return;

    const { error } =
        await supabase
            .from("assignments")
            .delete()
            .eq("id", task.id)
            .eq("user_id", currentUser.id);

    if (error) {

        alert(
            "Unable to delete task: " +
            error.message
        );

        return;
    }

    tasks.splice(index, 1);

    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );

    displayTasks();

    updateProgress();
}


// ============================================================
// PROGRESS
// ============================================================

function updateProgress() {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task => task.completed
        ).length;

    const pending =
        total - completed;

    const totalElement =
        document.getElementById("totalTasks");

    const completedElement =
        document.getElementById("completedTasks");

    const pendingElement =
        document.getElementById("pendingTasks");

    if (totalElement)
        totalElement.textContent = total;

    if (completedElement)
        completedElement.textContent = completed;

    if (pendingElement)
        pendingElement.textContent = pending;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );

    const progressFill =
        document.getElementById("progressFill");

    const progressText =
        document.getElementById("progressText");

    if (progressFill)
        progressFill.style.width =
            percentage + "%";

    if (progressText)
        progressText.textContent =
            percentage + "% Complete";
}


// ============================================================
// TIME DROPDOWNS
// ============================================================

function populateTimeDropdowns() {

    const start =
        document.getElementById("startTime");

    const end =
        document.getElementById("endTime");

    if (!start || !end) return;

    start.innerHTML =
        `<option value="">Start Time</option>`;

    end.innerHTML =
        `<option value="">End Time</option>`;


    for (
        let hour = 0;
        hour < 24;
        hour++
    ) {

        for (
            let minute = 0;
            minute < 60;
            minute += 30
        ) {

            const value =
                `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

            const label =
                formatTime(value);

            const option1 =
                document.createElement("option");

            option1.value = value;

            option1.textContent = label;

            start.appendChild(option1);


            const option2 =
                document.createElement("option");

            option2.value = value;

            option2.textContent = label;

            end.appendChild(option2);
        }
    }
}


// ============================================================
// ADD CLASS SCHEDULE
// ============================================================

async function addSchedule() {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }

    const supabase = getSupabase();

    if (!supabase) return;

    const subject =
        document.getElementById(
            "scheduleSubject"
        ).value;

    const scheduleDate =
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
        !scheduleDate ||
        !startTime ||
        !endTime
    ) {

        alert(
            "Please complete all schedule fields."
        );

        return;
    }


    if (startTime >= endTime) {

        alert(
            "End time must be later than start time."
        );

        return;
    }


    // EDIT SCHEDULE
    if (editingScheduleIndex !== -1) {

        const existing =
            schedules[editingScheduleIndex];

        const { error } =
            await supabase
                .from("class_schedules")
                .update({
                    subject: subject,
                    schedule_date: scheduleDate,
                    start_time: startTime,
                    end_time: endTime
                })
                .eq("id", existing.id)
                .eq("user_id", currentUser.id);

        if (error) {

            alert(
                "Unable to update schedule: " +
                error.message
            );

            return;
        }


        schedules[editingScheduleIndex] = {
            ...existing,
            subject,
            scheduleDate,
            startTime,
            endTime
        };

        editingScheduleIndex = -1;

        document.getElementById(
            "addScheduleButton"
        ).textContent = "Add Schedule";
    }

    // ADD SCHEDULE
    else {

        const { data, error } =
            await supabase
                .from("class_schedules")
                .insert({
                    subject: subject,
                    schedule_date: scheduleDate,
                    start_time: startTime,
                    end_time: endTime,
                    user_id: currentUser.id
                })
                .select()
                .single();

        if (error) {

            alert(
                "Unable to add schedule: " +
                error.message
            );

            return;
        }


        schedules.push({
            id: data.id,
            subject: data.subject,
            scheduleDate: data.schedule_date,
            startTime: data.start_time,
            endTime: data.end_time,
            createdAt: data.created_at
        });
    }


    localStorage.setItem(
        "classSchedules",
        JSON.stringify(schedules)
    );


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

    renderWeekly();

    displaySavedSchedules();
}


// ============================================================
// SCHEDULE VIEWS
// ============================================================

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

    tabs.forEach(button => {
        button.classList.remove("active");
    });


    if (view === "calendar") {

        calendarView.style.display =
            "block";

        weeklyView.style.display =
            "none";

        tabs[0].classList.add("active");

        renderCalendar();

    } else {

        calendarView.style.display =
            "none";

        weeklyView.style.display =
            "block";

        tabs[1].classList.add("active");

        renderWeekly();
    }
}


// ============================================================
// CALENDAR
// ============================================================

function renderCalendar() {

    const grid =
        document.getElementById(
            "calendarGrid"
        );

    const title =
        document.getElementById(
            "calendarMonth"
        );

    if (!grid || !title) return;

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

    title.textContent =
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


    // EMPTY DAYS
    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "calendar-day empty";

        grid.appendChild(empty);
    }


    // DAYS
    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement("div");

        cell.className =
            "calendar-day";


        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        const todayString =
            formatDateInput(
                new Date()
            );


        if (dateString === todayString) {
            cell.classList.add("today");
        }


        const dayNumber =
            document.createElement("div");

        dayNumber.className =
            "day-number";

        dayNumber.textContent =
            day;

        cell.appendChild(dayNumber);


        const daySchedules =
            schedules.filter(
                schedule =>
                    schedule.scheduleDate ===
                    dateString
            );


        daySchedules.forEach(
            schedule => {

                const event =
                    document.createElement(
                        "div"
                    );

                event.className =
                    "calendar-event";

                event.textContent =
                    getSubjectCode(
                        schedule.subject
                    );


                event.onclick =
                    function (eventObject) {

                        eventObject.stopPropagation();

                        showScheduleDetails(
                            schedule
                        );
                    };


                cell.appendChild(event);
            }
        );


        cell.onclick =
            function () {

                selectedCalendarDate =
                    dateString;

                const selectedSchedules =
                    schedules.filter(
                        schedule =>
                            schedule.scheduleDate ===
                            dateString
                    );


                if (
                    selectedSchedules.length > 0
                ) {

                    showScheduleDetails(
                        selectedSchedules[0]
                    );

                } else {

                    showDateDetails(
                        dateString
                    );
                }
            };


        grid.appendChild(cell);
    }
}


// ============================================================
// CALENDAR MONTH CHANGE
// ============================================================

function changeMonth(direction) {

    calendarDate.setMonth(
        calendarDate.getMonth() +
        direction
    );

    renderCalendar();
}


// ============================================================
// SHOW SCHEDULE DETAILS
// ============================================================

function showScheduleDetails(schedule) {

    const details =
        document.getElementById(
            "scheduleDetails"
        );

    if (!details) return;


    details.innerHTML = `

        <div class="schedule-detail-card">

            <div class="detail-icon">
                📚
            </div>

            <h3>
                ${escapeHtml(schedule.subject)}
            </h3>

            <p>
                📅 ${formatDisplayDate(schedule.scheduleDate)}
            </p>

            <p>
                🕐 ${formatTime(schedule.startTime)}
                -
                ${formatTime(schedule.endTime)}
            </p>

            <div class="detail-actions">

                <button
                    onclick="editScheduleById(${schedule.id})"
                >
                    ✏️ Edit
                </button>

                <button
                    onclick="deleteScheduleById(${schedule.id})"
                >
                    🗑️ Delete
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// SHOW DATE DETAILS
// ============================================================

function showDateDetails(dateString) {

    const details =
        document.getElementById(
            "scheduleDetails"
        );

    if (!details) return;


    details.innerHTML = `

        <div class="empty-details">

            <div>📅</div>

            <h3>
                ${formatDisplayDate(dateString)}
            </h3>

            <p>
                No class scheduled for this date.
            </p>

        </div>
    `;
}


// ============================================================
// WEEKLY VIEW
// ============================================================

function renderWeekly() {

    const grid =
        document.getElementById(
            "weeklyGrid"
        );

    const title =
        document.getElementById(
            "weeklyTitle"
        );

    if (!grid || !title) return;

    grid.innerHTML = "";


    const current =
        new Date(weeklyDate);

    const day =
        current.getDay();


    const monday =
        new Date(current);

    monday.setDate(
        current.getDate() -
        (day === 0 ? 6 : day - 1)
    );

    monday.setHours(0, 0, 0, 0);


    const sunday =
        new Date(monday);

    sunday.setDate(
        monday.getDate() + 6
    );


    title.textContent =
        `${formatShortDate(monday)} - ${formatShortDate(sunday)}`;


    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];


    days.forEach(
        (dayName, index) => {

            const date =
                new Date(monday);

            date.setDate(
                monday.getDate() +
                index
            );


            const dateString =
                formatDateInput(date);


            const column =
                document.createElement(
                    "div"
                );

            column.className =
                "weekly-column";


            const header =
                document.createElement(
                    "div"
                );

            header.className =
                "weekly-day-header";

            header.innerHTML = `
                <strong>${dayName}</strong>
                <span>${formatShortDate(date)}</span>
            `;


            column.appendChild(header);


            const daySchedules =
                schedules.filter(
                    schedule =>
                        schedule.scheduleDate ===
                        dateString
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

                column.appendChild(empty);

            } else {

                daySchedules.forEach(
                    schedule => {

                        const event =
                            document.createElement(
                                "div"
                            );

                        event.className =
                            "weekly-event";


                        event.innerHTML = `

                            <strong>
                                ${escapeHtml(
                                    getSubjectCode(
                                        schedule.subject
                                    )
                                )}
                            </strong>

                            <span>
                                ${formatTime(
                                    schedule.startTime
                                )}
                                -
                                ${formatTime(
                                    schedule.endTime
                                )}
                            </span>
                        `;


                        event.onclick =
                            function () {

                                showScheduleDetails(
                                    schedule
                                );

                                showScheduleView(
                                    "calendar"
                                );
                            };


                        column.appendChild(event);
                    }
                );
            }


            grid.appendChild(column);
        }
    );
}


// ============================================================
// CHANGE WEEK
// ============================================================

function changeWeek(direction) {

    weeklyDate.setDate(
        weeklyDate.getDate() +
        direction * 7
    );

    renderWeekly();
}


// ============================================================
// SAVED SCHEDULES
// ============================================================

function displaySavedSchedules() {

    const list =
        document.getElementById(
            "savedScheduleList"
        );

    if (!list) return;

    list.innerHTML = "";


    if (schedules.length === 0) {

        list.innerHTML = `
            <div class="empty-schedules">
                No saved class schedules yet.
            </div>
        `;

        return;
    }


    const sorted =
        [...schedules].sort(
            (a, b) => {

                const dateCompare =
                    a.scheduleDate.localeCompare(
                        b.scheduleDate
                    );

                if (dateCompare !== 0) {
                    return dateCompare;
                }

                return a.startTime.localeCompare(
                    b.startTime
                );
            }
        );


    sorted.forEach(schedule => {

        const actualIndex =
            schedules.indexOf(schedule);


        const item =
            document.createElement("div");

        item.className =
            "saved-schedule-item";


        item.innerHTML = `

            <div class="saved-schedule-info">

                <strong>
                    ${escapeHtml(
                        schedule.subject
                    )}
                </strong>

                <span>
                    📅 ${formatDisplayDate(
                        schedule.scheduleDate
                    )}
                </span>

                <span>
                    🕐 ${formatTime(
                        schedule.startTime
                    )}
                    -
                    ${formatTime(
                        schedule.endTime
                    )}
                </span>

            </div>

            <div class="saved-schedule-actions">

                <button
                    onclick="editSchedule(${actualIndex})"
                >
                    ✏️
                </button>

                <button
                    onclick="deleteSchedule(${actualIndex})"
                >
                    🗑️
                </button>

            </div>
        `;


        list.appendChild(item);
    });
}


// ============================================================
// EDIT SCHEDULE
// ============================================================

function editSchedule(index) {

    const schedule =
        schedules[index];

    if (!schedule) return;


    document.getElementById(
        "scheduleSubject"
    ).value =
        schedule.subject;

    document.getElementById(
        "scheduleDate"
    ).value =
        schedule.scheduleDate;

    document.getElementById(
        "startTime"
    ).value =
        schedule.startTime.slice(0, 5);

    document.getElementById(
        "endTime"
    ).value =
        schedule.endTime.slice(0, 5);


    editingScheduleIndex =
        index;


    document.getElementById(
        "addScheduleButton"
    ).textContent =
        "Save Changes";


    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}


// ============================================================
// EDIT SCHEDULE BY ID
// ============================================================

function editScheduleById(id) {

    const index =
        schedules.findIndex(
            schedule =>
                Number(schedule.id) === Number(id)
        );

    if (index === -1) return;

    editSchedule(index);
}


// ============================================================
// DELETE SCHEDULE
// ============================================================

async function deleteSchedule(index) {

    if (!currentUser) return;

    const schedule =
        schedules[index];

    if (!schedule) return;


    const confirmed =
        confirm(
            "Delete this class schedule?"
        );

    if (!confirmed) return;


    const supabase = getSupabase();

    if (!supabase) return;


    const { error } =
        await supabase
            .from("class_schedules")
            .delete()
            .eq("id", schedule.id)
            .eq("user_id", currentUser.id);


    if (error) {

        alert(
            "Unable to delete schedule: " +
            error.message
        );

        return;
    }


    schedules.splice(index, 1);


    localStorage.setItem(
        "classSchedules",
        JSON.stringify(schedules)
    );


    renderCalendar();

    renderWeekly();

    displaySavedSchedules();


    const details =
        document.getElementById(
            "scheduleDetails"
        );

    if (details) {

        details.innerHTML = `
            <div class="empty-details">
                <div>📅</div>
                <p>Select a class from the calendar to see details.</p>
            </div>
        `;
    }
}


// ============================================================
// DELETE SCHEDULE BY ID
// ============================================================

async function deleteScheduleById(id) {

    const index =
        schedules.findIndex(
            schedule =>
                Number(schedule.id) === Number(id)
        );

    if (index === -1) return;

    await deleteSchedule(index);
}


// ============================================================
// SUBJECT CODE
// ============================================================

function getSubjectCode(subject) {

    if (!subject) return "";

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


// ============================================================
// DATE HELPERS
// ============================================================

function parseLocalDate(dateString) {

    if (!dateString) {
        return new Date();
    }

    const parts =
        dateString.split("-");

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
}


function formatDateInput(date) {

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

    return `${year}-${month}-${day}`;
}


function formatDisplayDate(dateString) {

    if (!dateString) return "";

    const date =
        parseLocalDate(dateString);

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function formatShortDate(date) {

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );
}


// ============================================================
// TIME FORMAT
// ============================================================

function formatTime(timeString) {

    if (!timeString) return "";

    const parts =
        timeString.split(":");

    let hour =
        Number(parts[0]);

    const minute =
        parts[1] || "00";

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// COZY HEADER
// GREETING + LIVE TIME + DATE + RANDOM QUOTE
// ============================================================

function updateCozyHeader() {

    const now =
        new Date();


    const hour =
        now.getHours();


    let greeting =
        "Good Evening, Sir Eran 🌙";


    if (
        hour >= 5 &&
        hour < 12
    ) {

        greeting =
            "Good Morning, Sir Eran ☀️";

    } else if (
        hour >= 12 &&
        hour < 18
    ) {

        greeting =
            "Good Afternoon, Sir Eran 🌤️";
    }


    const greetingElement =
        document.getElementById(
            "greeting"
        );

    const timeElement =
        document.getElementById(
            "currentTime"
        );

    const dateElement =
        document.getElementById(
            "currentDate"
        );


    if (greetingElement) {

        greetingElement.textContent =
            greeting;
    }


    if (timeElement) {

        timeElement.textContent =
            now.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );
    }


    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            );
    }
}


// ============================================================
// MOTIVATIONAL QUOTES
// ============================================================

const motivationalQuotes = [

    "Small progress is still progress.",

    "One task at a time. You’ve got this.",

    "Keep going. Future you will thank you.",

    "Progress, not perfection.",

    "You don't have to finish everything today.",

    "A little effort every day adds up.",

    "Stay consistent. Your goals are worth it.",

    "Learn today. Improve tomorrow.",

    "Slow progress is still moving forward.",

    "You are doing better than you think.",

    "Keep showing up for yourself.",

    "Every completed task is one step forward.",

    "Your future self is counting on you.",

    "Focus on progress, not pressure.",

    "You can do hard things."
];


function setRandomMotivation() {

    const quoteElement =
        document.getElementById(
            "motivationQuote"
        );

    if (!quoteElement) return;


    const randomIndex =
        Math.floor(
            Math.random() *
            motivationalQuotes.length
        );


    quoteElement.textContent =
        "“" +
        motivationalQuotes[randomIndex] +
        "”";
}


// ============================================================
// INITIAL PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        updateCozyHeader();

        setRandomMotivation();

        // Update time every second
        setInterval(
            updateCozyHeader,
            1000
        );


        const supabase =
            getSupabase();


        if (!supabase) {

            createLoginScreen();

            return;
        }


        const {
            data: {
                session
            }
        } =
            await supabase.auth.getSession();


        if (session) {

            currentUser =
                session.user;

            await initializeTracker();

        } else {

            createLoginScreen();
        }


        // Auth state listener
        supabase.auth.onAuthStateChange(
            async (event, session) => {

                if (
                    event === "SIGNED_IN" &&
                    session
                ) {

                    currentUser =
                        session.user;

                    const loginScreen =
                        document.getElementById(
                            "loginScreen"
                        );

                    if (loginScreen) {
                        loginScreen.remove();
                    }

                    await initializeTracker();

                }


                if (
                    event === "SIGNED_OUT"
                ) {

                    currentUser = null;
                }
            }
        );

    }
);
