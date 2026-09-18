// ============================================================
// MY SCHOOL TRACKER
// ASSIGNMENTS + REMINDERS + CLASS SCHEDULE + SUMMARY
// SUPABASE CLOUD SYNC
// ============================================================

let currentUser = null;

let tasks = [];
let schedules = [];

let editingIndex = -1;
let editingScheduleIndex = -1;

let assignmentMode = "task";

let calendarDate = new Date();
let weeklyDate = new Date();
let summaryDate = new Date();

let selectedCalendarDate = null;


// ============================================================
// SUPABASE CHECK
// ============================================================

function getSupabase() {

    if (!window.supabaseClient) {

        alert(
            "Supabase is not connected. Please check supabase-config.js."
        );

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

    const loginScreen =
        document.createElement("div");

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

    const email =
        document.getElementById("loginEmail")
        .value
        .trim();

    const password =
        document.getElementById("loginPassword")
        .value;

    const message =
        document.getElementById("loginMessage");

    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        return;
    }

    message.textContent = "Logging in...";

    const {
        data,
        error
    } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {

        message.textContent =
            error.message;

        return;
    }

    currentUser =
        data.user;

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

    const supabase =
        getSupabase();

    if (!supabase) return;

    await supabase.auth.signOut();

    currentUser = null;

    location.reload();
}


// ============================================================
// NORMALIZE ITEM TYPE
// ============================================================

function getItemType(item) {

    if (!item) {
        return "Task";
    }

    const type =
        String(
            item.itemType ||
            item.type ||
            ""
        )
        .trim()
        .toLowerCase();

    if (
        type === "reminder" ||
        type === "reminders"
    ) {
        return "Reminder";
    }

    return "Task";
}


// ============================================================
// LOAD CLOUD DATA
// SUPABASE IS THE SOURCE OF TRUTH
// TASKS + REMINDERS ARE CLOUD SYNCED
// ============================================================

async function loadCloudData() {

    const supabase =
        getSupabase();

    if (!supabase || !currentUser) return;

    try {

        // ====================================================
        // ASSIGNMENTS + REMINDERS
        // ====================================================

        const {
            data: cloudTasks,
            error: taskError
        } = await supabase
            .from("assignments")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "due_date",
                {
                    ascending: true,
                    nullsFirst: false
                }
            );

        if (taskError) {

            console.error(
                "Assignment load error:",
                taskError
            );

        } else {

            tasks =
                (cloudTasks || []).map(item => ({

                    id:
                        item.id,

                    subject:
                        item.subject || "",

                    task:
                        item.task || "",

                    dueDate:
                        item.due_date || null,

                    priority:
                        item.priority || null,

                    completed:
                        Boolean(
                            item.completed
                        ),

                    type:
                        getItemType(item),

                    itemType:
                        getItemType(item),

                    createdAt:
                        item.created_at,

                    localOnly:
                        false

                }));
        }


        // ====================================================
        // CLASS SCHEDULES
        // ====================================================

        const {
            data: cloudSchedules,
            error: scheduleError
        } = await supabase
            .from("class_schedules")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "schedule_date",
                {
                    ascending: true
                }
            );

        if (scheduleError) {

            console.error(
                "Schedule load error:",
                scheduleError
            );

        } else {

            schedules =
                (cloudSchedules || []).map(
                    schedule => ({

                        id:
                            schedule.id,

                        subject:
                            schedule.subject,

                        scheduleDate:
                            schedule.schedule_date,

                        startTime:
                            schedule.start_time,

                        endTime:
                            schedule.end_time,

                        createdAt:
                            schedule.created_at

                    })
                );
        }


        // ====================================================
        // UPDATE LOCAL CACHE
        // ====================================================

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

    setAssignmentMode("task");

    displayTasks();

    populateTimeDropdowns();

    renderCalendar();

    renderWeekly();

    displaySavedSchedules();

    renderSummaryCalendar();

    updateProgress();

    addLogoutButton();
}


// ============================================================
// LOGOUT BUTTON
// ============================================================

function addLogoutButton() {

    if (
        document.getElementById(
            "logoutButton"
        )
    ) {
        return;
    }

    const button =
        document.createElement(
            "button"
        );

    button.id =
        "logoutButton";

    button.textContent =
        "Logout";

    button.onclick =
        logoutUser;

    button.style.marginTop =
        "15px";

    const container =
        document.querySelector(
            ".container"
        );

    if (container) {
        container.appendChild(
            button
        );
    }
}


// ============================================================
// MAIN TABS
// ============================================================

function showMainTab(tab) {

    const assignmentsTab =
        document.getElementById(
            "assignmentsTab"
        );

    const scheduleTab =
        document.getElementById(
            "scheduleTab"
        );

    const summaryTab =
        document.getElementById(
            "summaryTab"
        );

    const tabs =
        document.querySelectorAll(
            ".main-tab"
        );

    tabs.forEach(button => {

        button.classList.remove(
            "active"
        );

    });


    if (tab === "assignments") {

        assignmentsTab.style.display =
            "block";

        scheduleTab.style.display =
            "none";

        if (summaryTab) {
            summaryTab.style.display =
                "none";
        }

        if (tabs[0]) {
            tabs[0].classList.add(
                "active"
            );
        }

        displayTasks();
    }


    else if (tab === "schedule") {

        assignmentsTab.style.display =
            "none";

        scheduleTab.style.display =
            "block";

        if (summaryTab) {
            summaryTab.style.display =
                "none";
        }

        if (tabs[1]) {
            tabs[1].classList.add(
                "active"
            );
        }

        renderCalendar();

        renderWeekly();

        displaySavedSchedules();
    }


    else if (tab === "summary") {

        assignmentsTab.style.display =
            "none";

        scheduleTab.style.display =
            "none";

        if (summaryTab) {
            summaryTab.style.display =
                "block";
        }

        if (tabs[2]) {
            tabs[2].classList.add(
                "active"
            );
        }

        renderSummaryCalendar();
    }
}


// ============================================================
// ASSIGNMENT MODE
// ============================================================

