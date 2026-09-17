/* =========================================================
   SUPABASE AUTH + CLOUD SYNC
========================================================= */

let currentUser = null;

let tasks = [];
let schedules = [];

let editingIndex = -1;
let editingScheduleIndex = -1;

let calendarDate = new Date();
let weeklyDate = new Date();

let selectedCalendarDate = null;


/* =========================================================
   AUTH UI
========================================================= */

function createLoginScreen() {

    const loginScreen = document.createElement("div");

    loginScreen.id = "loginScreen";

    loginScreen.innerHTML = `

        <div style="
            position:fixed;
            inset:0;
            background:#081A2F;
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:99999;
            padding:20px;
            box-sizing:border-box;
        ">

            <div style="
                width:100%;
                max-width:420px;
                background:#122B4A;
                border-radius:20px;
                padding:32px;
                box-sizing:border-box;
                box-shadow:0 20px 50px rgba(0,0,0,.35);
                color:#F5F7FA;
            ">

                <div style="
                    text-align:center;
                    font-size:48px;
                    margin-bottom:10px;
                ">
                    📚
                </div>

                <h2 style="
                    text-align:center;
                    margin:0 0 8px;
                    font-size:28px;
                ">
                    My School Tracker
                </h2>

                <p style="
                    text-align:center;
                    margin:0 0 28px;
                    color:#AAB8C8;
                ">
                    Login to sync your school data
                </p>


                <label
                    for="loginEmail"
                    style="
                        display:block;
                        margin-bottom:7px;
                        font-weight:600;
                    "
                >
                    Email
                </label>

                <input
                    type="email"
                    id="loginEmail"
                    placeholder="Enter your email"
                    autocomplete="email"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:13px 14px;
                        margin-bottom:16px;
                        border-radius:10px;
                        border:1px solid #355574;
                        background:#0B2038;
                        color:#F5F7FA;
                        font-size:15px;
                    "
                >


                <label
                    for="loginPassword"
                    style="
                        display:block;
                        margin-bottom:7px;
                        font-weight:600;
                    "
                >
                    Password
                </label>

                <input
                    type="password"
                    id="loginPassword"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        padding:13px 14px;
                        margin-bottom:18px;
                        border-radius:10px;
                        border:1px solid #355574;
                        background:#0B2038;
                        color:#F5F7FA;
                        font-size:15px;
                    "
                >


                <button
                    id="loginButton"
                    onclick="loginUser()"
                    style="
                        width:100%;
                        padding:14px;
                        border:0;
                        border-radius:10px;
                        background:#5B9BD5;
                        color:white;
                        font-size:16px;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    Login
                </button>


                <p
                    id="loginMessage"
                    style="
                        text-align:center;
                        margin:16px 0 0;
                        min-height:20px;
                        color:#FFB4B4;
                        font-size:14px;
                    "
                ></p>

            </div>

        </div>
    `;

    document.body.appendChild(loginScreen);
}


function showLoginScreen() {

    let loginScreen =
        document.getElementById("loginScreen");

    if (!loginScreen) {
        createLoginScreen();
        loginScreen =
            document.getElementById("loginScreen");
    }

    loginScreen.style.display = "flex";
}


function hideLoginScreen() {

    const loginScreen =
        document.getElementById("loginScreen");

    if (loginScreen) {
        loginScreen.style.display = "none";
    }
}


function showLoginMessage(message) {

    const messageElement =
        document.getElementById("loginMessage");

    if (messageElement) {
        messageElement.textContent = message;
    }
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const loginButton =
        document.getElementById("loginButton");


    if (!email || !password) {

        showLoginMessage(
            "Please enter your email and password."
        );

        return;
    }


    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    showLoginMessage("");


    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });


    if (error) {

        console.error(error);

        showLoginMessage(
            error.message
        );

        loginButton.disabled = false;
        loginButton.textContent = "Login";

        return;
    }


    currentUser =
        data.user;


    await initializeCloudData();


    hideLoginScreen();

    showLogoutButton();
}


async function logoutUser() {

    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    await supabaseClient.auth.signOut();

    currentUser = null;

    tasks = [];
    schedules = [];

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.remove();
    }

    showLoginScreen();
}


/* =========================================================
   LOGOUT BUTTON
========================================================= */

