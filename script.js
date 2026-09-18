// ============================================================
// ERAN'S STUDY HUB
// ASSIGNMENTS + REMINDERS + CLASS SCHEDULE + SUMMARY
// SUPABASE CLOUD SYNC
// ============================================================

let currentUser = null;

let tasks = [];

let schedules = [];

let editingIndex = -1;

let editingScheduleIndex = -1;

let calendarDate = new Date();

let weeklyDate = new Date();

let summaryDate = new Date();

let selectedCalendarDate = null;


// ============================================================
// SUPABASE
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
// LOGIN
// ============================================================

function createLoginScreen() {

    if (document.getElementById("loginScreen")) {
        return;
    }

    const loginScreen =
        document.createElement("div");

    loginScreen.id =
        "loginScreen";

    loginScreen.innerHTML = `

        <div class="login-card">

            <h2>🎓 My School Tracker</h2>

            <p>
                Login to access your school tracker.
            </p>

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

    message.textContent =
        "Logging in...";

    const {
        data,
        error
    } =
        await supabase.auth.signInWithPassword({

            email,
            password

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


async function logoutUser() {

    const supabase =
        getSupabase();

    if (!supabase) return;

    await supabase.auth.signOut();

    currentUser = null;

    location.reload();
}


// ============================================================
// LOAD CLOUD DATA
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
        } =
            await supabase
                .from("assignments")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .order(
                    "due_date",
                    {
                        ascending: true
                    }
                );


        if (taskError) {

            console.error(
                "Assignment load error:",
                taskError
            );

        } else {

            tasks =
                (cloudTasks || []).map(task => ({

                    id:
                        task.id,

                    subject:
                        task.subject,

                    task:
                        task.task,

                    dueDate:
                        task.due_date,

                    priority:
                        task.priority,

                    completed:
                        task.completed,

                    type:
                        task.type || "task",

                    createdAt:
                        task.created_at

                }));
        }


        // ====================================================
        // CLASS SCHEDULES
        // ====================================================

        const {
            data: cloudSchedules,
            error: scheduleError
        } =
            await supabase
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
// INITIALIZE
// ============================================================

async function initializeTracker() {

    await loadCloudData();

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
        document.createElement("button");

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
// TASK / REMINDER TYPE SWITCH
// ============================================================

function showEntryType(type) {

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
            "taskTypeButton"
        );

    const reminderButton =
        document.getElementById(
            "reminderTypeButton"
        );


    if (type === "task") {

        taskForm.style.display =
            "flex";

        reminderForm.style.display =
            "none";

        taskButton.classList.add(
            "active"
        );

        reminderButton.classList.remove(
            "active"
        );

    } else {

        taskForm.style.display =
            "none";

        reminderForm.style.display =
            "flex";

        taskButton.classList.remove(
            "active"
        );

        reminderButton.classList.add(
            "active"
        );
    }
}


// ============================================================
// ADD TASK
// ============================================================

async function addTask() {

    if (!currentUser) {

        alert("Please login first.");

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
    // EDIT EXISTING TASK
    // ========================================================

    if (editingIndex !== -1) {

        const existingTask =
            tasks[editingIndex];

        const {
            error
        } =
            await supabase
                .from("assignments")
                .update({

                    subject,

                    task,

                    due_date:
                        dueDate,

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
                "task"

        };


        editingIndex =
            -1;


        document.getElementById(
            "addTaskButton"
        ).textContent =
            "Add Task";
    }


    // ========================================================
    // ADD NEW TASK
    // ========================================================

    else {

        const {
            data,
            error
        } =
            await supabase
                .from("assignments")
                .insert({

                    subject,

                    task,

                    due_date:
                        dueDate,

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
                data.completed,

            type:
                data.type || "task",

            createdAt:
                data.created_at

        });
    }


    saveTasksLocally();


    document.getElementById(
        "task"
    ).value = "";

    document.getElementById(
        "dueDate"
    ).value = "";


    displayTasks();

    updateProgress();

    renderSummaryCalendar();
}


// ============================================================
// ADD REMINDER
// ============================================================

async function addReminder() {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }

    const supabase =
        getSupabase();

    if (!supabase) return;


    const subject =
        document.getElementById(
            "reminderSubject"
        ).value;

    const reminder =
        document.getElementById(
            "reminderText"
        ).value.trim();

    const reminderDate =
        document.getElementById(
            "reminderDate"
        ).value;


    if (!reminder || !reminderDate) {

        alert(
            "Please enter the reminder and reminder date."
        );

        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("assignments")
            .insert({

                subject:
                    subject || null,

                task:
                    reminder,

                due_date:
                    reminderDate,

                priority:
                    "Low",

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
            data.subject,

        task:
            data.task,

        dueDate:
            data.due_date,

        priority:
            data.priority,

        completed:
            data.completed,

        type:
            data.type || "reminder",

        createdAt:
            data.created_at

    });


    saveTasksLocally();


    document.getElementById(
        "reminderText"
    ).value = "";

    document.getElementById(
        "reminderDate"
    ).value = "";


    displayTasks();

    updateProgress();

    renderSummaryCalendar();
}


// ============================================================
// LOCAL SAVE
// ============================================================

function saveTasksLocally() {

    localStorage.setItem(
        "schoolTasks",
        JSON.stringify(tasks)
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


    list.innerHTML = "";


    const typeFilter =
        document.getElementById(
            "typeFilter"
        )?.value || "All";


    const dateFilter =
        document.getElementById(
            "dateFilter"
        )?.value || "All";


    const specificDate =
        document.getElementById(
            "specificDate"
        )?.value || "";


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


    // TYPE FILTER

    if (typeFilter !== "All") {

        filteredTasks =
            filteredTasks.filter(
                item =>
                    (
                        item.type ||
                        "task"
                    ) === typeFilter
            );
    }


    // DATE FILTER

    if (dateFilter === "Today") {

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


    else if (dateFilter === "Next7") {

        const sevenDays =
            new Date(today);

        sevenDays.setDate(
            sevenDays.getDate() + 7
        );


        filteredTasks =
            filteredTasks.filter(
                item => {

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


    else if (dateFilter === "Overdue") {

        filteredTasks =
            filteredTasks.filter(
                item => {

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
        dateFilter === "Specific" &&
        specificDate
    ) {

        filteredTasks =
            filteredTasks.filter(
                item =>
                    item.dueDate ===
                    specificDate
            );
    }


    filteredTasks.sort(
        (a, b) => {

            const dateDifference =
                parseLocalDate(
                    a.dueDate
                ) -
                parseLocalDate(
                    b.dueDate
                );

            if (
                dateDifference !== 0
            ) {
                return dateDifference;
            }

            return (
                String(a.task)
                    .localeCompare(
                        String(b.task)
                    )
            );
        }
    );


    // EMPTY

    if (
        filteredTasks.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-task-list">

                ${
                    typeFilter === "reminder"
                        ? "🔔 No reminders found."
                        : typeFilter === "task"
                            ? "📝 No deadlines found."
                            : "📋 No tasks or reminders found."
                }

            </div>
        `;

    }


    // ITEMS

    filteredTasks.forEach(item => {

        const actualIndex =
            tasks.indexOf(item);


        const li =
            document.createElement(
                "div"
            );


        const type =
            item.type ||
            "task";


        const priority =
            item.priority ||
            "Low";


        const priorityClass =
            priority
                .toLowerCase()
                .replace(
                    " ",
                    "-"
                );


        li.className =
            "task-item " +
            (
                item.completed
                    ? "completed "
                    : ""
            ) +
            "priority-" +
            priorityClass;


        const typeBadge =
            type === "reminder"

                ? `
                    <span
                        class="task-type-badge reminder"
                    >
                        🔔 REMINDER
                    </span>
                  `

                : `
                    <span
                        class="task-type-badge deadline"
                    >
                        📝 DEADLINE
                    </span>
                  `;


        const priorityBadge =
            type === "task"

                ? `
                    <span
                        class="priority-badge ${priorityClass}"
                    >
                        ${getPriorityIcon(priority)}
                        ${escapeHtml(priority)}
                    </span>
                  `

                : "";


        const subjectHTML =
            item.subject

                ? `
                    <small>
                        📚 ${escapeHtml(
                            item.subject
                        )}
                    </small>
                  `

                : "";


        li.innerHTML = `

            <div class="task-info">

                <div class="task-title-row">

                    ${typeBadge}

                    <strong>
                        ${escapeHtml(
                            item.task
                        )}
                    </strong>

                </div>

                ${subjectHTML}

                <small>
                    📅 ${formatDisplayDate(
                        item.dueDate
                    )}
                </small>

                ${priorityBadge}

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


        list.appendChild(li);

    });


    const counter =
        document.getElementById(
            "taskCounter"
        );


    if (counter) {

        counter.textContent =
            filteredTasks.length +
            (
                filteredTasks.length === 1
                    ? " Item"
                    : " Items"
            );
    }


    updateProgress();
}


// ============================================================
// PRIORITY ICON
// ============================================================

function getPriorityIcon(priority) {

    if (priority === "Urgent") {
        return "🔴";
    }

    if (priority === "High") {
        return "🟠";
    }

    if (priority === "Medium") {
        return "🟡";
    }

    return "🟢";
}


// ============================================================
// DATE FILTER
// ============================================================

function handleDateFilter() {

    const filter =
        document.getElementById(
            "dateFilter"
        ).value;

    const specificGroup =
        document.getElementById(
            "specificDateGroup"
        );

    const specificDate =
        document.getElementById(
            "specificDate"
        );


    if (filter === "Specific") {

        specificGroup.style.display =
            "block";

    } else {

        specificGroup.style.display =
            "none";

        specificDate.value =
            "";
    }


    displayTasks();
}


// ============================================================
// TOGGLE TASK / REMINDER
// ============================================================

async function toggleTask(index) {

    if (!currentUser) return;

    const supabase =
        getSupabase();

    if (!supabase) return;


    const task =
        tasks[index];

    if (!task) return;


    const newStatus =
        !task.completed;


    const {
        error
    } =
        await supabase
            .from("assignments")
            .update({

                completed:
                    newStatus

            })
            .eq(
                "id",
                task.id
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


    task.completed =
        newStatus;


    saveTasksLocally();


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


    const type =
        item.type ||
        "task";


    if (type === "reminder") {

        showEntryType(
            "reminder"
        );


        document.getElementById(
            "reminderSubject"
        ).value =
            item.subject || "";


        document.getElementById(
            "reminderText"
        ).value =
            item.task;


        document.getElementById(
            "reminderDate"
        ).value =
            item.dueDate;


        alert(
            "Reminder editing will create a replacement when you save. Delete the old reminder after saving if needed."
        );


        return;
    }


    showEntryType(
        "task"
    );


    document.getElementById(
        "subject"
    ).value =
        item.subject;


    document.getElementById(
        "task"
    ).value =
        item.task;


    document.getElementById(
        "dueDate"
    ).value =
        item.dueDate;


    document.getElementById(
        "priority"
    ).value =
        item.priority;


    editingIndex =
        index;


    document.getElementById(
        "addTaskButton"
    ).textContent =
        "Save Changes";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


// ============================================================
// DELETE TASK / REMINDER
// ============================================================

async function deleteTask(index) {

    if (!currentUser) return;


    const task =
        tasks[index];

    if (!task) return;


    const itemName =
        task.type === "reminder"
            ? "reminder"
            : "assignment";


    const confirmed =
        confirm(
            `Delete this ${itemName}?`
        );


    if (!confirmed) return;


    const supabase =
        getSupabase();

    if (!supabase) return;


    const {
        data: deletedRows,
        error
    } =
        await supabase
            .from("assignments")
            .delete()
            .eq(
                "id",
                task.id
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
        deletedRows.length === 0
    ) {

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


    saveTasksLocally();


    displayTasks();

    updateProgress();

    renderSummaryCalendar();
}


// ============================================================
// PROGRESS
// ============================================================

function updateProgress() {

    // Reminders are intentionally excluded
    // from assignment completion progress.

    const assignmentTasks =
        tasks.filter(
            item =>
                (
                    item.type ||
                    "task"
                ) === "task"
        );


    const total =
        assignmentTasks.length;


    const completed =
        assignmentTasks.filter(
            task =>
                task.completed
        ).length;


    const pending =
        total - completed;


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
            percentage + "%";
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
                formatTime(value);


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
// ADD SCHEDULE
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
        startTime >= endTime
    ) {

        alert(
            "End time must be later than start time."
        );

        return;
    }


    if (
        editingScheduleIndex !== -1
    ) {

        const existing =
            schedules[
                editingScheduleIndex
            ];


        const {
            error
        } =
            await supabase
                .from(
                    "class_schedules"
                )
                .update({

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


    else {

        const {
            data,
            error
        } =
            await supabase
                .from(
                    "class_schedules"
                )
                .insert({

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

    renderSummaryCalendar();
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

        button.classList.remove(
            "active"
        );

    });


    if (view === "calendar") {

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

    }

    else {

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
// SCHEDULE COLORS
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
                    startCompare !== 0
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


    title.textContent =
        calendarDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
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


        if (
            dateString ===
            formatDateInput(
                new Date()
            )
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
                            startCompare !== 0
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
                    "calendar-event " +
                    getScheduleColorClass(
                        schedule,
                        daySchedules
                    );


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


function changeMonth(direction) {

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
// WEEKLY
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
                                startCompare !== 0
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


                        event.className =
                            "weekly-event " +
                            getScheduleColorClass(
                                schedule,
                                daySchedules
                            );


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


    const count =
        document.getElementById(
            "scheduleCount"
        );


    if (count) {

        count.textContent =
            schedules.length;
    }


    if (
        schedules.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-schedules">

                📅 No saved class schedules yet.

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
                    dateCompare !== 0
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


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


function editScheduleById(id) {

    const index =
        schedules.findIndex(
            schedule =>
                Number(
                    schedule.id
                ) ===
                Number(id)
        );


    if (
        index === -1
    ) return;


    editSchedule(
        index
    );
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


    const supabase =
        getSupabase();

    if (!supabase) return;


    const {
        data: deletedRows,
        error
    } =
        await supabase
            .from(
                "class_schedules"
            )
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
        deletedRows.length === 0
    ) {

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


async function deleteScheduleById(id) {

    const index =
        schedules.findIndex(
            schedule =>
                Number(
                    schedule.id
                ) ===
                Number(id)
        );


    if (
        index === -1
    ) return;


    await deleteSchedule(
        index
    );
}


// ============================================================
// SUBJECT HELPERS
// ============================================================

function getSubjectCode(subject) {

    if (!subject) return "";


    const dashIndex =
        subject.indexOf(
            " - "
        );


    if (
        dashIndex !== -1
    ) {

        return subject.substring(
            0,
            dashIndex
        );
    }


    return subject;
}


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
                📊 Summary
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

                        <h3 id="summaryCalendarMonth">
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

                    <div class="summary-empty-details">

                        <div>📅</div>

                        <p>
                            Hover over a subject
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


    grid.innerHTML = "";


    const year =
        summaryDate.getFullYear();

    const month =
        summaryDate.getMonth();


    title.textContent =
        summaryDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
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


        if (
            dateString ===
            formatDateInput(
                new Date()
            )
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


        // SCHEDULES

        const daySchedules =
            schedules
                .filter(
                    schedule =>
                        schedule.scheduleDate ===
                        dateString
                )
                .sort(
                    (a, b) =>
                        a.startTime.localeCompare(
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


        // TASKS + REMINDERS

        const dayTasks =
            tasks.filter(
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


                const isReminder =
                    (
                        task.type ||
                        "task"
                    ) ===
                    "reminder";


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
                    isReminder
                        ? "🔔 " +
                          (
                              task.subject
                                  ? getSubjectCode(
                                        task.subject
                                    )
                                  : "Reminder"
                          )
                        : getSubjectCode(
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

                        if (isReminder) {

                            showSummaryReminderDetails(
                                dateString,
                                task
                            );

                        } else {

                            showSummarySubjectDetails(

                                dateString,

                                getSubjectCode(
                                    task.subject
                                )

                            );
                        }

                    }
                );


                event.title =
                    isReminder
                        ? `Reminder: ${task.task}`
                        : `Assignment: ${task.task}`;


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
        tasks.filter(
            task =>
                task.dueDate ===
                dateString
        );


    if (
        dateSchedules.length === 0 &&
        dateTasks.length === 0
    ) {

        details.innerHTML = `

            <div class="summary-empty-details">

                <div>📅</div>

                <h3>
                    ${formatDisplayDate(
                        dateString
                    )}
                </h3>

                <p>
                    No classes, deadlines,
                    or reminders for this date.
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
        dateSchedules.length > 0
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

                        🕐
                        ${formatTime(
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


    const reminders =
        dateTasks.filter(
            task =>
                (
                    task.type ||
                    "task"
                ) === "reminder"
        );


    const deadlines =
        dateTasks.filter(
            task =>
                (
                    task.type ||
                    "task"
                ) === "task"
        );


    if (
        deadlines.length > 0
    ) {

        html += `

            <div class="summary-detail-item">

                <strong>
                    📝 Assignment Deadline
                </strong>

            </div>
        `;


        deadlines.forEach(
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
                        ${getPriorityIcon(
                            task.priority
                        )}
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


    if (
        reminders.length > 0
    ) {

        html += `

            <div class="summary-detail-item">

                <strong>
                    🔔 Reminders
                </strong>

            </div>
        `;


        reminders.forEach(
            reminder => {

                html += `

                    <div class="summary-detail-item">

                        <strong>
                            🔔 Reminder
                        </strong>

                        <br>

                        ${escapeHtml(
                            reminder.task
                        )}

                        ${
                            reminder.subject
                                ? `<br><br>📚 ${escapeHtml(
                                    reminder.subject
                                  )}`
                                : ""
                        }

                        ${
                            reminder.completed
                                ? "<br><br>✅ Done"
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
        tasks.filter(
            task =>
                task.dueDate ===
                    dateString &&
                getSubjectCode(
                    task.subject
                ) ===
                    subjectCode &&
                (
                    task.type ||
                    "task"
                ) ===
                    "task"
        );


    let fullSubjectName =
        subjectCode;


    if (
        dateSchedules.length > 0
    ) {

        fullSubjectName =
            dateSchedules[0].subject;

    } else if (
        dateTasks.length > 0
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
        dateSchedules.length > 0
    ) {

        dateSchedules.forEach(
            schedule => {

                html += `

                    <div class="summary-detail-item">

                        <strong>
                            📚 Class Schedule
                        </strong>

                        <br><br>

                        🕐
                        ${formatTime(
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
        dateTasks.length > 0
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
                        ${getPriorityIcon(
                            task.priority
                        )}
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
// SUMMARY REMINDER DETAILS
// ============================================================

function showSummaryReminderDetails(
    dateString,
    reminder
) {

    const details =
        document.getElementById(
            "summaryDetails"
        );


    if (!details) return;


    details.innerHTML = `

        <div class="summary-detail-subject">

            🔔 Reminder

        </div>


        <div class="summary-detail-item">

            <strong>
                ${escapeHtml(
                    reminder.task
                )}
            </strong>

            <br><br>

            📅 ${formatDisplayDate(
                dateString
            )}

            ${
                reminder.subject
                    ? `<br><br>📚 ${escapeHtml(
                        reminder.subject
                      )}`
                    : ""
            }

            <br><br>

            ${
                reminder.completed
                    ? "✅ Completed"
                    : "⏳ Pending"
            }

        </div>
    `;
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

        Number(parts[0]),

        Number(parts[1]) - 1,

        Number(parts[2])

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

    if (!dateString) return "";


    const date =
        parseLocalDate(
            dateString
        );


    return date.toLocaleDateString(
        "en-US",
        {

            month: "short",

            day: "numeric",

            year: "numeric"

        }
    );
}


function formatShortDate(
    date
) {

    return date.toLocaleDateString(
        "en-US",
        {

            month: "short",

            day: "numeric"

        }
    );
}


// ============================================================
// TIME
// ============================================================

function formatTime(
    timeString
) {

    if (!timeString) return "";


    const parts =
        timeString.split(":");


    let hour =
        Number(parts[0]);


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
// ESCAPE HTML
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
// HEADER
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

    }

    else if (
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
// MOTIVATION
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

        }

        else {

            createLoginScreen();
        }


        supabase.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

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

                    currentUser =
                        null;
                }

            }
        );

    }
);


// ============================================================
// PWA
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
                    function(error) {

                        console.error(
                            "PWA Service Worker registration failed:",
                            error
                        );

                    }
                );
        }
    );
}