function setAssignmentMode(mode) {

    assignmentMode =
        mode;

    const taskForm =
        document.getElementById(
            "taskForm"
        );

    const reminderForm =
        document.getElementById(
            "reminderForm"
        );

    const taskButton =
        document.getElementById(
            "taskModeButton"
        );

    const reminderButton =
        document.getElementById(
            "reminderModeButton"
        );

    const title =
        document.getElementById(
            "assignmentFormTitle"
        );

    const subtitle =
        document.getElementById(
            "assignmentFormSubtitle"
        );


    if (mode === "task") {

        if (taskForm) {
            taskForm.style.display =
                "block";
        }

        if (reminderForm) {
            reminderForm.style.display =
                "none";
        }

        if (taskButton) {
            taskButton.classList.add(
                "active"
            );
        }

        if (reminderButton) {
            reminderButton.classList.remove(
                "active"
            );
        }

        if (title) {
            title.textContent =
                editingIndex !== -1
                    ? "Edit Task"
                    : "Add New Task";
        }

        if (subtitle) {
            subtitle.textContent =
                "Add a school deadline or activity.";
        }

    } else {

        if (taskForm) {
            taskForm.style.display =
                "none";
        }

        if (reminderForm) {
            reminderForm.style.display =
                "block";
        }

        if (taskButton) {
            taskButton.classList.remove(
                "active"
            );
        }

        if (reminderButton) {
            reminderButton.classList.add(
                "active"
            );
        }

        if (title) {
            title.textContent =
                editingIndex !== -1
                    ? "Edit Reminder"
                    : "Add Reminder";
        }

        if (subtitle) {
            subtitle.textContent =
                "Keep a simple checklist of things you need to remember.";
        }
    }
}


// ============================================================
// ADD TASK / UPDATE TASK
// ============================================================

async function addTask() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }

    const supabase =
        getSupabase();

    if (!supabase) return;


    const subject =
        document.getElementById(
            "subject"
        ).value;

    const task =
        document.getElementById(
            "task"
        ).value.trim();

    const dueDate =
        document.getElementById(
            "dueDate"
        ).value;

    const priority =
        document.getElementById(
            "priority"
        ).value;


    if (!task || !dueDate) {

        alert(
            "Please enter the topic and due date."
        );

        return;
    }


    // ========================================================
    // EDIT EXISTING ITEM
    // ========================================================

    if (editingIndex !== -1) {

        const existingTask =
            tasks[editingIndex];

        if (!existingTask) {

            editingIndex =
                -1;

            return;
        }


        const {
            error
        } = await supabase
            .from("assignments")
            .update({

                subject:
                    subject,

                task:
                    task,

                due_date:
                    dueDate,

                priority:
                    priority,

                type:
                    "task"

            })
            .eq(
                "id",
                existingTask.id
            )
            .eq(
                "user_id",
                currentUser.id
            );


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

            priority,

            type:
                "Task",

            itemType:
                "Task",

            localOnly:
                false

        };


        editingIndex =
            -1;


        localStorage.setItem(
            "schoolTasks",
            JSON.stringify(tasks)
        );


        resetAssignmentForm();

        displayTasks();

        updateProgress();

        renderSummaryCalendar();

        return;
    }


    // ========================================================
    // ADD NEW TASK
    // ========================================================

    const {
        data,
        error
    } = await supabase
        .from("assignments")
        .insert({

            subject:
                subject,

            task:
                task,

            due_date:
                dueDate,

            priority:
                priority,

            completed:
                false,

            type:
                "task",

            user_id:
                currentUser.id

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

        id:
            data.id,

        subject:
            data.subject,

        task:
            data.task,

        dueDate:
            data.due_date,

        priority:
            data.priority,

        completed:
            Boolean(
                data.completed
            ),

        type:
            getItemType(data),

        itemType:
            getItemType(data),

        createdAt:
            data.created_at,

        localOnly:
            false

    });


    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );


    resetAssignmentForm();

    displayTasks();

    updateProgress();

    renderSummaryCalendar();
}


// ============================================================
// ADD REMINDER / UPDATE REMINDER
// SUPABASE CLOUD SYNC
// NO DATE
// NO ALARM
// ============================================================

async function addReminder() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const supabase =
        getSupabase();

    if (!supabase) return;


    const reminderText =
        document.getElementById(
            "reminderText"
        ).value.trim();

    const reminderSubject =
        document.getElementById(
            "reminderSubject"
        ).value.trim();


    if (!reminderText) {

        alert(
            "Please enter a reminder."
        );

        return;
    }


    // ========================================================
    // EDIT EXISTING REMINDER
    // ========================================================

    if (editingIndex !== -1) {

        const existing =
            tasks[editingIndex];

        if (!existing) {

            editingIndex =
                -1;

            return;
        }


        const {
            error
        } = await supabase
            .from("assignments")
            .update({

                subject:
                    reminderSubject,

                task:
                    reminderText,

                due_date:
                    null,

                priority:
                    null,

                type:
                    "reminder"

            })
            .eq(
                "id",
                existing.id
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            alert(
                "Unable to update reminder: " +
                error.message
            );

            return;
        }


        tasks[editingIndex] = {

            ...existing,

            subject:
                reminderSubject,

            task:
                reminderText,

            dueDate:
                null,

            priority:
                null,

            type:
                "Reminder",

            itemType:
                "Reminder",

            localOnly:
                false

        };


        editingIndex =
            -1;


        localStorage.setItem(
            "schoolTasks",
            JSON.stringify(tasks)
        );


        resetAssignmentForm();

        displayTasks();

        return;
    }


    // ========================================================
    // ADD NEW REMINDER
    // ========================================================

    const {
        data,
        error
    } = await supabase
        .from("assignments")
        .insert({

            subject:
                reminderSubject,

            task:
                reminderText,

            due_date:
                null,

            priority:
                null,

            completed:
                false,

            type:
                "reminder",

            user_id:
                currentUser.id

        })
        .select()
        .single();


    if (error) {

        alert(
            "Unable to add reminder: " +
            error.message
        );

        return;
    }


    tasks.push({

        id:
            data.id,

        subject:
            data.subject || "",

        task:
            data.task || "",

        dueDate:
            data.due_date || null,

        priority:
            data.priority || null,

        completed:
            Boolean(
                data.completed
            ),

        type:
            "Reminder",

        itemType:
            "Reminder",

        createdAt:
            data.created_at,

        localOnly:
            false

    });


    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );


    resetAssignmentForm();

    displayTasks();
}


// ============================================================
// RESET ASSIGNMENT FORM
// ============================================================

function resetAssignmentForm() {

    editingIndex =
        -1;

    const subject =
        document.getElementById(
            "subject"
        );

    const task =
        document.getElementById(
            "task"
        );

    const dueDate =
        document.getElementById(
            "dueDate"
        );

    const priority =
        document.getElementById(
            "priority"
        );

    const reminderText =
        document.getElementById(
            "reminderText"
        );

    const reminderSubject =
        document.getElementById(
            "reminderSubject"
        );

    const addTaskButton =
        document.getElementById(
            "addTaskButton"
        );

    const cancelButton =
        document.getElementById(
            "cancelAssignmentEditButton"
        );


    if (subject) {
        subject.selectedIndex =
            0;
    }

    if (task) {
        task.value =
            "";
    }

    if (dueDate) {
        dueDate.value =
            "";
    }

    if (priority) {
        priority.value =
            "Medium";
    }

    if (reminderText) {
        reminderText.value =
            "";
    }

    if (reminderSubject) {
        reminderSubject.value =
            "";
    }

    if (addTaskButton) {
        addTaskButton.textContent =
            "Add Task";
    }


    const addReminderButton =
        document.getElementById(
            "addReminderButton"
        );

    if (addReminderButton) {
        addReminderButton.textContent =
            "🔔 Add Reminder";
    }


    if (cancelButton) {
        cancelButton.style.display =
            "none";
    }


    setAssignmentMode(
        assignmentMode
    );
}