function showLogoutButton() {

    if (
        document.getElementById("logoutButton")
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


    button.style.cssText = `
        position:fixed;
        top:18px;
        right:18px;
        z-index:9998;
        border:none;
        border-radius:10px;
        padding:9px 14px;
        background:#193A5D;
        color:#F5F7FA;
        cursor:pointer;
        font-weight:600;
        box-shadow:0 4px 15px rgba(0,0,0,.15);
    `;


    document.body.appendChild(button);
}


/* =========================================================
   CLOUD INITIALIZATION
========================================================= */

async function initializeCloudData() {

    if (!currentUser) {
        return;
    }


    try {

        const localTasks =
            JSON.parse(
                localStorage.getItem(
                    "schoolTasks"
                )
            ) || [];


        const localSchedules =
            JSON.parse(
                localStorage.getItem(
                    "classSchedules"
                )
            ) || [];


        /* =========================================
           LOAD CLOUD ASSIGNMENTS
        ========================================= */

        const {
            data: cloudTasks,
            error: taskError
        } =
            await supabaseClient
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
            throw taskError;
        }


        /* =========================================
           MIGRATE OLD LOCAL ASSIGNMENTS
           ONLY IF CLOUD IS EMPTY
        ========================================= */

        if (
            cloudTasks.length === 0 &&
            localTasks.length > 0
        ) {

            const rows =
                localTasks.map(
                    task => ({

                        user_id:
                            currentUser.id,

                        subject:
                            task.subject,

                        task:
                            task.task,

                        due_date:
                            task.dueDate,

                        priority:
                            task.priority,

                        completed:
                            Boolean(
                                task.completed
                            )

                    })
                );


            const {
                data: insertedTasks,
                error: insertTaskError
            } =
                await supabaseClient
                    .from("assignments")
                    .insert(rows)
                    .select();


            if (insertTaskError) {
                throw insertTaskError;
            }


            tasks =
                insertedTasks.map(
                    task => ({

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
                            task.completed

                    })
                );

        } else {

            tasks =
                cloudTasks.map(
                    task => ({

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
                            task.completed

                    })
                );
        }


        /* =========================================
           LOAD CLOUD SCHEDULES
        ========================================= */

        const {
            data: cloudSchedules,
            error: scheduleError
        } =
            await supabaseClient
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
            throw scheduleError;
        }


        /* =========================================
           MIGRATE OLD LOCAL SCHEDULES
           ONLY IF CLOUD IS EMPTY
        ========================================= */

        if (
            cloudSchedules.length === 0 &&
            localSchedules.length > 0
        ) {

            const rows =
                localSchedules.map(
                    schedule => ({

                        user_id:
                            currentUser.id,

                        subject:
                            schedule.subject,

                        schedule_date:
                            schedule.date,

                        start_time:
                            schedule.startTime,

                        end_time:
                            schedule.endTime

                    })
                );


            const {
                data: insertedSchedules,
                error: insertScheduleError
            } =
                await supabaseClient
                    .from("class_schedules")
                    .insert(rows)
                    .select();


            if (insertScheduleError) {
                throw insertScheduleError;
            }


            schedules =
                insertedSchedules.map(
                    schedule => ({

                        id:
                            schedule.id,

                        subject:
                            schedule.subject,

                        date:
                            schedule.schedule_date,

                        startTime:
                            schedule.start_time,

                        endTime:
                            schedule.end_time

                    })
                );

        } else {

            schedules =
                cloudSchedules.map(
                    schedule => ({

                        id:
                            schedule.id,

                        subject:
                            schedule.subject,

                        date:
                            schedule.schedule_date,

                        startTime:
                            schedule.start_time,

                        endTime:
                            schedule.end_time

                    })
                );
        }


        /* =========================================
           KEEP LOCAL STORAGE AS BACKUP CACHE
        ========================================= */

        localStorage.setItem(
            "schoolTasks",
            JSON.stringify(tasks)
        );


        localStorage.setItem(
            "classSchedules",
            JSON.stringify(schedules)
        );


        displayTasks();

        renderCalendar();

        renderWeeklySchedule();

        displaySavedSchedules();

    } catch (error) {

        console.error(
            "Cloud initialization error:",
            error
        );

        alert(
            "Unable to load your cloud data. Please check your internet connection and try again."
        );
    }
}