// ============================================================
// CANCEL ASSIGNMENT EDIT
// ============================================================

function cancelAssignmentEdit() {

    resetAssignmentForm();

    setAssignmentMode(
        "task"
    );
}


// ============================================================
// DISPLAY TASKS + REMINDERS
// ============================================================

function displayTasks() {

    const list =
        document.getElementById(
            "taskList"
        );

    if (!list) return;

    list.innerHTML =
        "";


    const emptyMessage =
        document.getElementById(
            "emptyTaskList"
        );


    const typeFilterElement =
        document.getElementById(
            "typeFilter"
        );

    const typeFilter =
        typeFilterElement
            ? typeFilterElement.value
            : "All";


    const dateFilterElement =
        document.getElementById(
            "dateFilter"
        );

    const dateFilter =
        dateFilterElement
            ? dateFilterElement.value
            : "All";


    const specificDateElement =
        document.getElementById(
            "specificDate"
        );

    const specificDate =
        specificDateElement
            ? specificDateElement.value
            : "";


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    let filteredTasks =
        [...tasks];


    // ========================================================
    // TYPE FILTER
    // ========================================================

    if (typeFilter === "Task") {

        filteredTasks =
            filteredTasks.filter(
                item =>
                    getItemType(item) ===
                    "Task"
            );
    }


    else if (
        typeFilter === "Reminder"
    ) {

        filteredTasks =
            filteredTasks.filter(
                item =>
                    getItemType(item) ===
                    "Reminder"
            );
    }


    // ========================================================
    // DATE FILTER
    // Reminders have no date.
    // ========================================================

    if (
        dateFilter ===
        "Today"
    ) {

        const todayString =
            formatDateInput(
                today
            );

        filteredTasks =
            filteredTasks.filter(
                item =>
                    item.dueDate ===
                    todayString
            );
    }


    else if (
        dateFilter ===
        "Next7"
    ) {

        const sevenDays =
            new Date(
                today
            );

        sevenDays.setDate(
            sevenDays.getDate() +
            7
        );


        filteredTasks =
            filteredTasks.filter(
                item => {

                    if (!item.dueDate) {
                        return false;
                    }

                    const due =
                        parseLocalDate(
                            item.dueDate
                        );

                    return (
                        due >= today &&
                        due <= sevenDays
                    );

                }
            );
    }


    else if (
        dateFilter ===
        "Overdue"
    ) {

        filteredTasks =
            filteredTasks.filter(
                item => {

                    if (!item.dueDate) {
                        return false;
                    }

                    const due =
                        parseLocalDate(
                            item.dueDate
                        );

                    return (
                        due < today &&
                        !item.completed
                    );

                }
            );
    }


    else if (
        dateFilter ===
        "Specific" &&
        specificDate
    ) {

        filteredTasks =
            filteredTasks.filter(
                item =>
                    item.dueDate ===
                    specificDate
            );
    }


    // ========================================================
    // SORT
    // Reminders without date go after dated tasks.
    // ========================================================

    filteredTasks.sort(
        (a, b) => {

            if (
                !a.dueDate &&
                !b.dueDate
            ) {
                return 0;
            }

            if (!a.dueDate) {
                return 1;
            }

            if (!b.dueDate) {
                return -1;
            }

            return (
                parseLocalDate(
                    a.dueDate
                ) -
                parseLocalDate(
                    b.dueDate
                )
            );
        }
    );


    // ========================================================
    // EMPTY STATE
    // ========================================================

    if (
        filteredTasks.length ===
        0
    ) {

        if (emptyMessage) {
            emptyMessage.style.display =
                "block";
        }

    } else {

        if (emptyMessage) {
            emptyMessage.style.display =
                "none";
        }
    }


    // ========================================================
    // DISPLAY
    // ========================================================

    filteredTasks.forEach(
        item => {

            const actualIndex =
                tasks.indexOf(
                    item
                );

            const itemType =
                getItemType(
                    item
                );

            const li =
                document.createElement(
                    "li"
                );


            if (
                item.completed
            ) {

                li.classList.add(
                    "completed"
                );
            }


            if (
                itemType ===
                "Reminder"
            ) {

                li.classList.add(
                    "reminder-item"
                );

            } else {

                li.classList.add(
                    "task-item"
                );
            }


            // ====================================================
            // REMINDER
            // ====================================================

            if (
                itemType ===
                "Reminder"
            ) {

                const subjectText =
                    item.subject
                        ? escapeHtml(
                            item.subject
                        )
                        : "Personal Reminder";


                li.innerHTML = `

                    <div class="task-info">

                        <div class="item-title-row">

                            <span class="item-type-badge reminder">
                                🔔 Reminder
                            </span>

                            <strong class="item-title">
                                ${escapeHtml(
                                    item.task
                                )}
                            </strong>

                        </div>

                        <div class="task-meta">
                            📚 ${subjectText}
                        </div>

                    </div>


                    <div class="task-actions">

                        <button
                            class="reminder-check-button"
                            onclick="toggleTask(${actualIndex})"
                            title="${
                                item.completed
                                    ? "Mark as not done"
                                    : "Mark as done"
                            }"
                        >
                            ${
                                item.completed
                                    ? "↩️"
                                    : "☐"
                            }
                        </button>

                        <button
                            onclick="editTask(${actualIndex})"
                            title="Edit"
                        >
                            ✏️
                        </button>

                        <button
                            onclick="deleteTask(${actualIndex})"
                            title="Delete"
                        >
                            🗑️
                        </button>

                    </div>

                `;

            }


            // ====================================================
            // TASK / DEADLINE
            // ====================================================

            else {

                const priorityClass =
                    getPriorityClass(
                        item.priority
                    );

                const priorityText =
                    getPriorityText(
                        item.priority
                    );


                li.innerHTML = `

                    <div class="task-info">

                        <div class="item-title-row">

                            <span class="item-type-badge task">
                                📝 Deadline
                            </span>

                            <strong class="item-title">
                                ${escapeHtml(
                                    item.task
                                )}
                            </strong>

                        </div>

                        <div class="task-meta">
                            📚 ${escapeHtml(
                                item.subject
                            )}
                        </div>

                        <div class="task-meta">
                            📅 ${formatDisplayDate(
                                item.dueDate
                            )}
                        </div>

                        <span
                            class="priority-badge ${priorityClass}"
                        >
                            ${priorityText}
                        </span>

                    </div>


                    <div class="task-actions">

                        <button
                            onclick="toggleTask(${actualIndex})"
                            title="${
                                item.completed
                                    ? "Mark as pending"
                                    : "Mark as completed"
                            }"
                        >
                            ${
                                item.completed
                                    ? "↩️"
                                    : "✅"
                            }
                        </button>

                        <button
                            onclick="editTask(${actualIndex})"
                            title="Edit"
                        >
                            ✏️
                        </button>

                        <button
                            onclick="deleteTask(${actualIndex})"
                            title="Delete"
                        >
                            🗑️
                        </button>

                    </div>

                `;
            }


            list.appendChild(
                li
            );

        }
    );


    const counter =
        document.getElementById(
            "taskCounter"
        );


    if (counter) {

        const count =
            filteredTasks.length;

        counter.textContent =
            count +
            (
                count === 1
                    ? " Item"
                    : " Items"
            );
    }


    updateProgress();
}


// ============================================================
// DATE FILTER
// ============================================================

function handleDateFilter() {

    const filter =
        document.getElementById(
            "dateFilter"
        ).value;

    const specificDate =
        document.getElementById(
            "specificDate"
        );


    if (
        filter ===
        "Specific"
    ) {

        specificDate.style.display =
            "block";

    } else {

        specificDate.style.display =
            "none";

        specificDate.value =
            "";
    }


    displayTasks();
}


// ============================================================
// TOGGLE TASK / REMINDER
// SUPABASE CLOUD SYNC
// ============================================================

async function toggleTask(index) {

    const item =
        tasks[index];

    if (!item) return;


    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const supabase =
        getSupabase();

    if (!supabase) return;


    const newStatus =
        !item.completed;


    const {
        error
    } = await supabase
        .from("assignments")
        .update({

            completed:
                newStatus

        })
        .eq(
            "id",
            item.id
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        alert(
            "Unable to update item: " +
            error.message
        );

        return;
    }


    item.completed =
        newStatus;


    item.localOnly =
        false;


    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );


    displayTasks();

    updateProgress();

    renderSummaryCalendar();
}


// ============================================================
// EDIT TASK / REMINDER
// ============================================================

function editTask(index) {

    const item =
        tasks[index];

    if (!item) return;


    editingIndex =
        index;


    const itemType =
        getItemType(
            item
        );


    const cancelButton =
        document.getElementById(
            "cancelAssignmentEditButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "block";
    }


    // ========================================================
    // EDIT REMINDER
    // ========================================================

    if (
        itemType ===
        "Reminder"
    ) {

        const reminderText =
            document.getElementById(
                "reminderText"
            );

        const reminderSubject =
            document.getElementById(
                "reminderSubject"
            );


        if (reminderText) {

            reminderText.value =
                item.task || "";
        }


        if (reminderSubject) {

            reminderSubject.value =
                item.subject || "";
        }


        setAssignmentMode(
            "reminder"
        );


        const addReminderButton =
            document.getElementById(
                "addReminderButton"
            );


        if (addReminderButton) {

            addReminderButton.textContent =
                "Save Reminder";
        }

    }


    // ========================================================
    // EDIT TASK
    // ========================================================

    else {

        document.getElementById(
            "subject"
        ).value =
            item.subject || "";


        document.getElementById(
            "task"
        ).value =
            item.task || "";


        document.getElementById(
            "dueDate"
        ).value =
            item.dueDate || "";


        document.getElementById(
            "priority"
        ).value =
            item.priority || "Medium";


        setAssignmentMode(
            "task"
        );


        document.getElementById(
            "addTaskButton"
        ).textContent =
            "Save Changes";
    }


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });
}


// ============================================================
// DELETE TASK / REMINDER
// SUPABASE CLOUD SYNC
// ============================================================

async function deleteTask(index) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const item =
        tasks[index];

    if (!item) return;


    const itemType =
        getItemType(
            item
        );


    const confirmed =
        confirm(
            itemType === "Reminder"
                ? "Delete this reminder?"
                : "Delete this assignment?"
        );


    if (!confirmed) return;


    const supabase =
        getSupabase();

    if (!supabase) return;


    const {
        data: deletedRows,
        error
    } = await supabase
        .from("assignments")
        .delete()
        .eq(
            "id",
            item.id
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .select("id");


    if (error) {

        console.error(
            "Assignment delete error:",
            error
        );

        alert(
            "Unable to delete item:\n\n" +
            error.message
        );

        return;
    }


    if (
        !deletedRows ||
        deletedRows.length ===
        0
    ) {

        console.error(
            "Assignment was not deleted from Supabase.",
            {

                itemId:
                    item.id,

                userId:
                    currentUser.id,

                deletedRows:
                    deletedRows

            }
        );


        alert(
            "The item was NOT deleted from the cloud.\n\n" +
            "Nothing was removed from the tracker."
        );

        return;
    }


    tasks.splice(
        index,
        1
    );


    if (
        editingIndex ===
        index
    ) {

        resetAssignmentForm();
    }


    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
    );


    displayTasks();

    updateProgress();

    renderSummaryCalendar();
}


// ============================================================
// PRIORITY
// ============================================================

function getPriorityClass(
    priority
) {

    const value =
        String(
            priority || ""
        )
        .toLowerCase();


    if (
        value ===
        "urgent"
    ) {

        return "priority-urgent";
    }


    if (
        value ===
        "high"
    ) {

        return "priority-high";
    }


    if (
        value ===
        "low"
    ) {

        return "priority-low";
    }


    return "priority-medium";
}


function getPriorityText(
    priority
) {

    const value =
        String(
            priority || "Medium"
        )
        .toLowerCase();


    if (
        value ===
        "urgent"
    ) {

        return "🔴 Urgent";
    }


    if (
        value ===
        "high"
    ) {

        return "🟠 High";
    }


    if (
        value ===
        "low"
    ) {

        return "🟢 Low";
    }


    return "🟡 Medium";
}


// ============================================================
// PROGRESS
// Only formal deadlines/tasks count.
// Reminders are separate checklists.
// ============================================================

function updateProgress() {

    const deadlineTasks =
        tasks.filter(
            item =>
                getItemType(item) ===
                "Task"
        );


    const total =
        deadlineTasks.length;


    const completed =
        deadlineTasks.filter(
            item =>
                item.completed
        ).length;


    const pending =
        total -
        completed;


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


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );


    const progressFill =
        document.getElementById(
            "progressFill"
        );

    const progressText =
        document.getElementById(
            "progressText"
        );


    if (progressFill) {

        progressFill.style.width =
            percentage +
            "%";
    }


    if (progressText) {

        progressText.textContent =
            percentage +
            "% Complete";
    }
}