/* =========================================================
   MAIN TABS
========================================================= */

function showMainTab(tab) {

    const assignmentsTab =
        document.getElementById(
            "assignmentsTab"
        );

    const scheduleTab =
        document.getElementById(
            "scheduleTab"
        );

    const mainTabs =
        document.querySelectorAll(
            ".main-tab"
        );


    mainTabs.forEach(button => {

        button.classList.remove(
            "active"
        );

    });


    if (tab === "assignments") {

        assignmentsTab.style.display =
            "block";

        scheduleTab.style.display =
            "none";

        mainTabs[0].classList.add(
            "active"
        );

        displayTasks();

    } else {

        assignmentsTab.style.display =
            "none";

        scheduleTab.style.display =
            "block";

        mainTabs[1].classList.add(
            "active"
        );

        renderCalendar();

        renderWeeklySchedule();

        displaySavedSchedules();
    }
}


/* =========================================================
   ASSIGNMENT FUNCTIONS
========================================================= */

async function addTask() {

    if (!currentUser) {
        return;
    }


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


    if (
        !subject ||
        !task ||
        !dueDate
    ) {

        alert(
            "Please complete all assignment fields."
        );

        return;
    }


    const completed =
        editingIndex >= 0
            ? tasks[editingIndex].completed
            : false;


    try {

        if (editingIndex >= 0) {

            const existingTask =
                tasks[editingIndex];


            const {
                data,
                error
            } =
                await supabaseClient
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

                        completed:
                            completed

                    })
                    .eq(
                        "id",
                        existingTask.id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            tasks[editingIndex] = {

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
                    data.completed

            };


            editingIndex = -1;


            document.getElementById(
                "addTaskButton"
            ).textContent =
                "Add Task";

        } else {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("assignments")
                    .insert({

                        user_id:
                            currentUser.id,

                        subject:
                            subject,

                        task:
                            task,

                        due_date:
                            dueDate,

                        priority:
                            priority,

                        completed:
                            false

                    })
                    .select()
                    .single();


            if (error) {
                throw error;
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
                    data.completed

            });
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
        ).value =
            "Medium";


        displayTasks();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to save assignment. Please try again."
        );
    }
}


/* =========================================================
   DISPLAY TASKS
========================================================= */