// ============================================================
// TIME DROPDOWNS
// ============================================================

function populateTimeDropdowns() {

    const start =
        document.getElementById(
            "startTime"
        );

    const end =
        document.getElementById(
            "endTime"
        );


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
                formatTime(
                    value
                );


            const option1 =
                document.createElement(
                    "option"
                );


            option1.value =
                value;

            option1.textContent =
                label;


            start.appendChild(
                option1
            );


            const option2 =
                document.createElement(
                    "option"
                );


            option2.value =
                value;

            option2.textContent =
                label;


            end.appendChild(
                option2
            );
        }
    }
}


// ============================================================
// ADD / UPDATE CLASS SCHEDULE
// ============================================================

async function addSchedule() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const supabase =
        getSupabase();

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


    if (
        startTime >=
        endTime
    ) {

        alert(
            "End time must be later than start time."
        );

        return;
    }


    // ========================================================
    // EDIT
    // ========================================================

    if (
        editingScheduleIndex !==
        -1
    ) {

        const existing =
            schedules[
                editingScheduleIndex
            ];


        const {
            error
        } = await supabase
            .from("class_schedules")
            .update({

                subject:
                    subject,

                schedule_date:
                    scheduleDate,

                start_time:
                    startTime,

                end_time:
                    endTime

            })
            .eq(
                "id",
                existing.id
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            alert(
                "Unable to update schedule: " +
                error.message
            );

            return;
        }


        schedules[
            editingScheduleIndex
        ] = {

            ...existing,

            subject,

            scheduleDate,

            startTime,

            endTime

        };


        editingScheduleIndex =
            -1;


        document.getElementById(
            "addScheduleButton"
        ).textContent =
            "Add Schedule";
    }


    // ========================================================
    // ADD
    // ========================================================

    else {

        const {
            data,
            error
        } = await supabase
            .from("class_schedules")
            .insert({

                subject:
                    subject,

                schedule_date:
                    scheduleDate,

                start_time:
                    startTime,

                end_time:
                    endTime,

                user_id:
                    currentUser.id

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

            id:
                data.id,

            subject:
                data.subject,

            scheduleDate:
                data.schedule_date,

            startTime:
                data.start_time,

            endTime:
                data.end_time,

            createdAt:
                data.created_at

        });
    }


    localStorage.setItem(
        "classSchedules",
        JSON.stringify(
            schedules
        )
    );


    document.getElementById(
        "scheduleSubject"
    ).value =
        "";

    document.getElementById(
        "scheduleDate"
    ).value =
        "";

    document.getElementById(
        "startTime"
    ).value =
        "";

    document.getElementById(
        "endTime"
    ).value =
        "";


    renderCalendar();

    renderWeekly();

    displaySavedSchedules();

    renderSummaryCalendar();
}


// ============================================================
// SCHEDULE VIEWS
// ============================================================

function showScheduleView(
    view
) {

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


    tabs.forEach(
        button => {

            button.classList.remove(
                "active"
            );

        }
    );


    if (
        view ===
        "calendar"
    ) {

        calendarView.style.display =
            "block";

        weeklyView.style.display =
            "none";


        if (tabs[0]) {

            tabs[0].classList.add(
                "active"
            );
        }


        renderCalendar();

    } else {

        calendarView.style.display =
            "none";

        weeklyView.style.display =
            "block";


        if (tabs[1]) {

            tabs[1].classList.add(
                "active"
            );
        }


        renderWeekly();
    }
}


// ============================================================
// SCHEDULE COLOR ORDER
// ============================================================

function getScheduleColorClass(
    schedule,
    daySchedules
) {

    const sortedSchedules =
        [...daySchedules].sort(
            (a, b) => {

                const startCompare =
                    a.startTime.localeCompare(
                        b.startTime
                    );

                if (
                    startCompare !==
                    0
                ) {

                    return startCompare;
                }

                return a.endTime.localeCompare(
                    b.endTime
                );
            }
        );


    const index =
        sortedSchedules.findIndex(
            item =>
                Number(item.id) ===
                Number(schedule.id)
        );


    if (index === 0) {
        return "schedule-color-1";
    }

    if (index === 1) {
        return "schedule-color-2";
    }

    if (index === 2) {
        return "schedule-color-3";
    }

    return "schedule-color-4";
}


// ============================================================
// CLASS SCHEDULE CALENDAR
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


    grid.innerHTML =
        "";


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    title.textContent =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        );


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


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "calendar-day empty";

        grid.appendChild(
            empty
        );
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );

        cell.className =
            "calendar-day";


        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        const todayString =
            formatDateInput(
                new Date()
            );


        if (
            dateString ===
            todayString
        ) {

            cell.classList.add(
                "today"
            );
        }


        const dayNumber =
            document.createElement(
                "div"
            );


        dayNumber.className =
            "day-number";


        dayNumber.textContent =
            day;


        cell.appendChild(
            dayNumber
        );


        const daySchedules =
            schedules
                .filter(
                    schedule =>
                        schedule.scheduleDate ===
                        dateString
                )
                .sort(
                    (a, b) => {

                        const startCompare =
                            a.startTime.localeCompare(
                                b.startTime
                            );

                        if (
                            startCompare !==
                            0
                        ) {

                            return startCompare;
                        }

                        return a.endTime.localeCompare(
                            b.endTime
                        );
                    }
                );


        daySchedules.forEach(
            schedule => {

                const event =
                    document.createElement(
                        "div"
                    );


                const colorClass =
                    getScheduleColorClass(
                        schedule,
                        daySchedules
                    );


                event.className =
                    "calendar-event " +
                    colorClass;


                event.textContent =
                    getSubjectCode(
                        schedule.subject
                    );


                event.onclick =
                    function(
                        eventObject
                    ) {

                        eventObject.stopPropagation();

                        showScheduleDetails(
                            schedule
                        );
                    };


                cell.appendChild(
                    event
                );
            }
        );


        cell.onclick =
            function() {

                selectedCalendarDate =
                    dateString;


                const selectedSchedules =
                    schedules.filter(
                        schedule =>
                            schedule.scheduleDate ===
                            dateString
                    );


                if (
                    selectedSchedules.length >
                    0
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


        grid.appendChild(
            cell
        );
    }
}


function changeMonth(
    direction
) {

    calendarDate.setMonth(
        calendarDate.getMonth() +
        direction
    );

    renderCalendar();
}


// ============================================================
// SCHEDULE DETAILS
// ============================================================

function showScheduleDetails(
    schedule
) {

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
                ${escapeHtml(
                    schedule.subject
                )}
            </h3>

            <p>
                📅 ${formatDisplayDate(
                    schedule.scheduleDate
                )}
            </p>

            <p>
                🕐 ${formatTime(
                    schedule.startTime
                )}
                -
                ${formatTime(
                    schedule.endTime
                )}
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


function showDateDetails(
    dateString
) {

    const details =
        document.getElementById(
            "scheduleDetails"
        );


    if (!details) return;


    details.innerHTML = `

        <div class="empty-details">

            <div>📅</div>

            <h3>
                ${formatDisplayDate(
                    dateString
                )}
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


    grid.innerHTML =
        "";


    const current =
        new Date(
            weeklyDate
        );


    const day =
        current.getDay();


    const monday =
        new Date(
            current
        );


    monday.setDate(
        current.getDate() -
        (
            day === 0
                ? 6
                : day - 1
        )
    );


    monday.setHours(
        0,
        0,
        0,
        0
    );


    const sunday =
        new Date(
            monday
        );


    sunday.setDate(
        monday.getDate() +
        6
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
        (
            dayName,
            index
        ) => {

            const date =
                new Date(
                    monday
                );


            date.setDate(
                monday.getDate() +
                index
            );


            const dateString =
                formatDateInput(
                    date
                );


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

                <strong>
                    ${dayName}
                </strong>

                <span>
                    ${formatShortDate(
                        date
                    )}
                </span>

            `;


            column.appendChild(
                header
            );


            const daySchedules =
                schedules
                    .filter(
                        schedule =>
                            schedule.scheduleDate ===
                            dateString
                    )
                    .sort(
                        (a, b) => {

                            const startCompare =
                                a.startTime.localeCompare(
                                    b.startTime
                                );

                            if (
                                startCompare !==
                                0
                            ) {

                                return startCompare;
                            }

                            return a.endTime.localeCompare(
                                b.endTime
                            );
                        }
                    );


            if (
                daySchedules.length ===
                0
            ) {

                const empty =
                    document.createElement(
                        "div"
                    );


                empty.className =
                    "weekly-empty";


                empty.textContent =
                    "No class";


                column.appendChild(
                    empty
                );

            } else {

                daySchedules.forEach(
                    schedule => {

                        const event =
                            document.createElement(
                                "div"
                            );


                        const colorClass =
                            getScheduleColorClass(
                                schedule,
                                daySchedules
                            );


                        event.className =
                            "weekly-event " +
                            colorClass;


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
                            function() {

                                showScheduleDetails(
                                    schedule
                                );

                                showScheduleView(
                                    "calendar"
                                );
                            };


                        column.appendChild(
                            event
                        );
                    }
                );
            }


            grid.appendChild(
                column
            );
        }
    );
}


function changeWeek(
    direction
) {

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


    list.innerHTML =
        "";


    const count =
        document.getElementById(
            "scheduleCount"
        );


    if (count) {

        count.textContent =
            schedules.length;
    }


    if (
        schedules.length ===
        0
    ) {

        list.innerHTML = `

            <div class="empty-schedules">

                📅

                <br><br>

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


                if (
                    dateCompare !==
                    0
                ) {

                    return dateCompare;
                }


                return a.startTime.localeCompare(
                    b.startTime
                );
            }
        );


    sorted.forEach(
        schedule => {

            const actualIndex =
                schedules.indexOf(
                    schedule
                );


            const item =
                document.createElement(
                    "div"
                );


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
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        onclick="deleteSchedule(${actualIndex})"
                        title="Delete"
                    >
                        🗑️
                    </button>

                </div>

            `;


            list.appendChild(
                item
            );
        }
    );
}


// ============================================================
// EDIT SCHEDULE
// ============================================================

function editSchedule(
    index
) {

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
        schedule.startTime.slice(
            0,
            5
        );


    document.getElementById(
        "endTime"
    ).value =
        schedule.endTime.slice(
            0,
            5
        );


    editingScheduleIndex =
        index;


    document.getElementById(
        "addScheduleButton"
    ).textContent =
        "Save Changes";


    document.getElementById(
        "scheduleSubject"
    ).scrollIntoView({
        behavior:
            "smooth",

        block:
            "center"
    });
}


function editScheduleById(
    id
) {

    const index =
        schedules.findIndex(
            schedule =>
                Number(
                    schedule.id
                ) ===
                Number(
                    id
                )
        );


    if (
        index ===
        -1
    ) return;


    editSchedule(
        index
    );
}


// ============================================================
// DELETE SCHEDULE
// ============================================================