function displayTasks() {

    const taskList =
        document.getElementById(
            "taskList"
        );

    const dateFilterElement =
        document.getElementById(
            "dateFilter"
        );

    const specificDateElement =
        document.getElementById(
            "specificDate"
        );


    if (
        !taskList ||
        !dateFilterElement
    ) {
        return;
    }


    const rawFilter =
        dateFilterElement.value;


    const filter =
        String(rawFilter)
            .trim()
            .toLowerCase();


    const specificDate =
        specificDateElement
            ? specificDateElement.value
            : "";


    taskList.innerHTML = "";


    let filteredTasks =
        tasks.filter(task => {

            if (
                filter === "all" ||
                filter === ""
            ) {

                return true;
            }


            if (
                filter === "today"
            ) {

                return (
                    task.dueDate ===
                    getTodayString()
                );
            }


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


                if (!task.dueDate) {
                    return false;
                }


                const taskDate =
                    new Date(
                        task.dueDate +
                        "T00:00:00"
                    );


                if (
                    isNaN(
                        taskDate.getTime()
                    )
                ) {
                    return false;
                }


                return (
                    taskDate >= today &&
                    taskDate <= endDate
                );
            }


            if (
                filter === "tomorrow"
            ) {

                return (
                    task.dueDate ===
                    getDateAfterDays(1)
                );
            }


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


                if (!task.dueDate) {
                    return false;
                }


                const taskDate =
                    new Date(
                        task.dueDate +
                        "T00:00:00"
                    );


                return (
                    taskDate < today
                );
            }


            if (
                filter === "specific"
            ) {

                return (
                    specificDate !== "" &&
                    task.dueDate ===
                    specificDate
                );
            }


            return false;
        });


    filteredTasks.sort(
        (a, b) =>
            a.dueDate.localeCompare(
                b.dueDate
            )
    );


    if (
        filteredTasks.length === 0
    ) {

        taskList.innerHTML = `

            <div class="empty-details">

                <div>📋</div>

                <p>
                    No assignments found.
                </p>

            </div>

        `;

    } else {

        filteredTasks.forEach(task => {

            const originalIndex =
                tasks.indexOf(task);


            const taskItem =
                document.createElement(
                    "div"
                );


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
                        ${escapeHtml(
                            task.subject
                        )}
                    </div>

                    <div class="task-name">
                        ${escapeHtml(
                            task.task
                        )}
                    </div>

                    <div class="task-due">
                        Due:
                        ${formatDate(
                            task.dueDate
                        )}
                    </div>

                </div>

                <span class="priority ${priorityClass}">
                    ${escapeHtml(
                        task.priority
                    )}
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

async function toggleTask(index) {

    if (!currentUser) {
        return;
    }


    const task =
        tasks[index];


    const newCompleted =
        !task.completed;


    try {

        const {
            error
        } =
            await supabaseClient
                .from("assignments")
                .update({
                    completed:
                        newCompleted
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
            throw error;
        }


        task.completed =
            newCompleted;


        saveTasks();

        displayTasks();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to update assignment."
        );
    }
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


async function deleteTask(index) {

    if (
        !confirm(
            "Delete this assignment?"
        )
    ) {
        return;
    }


    const task =
        tasks[index];


    try {

        const {
            error
        } =
            await supabaseClient
                .from("assignments")
                .delete()
                .eq(
                    "id",
                    task.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {
            throw error;
        }


        tasks.splice(
            index,
            1
        );


        saveTasks();

        displayTasks();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete assignment."
        );
    }
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
        String(
            filterElement.value
        )
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
        total -
        completed;


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

async function addSchedule() {

    if (!currentUser) {
        return;
    }


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


    try {

        if (
            editingScheduleIndex >= 0
        ) {

            const existingSchedule =
                schedules[
                    editingScheduleIndex
                ];


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "class_schedules"
                    )
                    .update({

                        subject:
                            subject,

                        schedule_date:
                            date,

                        start_time:
                            startTime,

                        end_time:
                            endTime

                    })
                    .eq(
                        "id",
                        existingSchedule.id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            schedules[
                editingScheduleIndex
            ] = {

                id:
                    data.id,

                subject:
                    data.subject,

                date:
                    data.schedule_date,

                startTime:
                    data.start_time,

                endTime:
                    data.end_time

            };


            editingScheduleIndex =
                -1;


            document.getElementById(
                "addScheduleButton"
            ).textContent =
                "Add Schedule";

        } else {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "class_schedules"
                    )
                    .insert({

                        user_id:
                            currentUser.id,

                        subject:
                            subject,

                        schedule_date:
                            date,

                        start_time:
                            startTime,

                        end_time:
                            endTime

                    })
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            schedules.push({

                id:
                    data.id,

                subject:
                    data.subject,

                date:
                    data.schedule_date,

                startTime:
                    data.start_time,

                endTime:
                    data.end_time

            });
        }


        saveSchedules();


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

    } catch (error) {

        console.error(error);

        alert(
            "Unable to save class schedule. Please try again."
        );
    }
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


async function deleteSchedule(index) {

    if (
        !confirm(
            "Delete this class schedule?"
        )
    ) {
        return;
    }


    const schedule =
        schedules[index];


    try {

        const {
            error
        } =
            await supabaseClient
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
                );


        if (error) {
            throw error;
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

    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete class schedule."
        );
    }
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

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        createLoginScreen();

        showLoginScreen();

        generateTimeOptions();


        try {

            const {
                data
            } =
                await supabaseClient.auth.getSession();


            if (
                data &&
                data.session &&
                data.session.user
            ) {

                currentUser =
                    data.session.user;


                await initializeCloudData();

                hideLoginScreen();

                showLogoutButton();
            }

        } catch (error) {

            console.error(
                "Session check error:",
                error
            );
        }
    }
);


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async function (
        event,
        session
    ) {

        if (
            event === "SIGNED_OUT"
        ) {

            currentUser = null;

            tasks = [];

            schedules = [];

            showLoginScreen();

            return;
        }


        if (
            event === "SIGNED_IN" &&
            session &&
            session.user
        ) {

            currentUser =
                session.user;
        }
    }
);