async function deleteSchedule(
    index
) {

    if (!currentUser) return;


    const schedule =
        schedules[index];


    if (!schedule) return;


    const confirmed =
        confirm(
            "Delete this class schedule?"
        );


    if (!confirmed) return;


    const supabase =
        getSupabase();


    if (!supabase) return;


    const {
        data: deletedRows,
        error
    } = await supabase
        .from("class_schedules")
        .delete()
        .eq(
            "id",
            schedule.id
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .select("id");


    if (error) {

        console.error(
            "Schedule delete error:",
            error
        );


        alert(
            "Unable to delete schedule:\n\n" +
            error.message
        );


        return;
    }


    if (
        !deletedRows ||
        deletedRows.length ===
        0
    ) {

        console.error(
            "Schedule was not deleted from Supabase.",
            {

                scheduleId:
                    schedule.id,

                userId:
                    currentUser.id,

                deletedRows:
                    deletedRows

            }
        );


        alert(
            "The class schedule was NOT deleted from the cloud.\n\n" +
            "Nothing was removed from the tracker."
        );


        return;
    }


    schedules.splice(
        index,
        1
    );


    localStorage.setItem(
        "classSchedules",
        JSON.stringify(
            schedules
        )
    );


    renderCalendar();

    renderWeekly();

    displaySavedSchedules();

    renderSummaryCalendar();


    const details =
        document.getElementById(
            "scheduleDetails"
        );


    if (details) {

        details.innerHTML = `

            <div class="empty-details">

                <div>📅</div>

                <p>
                    Select a class from the calendar
                    to see details.
                </p>

            </div>

        `;
    }
}


async function deleteScheduleById(
    id
) {

    const index =
        schedules.findIndex(
            schedule =>
                Number(
                    schedule.id
                ) ===
                Number(
                    id
                )
        );


    if (
        index ===
        -1
    ) return;


    await deleteSchedule(
        index
    );
}


// ============================================================
// SUBJECT CODE
// ============================================================

function getSubjectCode(
    subject
) {

    if (!subject) return "";


    const dashIndex =
        subject.indexOf(
            " - "
        );


    if (
        dashIndex !==
        -1
    ) {

        return subject.substring(
            0,
            dashIndex
        );
    }


    return subject;
}


// ============================================================
// SUBJECT COLOR SYSTEM
// ============================================================

const subjectColors = {

    "CHEM 001":
        "subject-color-1",

    "MATH 003":
        "subject-color-2",

    "CMPE 011":
        "subject-color-3",

    "CWTS 001":
        "subject-color-4",

    "GEED 004":
        "subject-color-5",

    "GEED 032":
        "subject-color-6",

    "INEN 101":
        "subject-color-7",

    "PATHFIT 1":
        "subject-color-8"

};


function getSubjectColorClass(
    subject
) {

    const code =
        getSubjectCode(
            subject
        );


    return (
        subjectColors[code] ||
        "subject-color-default"
    );
}


// ============================================================
// SUMMARY
// Only formal Tasks / Deadlines appear.
// Reminders remain checklist-only.
// ============================================================

function getDeadlineTasks() {

    return tasks.filter(
        item =>
            getItemType(item) ===
            "Task"
    );
}


// ============================================================
// SUMMARY CALENDAR
// ============================================================

function renderSummaryCalendar() {

    const summaryTab =
        document.getElementById(
            "summaryTab"
        );


    if (!summaryTab) return;


    let calendarLayout =
        document.getElementById(
            "summaryCalendarLayout"
        );


    if (!calendarLayout) {

        summaryTab.innerHTML = `

            <h2>
                📊 Monthly Summary
            </h2>

            <div
                id="summaryCalendarLayout"
                class="summary-calendar-layout"
            >

                <div class="summary-calendar-main">

                    <div class="summary-calendar-header">

                        <button
                            onclick="changeSummaryMonth(-1)"
                        >
                            ◀
                        </button>

                        <h3
                            id="summaryCalendarMonth"
                        >
                            Month
                        </h3>

                        <button
                            onclick="changeSummaryMonth(1)"
                        >
                            ▶
                        </button>

                    </div>


                    <div class="summary-calendar-weekdays">

                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>

                    </div>


                    <div
                        id="summaryCalendarGrid"
                        class="summary-calendar-grid"
                    ></div>


                    <div class="summary-legend">

                        <div class="summary-legend-item">

                            <span
                                class="summary-legend-dot schedule"
                            ></span>

                            Class Schedule

                        </div>


                        <div class="summary-legend-item">

                            <span
                                class="summary-legend-dot assignment"
                            ></span>

                            Assignment Deadline

                        </div>

                    </div>

                </div>


                <div
                    id="summaryDetails"
                    class="summary-details"
                >

                    <div
                        class="summary-empty-details"
                    >

                        <div>📅</div>

                        <p>
                            Select a subject
                            to see its details.
                        </p>

                    </div>

                </div>

            </div>
        `;


        calendarLayout =
            document.getElementById(
                "summaryCalendarLayout"
            );
    }


    const grid =
        document.getElementById(
            "summaryCalendarGrid"
        );

    const title =
        document.getElementById(
            "summaryCalendarMonth"
        );


    if (!grid || !title) return;


    grid.innerHTML =
        "";


    const year =
        summaryDate.getFullYear();

    const month =
        summaryDate.getMonth();


    title.textContent =
        summaryDate.toLocaleDateString(
            "en-US",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        );


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


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "summary-calendar-day empty";


        grid.appendChild(
            empty
        );
    }


    const deadlineTasks =
        getDeadlineTasks();


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "summary-calendar-day";


        const todayString =
            formatDateInput(
                new Date()
            );


        if (
            dateString ===
            todayString
        ) {

            cell.classList.add(
                "today"
            );
        }


        const dateNumber =
            document.createElement(
                "div"
            );


        dateNumber.className =
            "summary-date-number";


        dateNumber.textContent =
            day;


        cell.appendChild(
            dateNumber
        );


        const daySchedules =
            schedules
                .filter(
                    schedule =>
                        schedule.scheduleDate ===
                        dateString
                )
                .sort(
                    (a, b) => {

                        const startCompare =
                            a.startTime.localeCompare(
                                b.startTime
                            );

                        if (
                            startCompare !==
                            0
                        ) {

                            return startCompare;
                        }

                        return a.endTime.localeCompare(
                            b.endTime
                        );
                    }
                );


        daySchedules.forEach(
            schedule => {

                const event =
                    document.createElement(
                        "div"
                    );


                event.className =
                    "summary-event schedule " +
                    getSubjectColorClass(
                        schedule.subject
                    );


                const dot =
                    document.createElement(
                        "span"
                    );


                dot.className =
                    "summary-event-dot";


                const label =
                    document.createElement(
                        "span"
                    );


                label.className =
                    "summary-event-label";


                label.textContent =
                    getSubjectCode(
                        schedule.subject
                    );


                event.appendChild(
                    dot
                );


                event.appendChild(
                    label
                );


                event.addEventListener(
                    "mouseenter",
                    function() {

                        showSummarySubjectDetails(
                            dateString,
                            getSubjectCode(
                                schedule.subject
                            )
                        );

                    }
                );


                event.title =
                    `${schedule.subject} • ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;


                cell.appendChild(
                    event
                );
            }
        );


        const dayTasks =
            deadlineTasks.filter(
                task =>
                    task.dueDate ===
                    dateString
            );


        dayTasks.forEach(
            task => {

                const event =
                    document.createElement(
                        "div"
                    );


                event.className =
                    "summary-event assignment " +
                    getSubjectColorClass(
                        task.subject
                    );


                const dot =
                    document.createElement(
                        "span"
                    );


                dot.className =
                    "summary-event-dot";


                const label =
                    document.createElement(
                        "span"
                    );


                label.className =
                    "summary-event-label";


                label.textContent =
                    getSubjectCode(
                        task.subject
                    );


                event.appendChild(
                    dot
                );


                event.appendChild(
                    label
                );


                event.addEventListener(
                    "mouseenter",
                    function() {

                        showSummarySubjectDetails(
                            dateString,
                            getSubjectCode(
                                task.subject
                            )
                        );

                    }
                );


                event.title =
                    `Assignment: ${task.task}`;


                cell.appendChild(
                    event
                );
            }
        );


        cell.onclick =
            function() {

                showSummaryDateDetails(
                    dateString
                );
            };


        grid.appendChild(
            cell
        );
    }
}


// ============================================================
// CHANGE SUMMARY MONTH
// ============================================================

function changeSummaryMonth(
    direction
) {

    summaryDate.setMonth(
        summaryDate.getMonth() +
        direction
    );

    renderSummaryCalendar();
}


// ============================================================
// SUMMARY DATE DETAILS
// ============================================================

function showSummaryDateDetails(
    dateString
) {

    const details =
        document.getElementById(
            "summaryDetails"
        );


    if (!details) return;


    const dateSchedules =
        schedules.filter(
            schedule =>
                schedule.scheduleDate ===
                dateString
        );


    const dateTasks =
        getDeadlineTasks().filter(
            task =>
                task.dueDate ===
                dateString
        );


    if (
        dateSchedules.length ===
        0 &&
        dateTasks.length ===
        0
    ) {

        details.innerHTML = `

            <div
                class="summary-empty-details"
            >

                <div>📅</div>

                <h3>
                    ${formatDisplayDate(
                        dateString
                    )}
                </h3>

                <p>
                    No classes or assignment
                    deadlines for this date.
                </p>

            </div>

        `;

        return;
    }


    let html = `

        <div class="summary-detail-subject">

            📅 ${formatDisplayDate(
                dateString
            )}

        </div>

    `;


    if (
        dateSchedules.length >
        0
    ) {

        html += `

            <div class="summary-detail-item">

                <strong>
                    📚 Class Schedule
                </strong>

            </div>

        `;


        dateSchedules.forEach(
            schedule => {

                html += `

                    <div class="summary-detail-item">

                        <strong>
                            ${escapeHtml(
                                getSubjectCode(
                                    schedule.subject
                                )
                            )}
                        </strong>

                        <br>

                        ${escapeHtml(
                            schedule.subject
                        )}

                        <br>

                        🕐 ${formatTime(
                            schedule.startTime
                        )}
                        -
                        ${formatTime(
                            schedule.endTime
                        )}

                    </div>

                `;
            }
        );
    }


    if (
        dateTasks.length >
        0
    ) {

        html += `

            <div class="summary-detail-item">

                <strong>
                    📝 Assignment Deadline
                </strong>

            </div>

        `;


        dateTasks.forEach(
            task => {

                html += `

                    <div class="summary-detail-item">

                        <strong>
                            ${escapeHtml(
                                getSubjectCode(
                                    task.subject
                                )
                            )}
                        </strong>

                        <br>

                        ${escapeHtml(
                            task.task
                        )}

                        <br>

                        Priority:
                        ${escapeHtml(
                            task.priority
                        )}

                        ${
                            task.completed
                                ? "<br>✅ Completed"
                                : "<br>⏳ Pending"
                        }

                    </div>

                `;
            }
        );
    }


    details.innerHTML =
        html;
}


// ============================================================
// SUMMARY SUBJECT DETAILS
// ============================================================

function showSummarySubjectDetails(
    dateString,
    subjectCode
) {

    const details =
        document.getElementById(
            "summaryDetails"
        );


    if (!details) return;


    const dateSchedules =
        schedules.filter(
            schedule =>
                schedule.scheduleDate ===
                dateString &&
                getSubjectCode(
                    schedule.subject
                ) ===
                subjectCode
        );


    const dateTasks =
        getDeadlineTasks().filter(
            task =>
                task.dueDate ===
                dateString &&
                getSubjectCode(
                    task.subject
                ) ===
                subjectCode
        );


    let fullSubjectName =
        subjectCode;


    if (
        dateSchedules.length >
        0
    ) {

        fullSubjectName =
            dateSchedules[0].subject;

    } else if (
        dateTasks.length >
        0
    ) {

        fullSubjectName =
            dateTasks[0].subject;
    }


    const colorClass =
        getSubjectColorClass(
            subjectCode
        );


    let html = `

        <div
            class="summary-detail-subject ${colorClass}"
        >

            📚 ${escapeHtml(
                subjectCode
            )}

        </div>


        <div class="summary-detail-item">

            <strong>
                ${escapeHtml(
                    fullSubjectName
                )}
            </strong>

            <br>

            📅 ${formatDisplayDate(
                dateString
            )}

        </div>

    `;


    if (
        dateSchedules.length >
        0
    ) {

        dateSchedules.forEach(
            schedule => {

                html += `

                    <div class="summary-detail-item">

                        <strong>
                            📚 Class Schedule
                        </strong>

                        <br><br>

                        🕐 ${formatTime(
                            schedule.startTime
                        )}
                        -
                        ${formatTime(
                            schedule.endTime
                        )}

                        <br><br>

                        💻 Online Class

                    </div>

                `;
            }
        );
    }


    if (
        dateTasks.length >
        0
    ) {

        dateTasks.forEach(
            task => {

                html += `

                    <div class="summary-detail-item">

                        <strong>
                            📝 Assignment
                        </strong>

                        <br><br>

                        ${escapeHtml(
                            task.task
                        )}

                        <br><br>

                        Priority:
                        ${escapeHtml(
                            task.priority
                        )}

                        ${
                            task.completed
                                ? "<br><br>✅ Completed"
                                : "<br><br>⏳ Pending"
                        }

                    </div>

                `;
            }
        );
    }


    details.innerHTML =
        html;
}


// ============================================================
// DATE HELPERS
// ============================================================

function parseLocalDate(
    dateString
) {

    if (!dateString) {
        return new Date();
    }


    const parts =
        dateString.split("-");


    return new Date(

        Number(
            parts[0]
        ),

        Number(
            parts[1]
        ) - 1,

        Number(
            parts[2]
        )

    );
}


function formatDateInput(
    date
) {

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


function formatDisplayDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        parseLocalDate(
            dateString
        );


    return date.toLocaleDateString(
        "en-US",
        {

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric"

        }
    );
}


function formatShortDate(
    date
) {

    return date.toLocaleDateString(
        "en-US",
        {

            month:
                "short",

            day:
                "numeric"

        }
    );
}


// ============================================================
// TIME FORMAT
// ============================================================

function formatTime(
    timeString
) {

    if (!timeString) {
        return "";
    }


    const parts =
        timeString.split(":");


    let hour =
        Number(
            parts[0]
        );


    const minute =
        parts[1] ||
        "00";


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `${hour}:${minute} ${suffix}`;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// COZY HEADER
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

                    hour:
                        "numeric",

                    minute:
                        "2-digit"

                }
            );
    }


    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "en-US",
                {

                    month:
                        "long",

                    day:
                        "numeric",

                    year:
                        "numeric"

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
        motivationalQuotes[
            randomIndex
        ] +
        "”";
}


// ============================================================
// INITIAL PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        updateCozyHeader();

        setRandomMotivation();


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


        supabase.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

                if (
                    event ===
                    "SIGNED_IN" &&
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
                    event ===
                    "SIGNED_OUT"
                ) {

                    currentUser =
                        null;
                }

            }
        );

    }
);


// ============================================================
// PWA SERVICE WORKER
// ============================================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )

                .then(
                    function(
                        registration
                    ) {

                        console.log(
                            "PWA Service Worker registered:",
                            registration.scope
                        );

                    }
                )

                .catch(
                    function(
                        error
                    ) {

                        console.error(
                            "PWA Service Worker registration failed:",
                            error
                        );

                    }
                );

        }
    );
}
