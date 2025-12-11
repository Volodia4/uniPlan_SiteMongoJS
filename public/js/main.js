const API_BASE = '/api';
const USER_INFO_KEY = 'userInfo';

const loginModal = document.getElementById('login-modal');
const showLoginBtn = document.getElementById('show-login-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const welcomeMessage = document.getElementById('welcome-message');
const mainTabsContainer = document.getElementById('main-tabs');

const passwordInput = document.getElementById('login-password');
const togglePasswordBtn = document.getElementById('toggle-password-btn');

const teacherList = document.getElementById('teachers-list');
const teacherFormContainer = document.getElementById('teacher-form-container');
const teacherFilterContainer = document.getElementById('teacher-filter-controls');

const subjectList = document.getElementById('subjects-list');
const subjectFormContainer = document.getElementById('subject-form-container');
const subjectFilterContainer = document.getElementById('subject-filter-controls');

const groupList = document.getElementById('groups-list');
const groupFormContainer = document.getElementById('group-form-container');
const groupFilterContainer = document.getElementById('group-filter-controls');

const studentList = document.getElementById('students-list');
const studentFormContainer = document.getElementById('student-form-container');
const studentFilterContainer = document.getElementById('student-filter-controls');

const loadList = document.getElementById('load-list');
const loadFormContainer = document.getElementById('load-form-container');
const loadFilterContainer = document.getElementById('load-filter-controls');

const scheduleList = document.getElementById('schedule-list');
const scheduleFormContainer = document.getElementById('schedule-form-container');
const scheduleFilterContainer = document.getElementById('schedule-filter-controls');

const teacherMyScheduleContainer = document.getElementById('my-schedule-view');
const studentScheduleContainer = document.getElementById('student-schedule-view');

const timeOptions = ['9:00', '10:40', '12:30', '14:10', '16:00', '17:40'];
const dayOptions = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];

let currentSort = { column: null, direction: 'asc', data: [] };
let globalStats = {};


// ====================================
// 1. Управління Сесією та API
// ====================================

function getUserInfo() {
    const info = localStorage.getItem(USER_INFO_KEY);
    return info ? JSON.parse(info) : null;
}

async function sendData(endpoint, method, data = null) {
    const userInfo = getUserInfo();
    const token = userInfo ? userInfo.token : null;
    try {
        const fetchOptions = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (data) { fetchOptions.body = JSON.stringify(data); }
        if (token) { fetchOptions.headers['Authorization'] = `Bearer ${token}`; }

        const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
        if (response.status === 401 || response.status === 403) {
            if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                alert('Сесія закінчилася або недостатньо прав. Спробуйте увійти знову');
                handleLogout();
            }
        }
        let result = {};
        try { result = await response.json(); } catch (e) { }
        if (!response.ok) {
            throw new Error(result.message || response.statusText || 'Невідома помилка на сервері');
        }
        return result;
    } catch (error) {
        console.error('API error:', error);
        alert(`Помилка операції: ${error.message}`);
        return null;
    }
}

async function fetchData(endpoint) { return sendData(endpoint, 'GET'); }

function handleLoginModal(show = true) {
    if (show) {
        loginModal.classList.remove('hidden');
        document.getElementById('login-message').textContent = '';
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    } else {
        loginModal.classList.add('hidden');
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const msgElement = document.getElementById('login-message');
    msgElement.textContent = '';

    const result = await sendData('/auth/login', 'POST', { email, password });

    if (result) {
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(result));
        handleLoginModal(false);
        renderApp(result);
    } else {
        msgElement.textContent = 'Невірний email або пароль';
    }
}

async function handleGuestLogin() {
    const guestUser = { role: 'guest', token: null };
    await renderApp(guestUser);
}

function handleLogout() {
    localStorage.removeItem(USER_INFO_KEY);
    welcomeMessage.textContent = 'Ви увійшли як Гість';
    handleGuestLogin();
}


// ====================================
// 2. Рендеринг Додатку відповідно до Ролі
// ====================================

const ROLE_TABS = {
    admin: [
        { id: 'teachers', text: 'Викладачі' },
        { id: 'students', text: 'Студенти' },
        { id: 'subjects', text: 'Предмети' },
        { id: 'groups', text: 'Групи' },
        { id: 'load-distribution', text: 'Навантаження' },
        { id: 'schedule', text: 'Загальний Розклад' },
    ],

    teacher: [
        { id: 'teachers', text: 'Викладачі' },
        { id: 'students', text: 'Студенти' },
        { id: 'subjects', text: 'Предмети' },
        { id: 'groups', text: 'Групи' },
        { id: 'load-distribution', text: 'Навантаження' },
        { id: 'schedule', text: 'Загальний Розклад' },
        { id: 'my-schedule', text: 'Мій Розклад' },
    ],

    student: [
        { id: 'teachers', text: 'Викладачі' },
        { id: 'students', text: 'Студенти' },
        { id: 'subjects', text: 'Предмети' },
        { id: 'groups', text: 'Групи' },
        { id: 'load-distribution', text: 'Навантаження' },
        { id: 'schedule', text: 'Загальний Розклад' },
        { id: 'student-my-schedule', text: 'Мій Розклад' },
    ],

    guest: [
        { id: 'teachers', text: 'Викладачі' },
        { id: 'students', text: 'Студенти' },
        { id: 'subjects', text: 'Предмети' },
        { id: 'groups', text: 'Групи' },
        { id: 'schedule', text: 'Загальний Розклад' },
    ],
};

function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.removeEventListener('click', handleTabClick);
        button.addEventListener('click', handleTabClick);
    });
}

function handleTabClick(e) {
    const button = e.currentTarget;
    const tabId = button.getAttribute('data-tab');

    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    [teacherFormContainer, subjectFormContainer, groupFormContainer, loadFormContainer, scheduleFormContainer, studentFormContainer]
        .forEach(container => container && container.classList.add('hidden'));

    button.classList.add('active');
    const tabContent = document.getElementById(tabId);

    if (tabContent) {
        tabContent.classList.add('active');
    }

    currentSort = { column: null, direction: 'asc', data: [] };

    const fetchFunc = {
        'teachers': fetchAndRenderTeachers,
        'students': fetchAndRenderStudents,
        'subjects': fetchAndRenderSubjects,
        'groups': fetchAndRenderGroups,
        'load-distribution': fetchAndRenderLoad,
        'schedule': fetchAndRenderSchedule,
        'my-schedule': fetchAndRenderMySchedule,
        'student-my-schedule': fetchAndRenderStudentSchedule,
    }[tabId];

    if (fetchFunc) fetchFunc();
}

async function getEntityName(role, id) {
    let endpoint = '';
    if (role === 'teacher') {
        endpoint = `/teachers/${id}`;
    } else if (role === 'student') {
        endpoint = `/students/${id}`;
    } else {
        return null;
    }
    const entity = await fetchData(endpoint);
    return entity ? entity.fullName : null;
}

async function renderApp(userInfo) {
    mainApp.classList.remove('hidden');

    const isGuest = userInfo.role === 'guest';
    if (isGuest) { welcomeMessage.textContent = 'Ви увійшли як Гість'; }
    else {
        let fullName = null;
        if (userInfo.teacherId) { fullName = await getEntityName('teacher', userInfo.teacherId); }
        else if (userInfo.studentId) { fullName = await getEntityName('student', userInfo.studentId); }

        const nameToDisplay = fullName || userInfo.email;
        welcomeMessage.textContent = `Ласкаво просимо, ${nameToDisplay} (${userInfo.role.toUpperCase()})!`;
    }

    showLoginBtn.classList.toggle('hidden', !isGuest);
    logoutBtn.classList.toggle('hidden', isGuest);

    const tabs = ROLE_TABS[userInfo.role] || ROLE_TABS['guest'];
    mainTabsContainer.innerHTML = '';

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        const formContainer = content.querySelector('.form-container');
        if (formContainer) formContainer.classList.add('hidden');
    });

    tabs.forEach((tab, index) => {
        const button = document.createElement('button');
        button.className = `tab-button ${index === 0 ? 'active' : ''}`;
        button.setAttribute('data-tab', tab.id);
        button.textContent = tab.text;
        mainTabsContainer.appendChild(button);

        const tabContent = document.getElementById(tab.id);
        if (tabContent) {
            tabContent.classList.remove('active');

            if (index === 0) {
                tabContent.classList.add('active');
            }
        }
    });

    const isAdmin = userInfo.role === 'admin';
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.classList.toggle('hidden', !isAdmin);
    });

    setupTabs();
    const firstTabId = tabs[0].id;
    const fetchFunc = {
        'teachers': fetchAndRenderTeachers,
        'students': fetchAndRenderStudents,
        'subjects': fetchAndRenderSubjects,
        'groups': fetchAndRenderGroups,
        'load-distribution': fetchAndRenderLoad,
        'schedule': fetchAndRenderSchedule,
        'my-schedule': fetchAndRenderMySchedule,
        'student-my-schedule': fetchAndRenderStudentSchedule,
    }[firstTabId];

    if (fetchFunc) fetchFunc();
}


// ====================================
// 3. Сортування та Допоміжні функції
// ====================================

function sortData(data, column, direction) {
    return data.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (column.includes('.')) {
            const [key1, key2] = column.split('.');
            valA = a[key1] ? a[key1][key2] : '';
            valB = b[key1] ? b[key1][key2] : '';
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();

        if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
            return direction === 'asc' ? valA - valB : valB - valA;
        }

        return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
}

function setupSortHeaders(tableId, dataKey, renderFunc) {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.querySelectorAll('th[data-sort]').forEach(th => {
        const column = th.getAttribute('data-sort');

        if (!th.querySelector('.sort-icon')) {
            th.classList.add('sort-header');
            const icon = document.createElement('span');
            icon.className = 'sort-icon';
            th.appendChild(icon);
        }

        th.removeEventListener('click', th.listener);
        th.listener = () => {
            const newDirection = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';

            currentSort = { column, direction: newDirection, data: currentSort.data };

            table.querySelectorAll('th').forEach(t => t.classList.remove('asc', 'desc'));

            th.classList.add(newDirection);

            const sortedData = sortData([...currentSort.data], column, newDirection);
            renderFunc(sortedData, false);
        };
        th.addEventListener('click', th.listener);
    });
}

function createActionButton(text, className, onClick) {
    const btn = document.createElement('button');
    btn.className = `action-btn ${className}`;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
}

function createOption(id, text) {
    return `<option value="${id}">${text}</option>`;
}

const applyNumericFilter = (data, field, operator, value) => {
    if (!operator || isNaN(value)) return data;

    return data.filter(item => {
        const actualValue = item[field];
        if (operator === '=') return actualValue === value;
        if (operator === '>') return actualValue > value;
        if (operator === '<') return actualValue < value;
        return true;
    });
};


// ====================================
//          4. Викладачі
// ====================================

function createTeacherForm(teacher = {}) {
    const isEdit = teacher._id;
    teacherFormContainer.innerHTML = `
        <h3>${isEdit ? 'Редагувати' : 'Додати'} Викладача</h3>
        <form id="teacher-form">
            <input type="hidden" id="teacher-id" value="${teacher._id || ''}">
            <input type="text" id="teacher-fullName" placeholder="ПІБ" value="${teacher.fullName || ''}" required>
            <input type="text" id="teacher-position" placeholder="Посада" value="${teacher.position || ''}" required>
            <input type="text" id="teacher-department" placeholder="Кафедра" value="${teacher.department || ''}" required>
            <input type="email" id="teacher-email" placeholder="Email" value="${teacher.email || ''}" required>
            <input type="password" id="teacher-password" placeholder="Пароль" required>
            <input type="tel" id="teacher-phone" placeholder="Телефон (опціонально)" value="${teacher.phone || ''}">
            <button type="submit">${isEdit ? 'Зберегти зміни' : 'Створити'}</button>
            <button type="button" class="cancel-btn">Скасувати</button>
        </form>
    `;
    teacherFormContainer.classList.remove('hidden');

    document.getElementById('teacher-form').addEventListener('submit', handleTeacherSubmit);
    teacherFormContainer.querySelector('.cancel-btn').addEventListener('click', () => teacherFormContainer.classList.add('hidden'));
}

async function handleTeacherSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('teacher-id').value;
    const data = {
        fullName: document.getElementById('teacher-fullName').value,
        position: document.getElementById('teacher-position').value,
        department: document.getElementById('teacher-department').value,
        email: document.getElementById('teacher-email').value,
        password: document.getElementById('teacher-password').value,
        phone: document.getElementById('teacher-phone').value,
    };
    const endpoint = id ? `/teachers/${id}` : '/teachers';
    const method = id ? 'PUT' : 'POST';

    if (await sendData(endpoint, method, data)) {
        teacherFormContainer.classList.add('hidden');
        fetchAndRenderTeachers();
    }
}

function setupTeacherFilters(allData) {
    if (!teacherFilterContainer) return;

    teacherFilterContainer.innerHTML = `
        <label for="teacher-text-filter">Пошук (ПІБ, Кафедра, Посада):</label>
        <input type="text" id="teacher-text-filter" placeholder="Введіть текст..." style="min-width: 250px;">
    `;

    const applyFilters = () => {
        const query = document.getElementById('teacher-text-filter').value.toLowerCase();
        const filtered = allData.filter(t =>
            t.fullName.toLowerCase().includes(query) ||
            t.department.toLowerCase().includes(query) ||
            t.position.toLowerCase().includes(query)
        );
        currentSort.data = filtered;
        renderTeachers(filtered, false);
    };

    document.getElementById('teacher-text-filter').addEventListener('input', applyFilters);
}

function renderTeachers(teachers, isInitialRender = true) {
    teacherList.innerHTML = '';
    const userInfo = getUserInfo();
    const isAdmin = userInfo?.role === 'admin';
    const canSeeEmail = userInfo?.role !== 'guest';

    document.getElementById('add-teacher-btn').classList.toggle('hidden', !isAdmin);

    if (isInitialRender) {
        currentSort.data = teachers;
        setupTeacherFilters(teachers);
        setupSortHeaders('teachers-table', 'teachers', renderTeachers);
    }

    if (!teachers || teachers.length === 0) {
        teacherList.innerHTML = '<tr><td colspan="6">Викладачів не знайдено</td></tr>';
        return;
    }

    teachers.forEach(teacher => {
        const row = teacherList.insertRow();
        row.insertCell().textContent = teacher.fullName;
        row.insertCell().textContent = teacher.position;
        row.insertCell().textContent = teacher.department;
        row.insertCell().textContent = teacher.phone || '---';
        row.insertCell().textContent = canSeeEmail && teacher.email ? teacher.email : '---';

        const actionsCell = row.insertCell();
        if (isAdmin) {
            const editBtn = createActionButton('Редагувати', 'edit-btn', () => createTeacherForm(teacher));
            const deleteBtn = createActionButton('Видалити', 'delete-btn', () => deleteTeacher(teacher._id));
            actionsCell.append(editBtn, deleteBtn);
        } else {
            actionsCell.textContent = '---';
        }
    });
}

async function fetchAndRenderTeachers() {
    const teachers = await fetchData('/teachers');
    if (teachers) renderTeachers(teachers, true);
}

async function deleteTeacher(id) {
    if (confirm('Ви впевнені, що хочете видалити цього викладача?')) {
        if (await sendData(`/teachers/${id}`, 'DELETE')) {
            fetchAndRenderTeachers();
        }
    }
}


// ====================================
//           5. Студенти
// ====================================

async function createStudentForm(student = {}) {
    const isEdit = student._id;
    const groups = await fetchData('/groups');
    const groupOptions = groups ? groups.map(g => createOption(g._id, `${g.name} (${g.course} курс)`)).join('') : '';

    if (!groups || groups.length === 0) {
        alert('Неможливо додати студента: Спершу створіть Групи');
        return;
    }

    studentFormContainer.innerHTML = `
        <h3>${isEdit ? 'Редагувати' : 'Додати'} Студента</h3>
        <form id="student-form">
            <input type="hidden" id="student-id" value="${student._id || ''}">
            <input type="text" id="student-fullName" placeholder="ПІБ Студента" value="${student.fullName || ''}" required>
            <input type="text" id="student-studentID" placeholder="Номер заліковки" value="${student.studentID || ''}" required>
            <input type="email" id="student-email" placeholder="Email" value="${student.email || ''}" required>
            <input type="password" id="student-password" placeholder="Пароль" required>
            <label>Група:</label>
            <select id="student-group" required>
                <option value="">-- Оберіть Групу --</option>
                ${groupOptions}
            </select>
            <button type="submit">${isEdit ? 'Зберегти зміни' : 'Створити'}</button>
            <button type="button" class="cancel-btn">Скасувати</button>
        </form>
    `;
    studentFormContainer.classList.remove('hidden');

    if (isEdit) {
        document.getElementById('student-group').value = student.group?._id || student.group;
    }

    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);
    studentFormContainer.querySelector('.cancel-btn').addEventListener('click', () => studentFormContainer.classList.add('hidden'));
}

async function handleStudentSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('student-id').value;
    const data = {
        fullName: document.getElementById('student-fullName').value,
        studentID: document.getElementById('student-studentID').value,
        email: document.getElementById('student-email').value,
        password: document.getElementById('student-password').value,
        group: document.getElementById('student-group').value,
    };

    const endpoint = id ? `/students/${id}` : '/students';
    const method = id ? 'PUT' : 'POST';

    if (await sendData(endpoint, method, data)) {
        studentFormContainer.classList.add('hidden');
        fetchAndRenderStudents();
    }
}

async function setupStudentFilters(allData) {
    if (!studentFilterContainer) return;

    const groups = await fetchData('/groups');
    const groupOptions = groups ? groups.map(g => createOption(g._id, g.name)).join('') : '';

    studentFilterContainer.innerHTML = `
        <label for="student-group-select">Група:</label>
        <select id="student-group-select">
            <option value="">-- Всі групи --</option>
            ${groupOptions}
        </select>
        <label for="student-text-filter">ПІБ/Заліковка ID:</label>
        <input type="text" id="student-text-filter" placeholder="Введіть текст...">
        <button id="apply-student-filter" class="primary-btn">Фільтрувати</button>
    `;

    const applyFilters = () => {
        const groupFilter = document.getElementById('student-group-select').value;
        const queryFilter = document.getElementById('student-text-filter').value.toLowerCase();

        const filtered = allData.filter(s => {
            const matchesGroup = !groupFilter || (s.group?._id || s.group) === groupFilter;
            const matchesQuery = !queryFilter ||
                s.fullName.toLowerCase().includes(queryFilter) ||
                s.studentID.toLowerCase().includes(queryFilter);
            return matchesGroup && matchesQuery;
        });
        currentSort.data = filtered;
        renderStudents(filtered, false);
    };

    document.getElementById('apply-student-filter').addEventListener('click', applyFilters);
    document.getElementById('student-text-filter').addEventListener('input', applyFilters);
    document.getElementById('student-group-select').addEventListener('change', applyFilters);
}

function renderStudents(students, isInitialRender = true) {
    studentList.innerHTML = '';
    const userInfo = getUserInfo();
    const isAdmin = userInfo?.role === 'admin';
    const isAdminOrTeacher = isAdmin || userInfo?.role === 'teacher';

    document.getElementById('add-student-btn').classList.toggle('hidden', !isAdmin);

    if (isInitialRender) {
        currentSort.data = students;
        setupStudentFilters(students);
        setupSortHeaders('students-table', 'students', renderStudents);
    }

    if (!students || students.length === 0) {
        studentList.innerHTML = '<tr><td colspan="5">Студентів не знайдено</td></tr>';
        return;
    }

    students.forEach(student => {
        const row = studentList.insertRow();
        row.insertCell().textContent = student.fullName;
        row.insertCell().textContent = student.group ? student.group.name : 'N/A';
        row.insertCell().textContent = student.studentID;
        row.insertCell().textContent = isAdminOrTeacher && student.email ? student.email : '---';

        const actionsCell = row.insertCell();

        if (isAdmin) {
            const editBtn = createActionButton('Редагувати', 'edit-btn', () => createStudentForm(student));
            const deleteBtn = createActionButton('Видалити', 'delete-btn', () => deleteStudent(student._id));
            actionsCell.append(editBtn, deleteBtn);
        } else {
            actionsCell.textContent = '---';
        }
    });
}

async function fetchAndRenderStudents() {
    const students = await fetchData('/students');
    if (students) renderStudents(students, true);
}

async function deleteStudent(id) {
    if (confirm('Ви впевнені, що хочете видалити цього студента?')) {
        if (await sendData(`/students/${id}`, 'DELETE')) {
            fetchAndRenderStudents();
        }
    }
}


// ====================================
//           6. Предмети
// ====================================

function createSubjectForm(subject = {}) {
    const isEdit = subject._id;
    subjectFormContainer.innerHTML = `
        <h3>${isEdit ? 'Редагувати' : 'Додати'} Предмет</h3>
        <form id="subject-form">
            <input type="hidden" id="subject-id" value="${subject._id || ''}">
            <input type="text" id="subject-name" placeholder="Назва Предмета" value="${subject.name || ''}" required>
            <input type="text" id="subject-code" placeholder="Код Предмета (напр. ПІ-101)" value="${subject.code || ''}" required>
            <input type="number" id="subject-hoursTotal" placeholder="Всього Годин" value="${subject.hoursTotal || ''}" required min="1">
            <input type="number" id="subject-hoursLection" placeholder="Лекційні Години" value="${subject.hoursLection || 0}" required min="0">
            <input type="number" id="subject-hoursPractice" placeholder="Практичні/Лаб. Години" value="${subject.hoursPractice || 0}" required min="0">
            <button type="submit">${isEdit ? 'Зберегти зміни' : 'Створити'}</button>
            <button type="button" class="cancel-btn">Скасувати</button>
        </form>
    `;
    subjectFormContainer.classList.remove('hidden');
    document.getElementById('subject-form').addEventListener('submit', handleSubjectSubmit);
    subjectFormContainer.querySelector('.cancel-btn').addEventListener('click', () => subjectFormContainer.classList.add('hidden'));
}

async function handleSubjectSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('subject-id').value;
    const data = {
        name: document.getElementById('subject-name').value,
        code: document.getElementById('subject-code').value,
        hoursTotal: parseInt(document.getElementById('subject-hoursTotal').value),
        hoursLection: parseInt(document.getElementById('subject-hoursLection').value),
        hoursPractice: parseInt(document.getElementById('subject-hoursPractice').value),
    };

    if (data.hoursLection + data.hoursPractice !== data.hoursTotal) {
        alert('Помилка валідації: Сума лекційних та практичних годин має дорівнювати загальній кількості годин');
        return;
    }

    const endpoint = id ? `/subjects/${id}` : '/subjects';
    const method = id ? 'PUT' : 'POST';

    if (await sendData(endpoint, method, data)) {
        subjectFormContainer.classList.add('hidden');
        fetchAndRenderSubjects();
    }
}

function setupSubjectFilters(allData) {
    if (!subjectFilterContainer) return;

    const numericFilterTemplate = (field, label) => `
        <label>${label}:</label>
        <select id="subject-op-${field}">
            <option value="">--</option>
            <option value="=">=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
        </select>
        <input type="number" id="subject-val-${field}" min="0" placeholder="Години" style="width: 80px;">
    `;

    subjectFilterContainer.innerHTML = `
        <label for="subject-text-filter">Назва/Код:</label>
        <input type="text" id="subject-text-filter" placeholder="Пошук..." style="min-width: 150px;">
        
        ${numericFilterTemplate('hoursTotal', 'Всього')}
        ${numericFilterTemplate('hoursLection', 'Лекцій')}
        ${numericFilterTemplate('hoursPractice', 'Практичних')}
        <button id="apply-subject-filter" class="primary-btn">Фільтрувати</button>
    `;

    const applyFilters = () => {
        let filtered = [...allData];
        const textQuery = document.getElementById('subject-text-filter').value.toLowerCase();

        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(textQuery) || s.code.toLowerCase().includes(textQuery)
        );

        filtered = applyNumericFilter(filtered, 'hoursTotal', document.getElementById('subject-op-hoursTotal').value, parseInt(document.getElementById('subject-val-hoursTotal').value));
        filtered = applyNumericFilter(filtered, 'hoursLection', document.getElementById('subject-op-hoursLection').value, parseInt(document.getElementById('subject-val-hoursLection').value));
        filtered = applyNumericFilter(filtered, 'hoursPractice', document.getElementById('subject-op-hoursPractice').value, parseInt(document.getElementById('subject-val-hoursPractice').value));

        currentSort.data = filtered;
        renderSubjects(filtered, false);
    };

    document.getElementById('apply-subject-filter').addEventListener('click', applyFilters);
    document.getElementById('subject-text-filter').addEventListener('input', applyFilters);
}

function renderSubjects(subjects, isInitialRender = true) {
    subjectList.innerHTML = '';
    const isAdmin = getUserInfo()?.role === 'admin';

    if (isInitialRender) {
        currentSort.data = subjects;
        setupSubjectFilters(subjects);
        setupSortHeaders('subjects-table', 'subjects', renderSubjects);
    }

    if (!subjects || subjects.length === 0) {
        subjectList.innerHTML = '<tr><td colspan="6">Предметів не знайдено</td></tr>';
        return;
    }

    subjects.forEach(subject => {
        const row = subjectList.insertRow();
        row.insertCell().textContent = subject.name;
        row.insertCell().textContent = subject.code;
        row.insertCell().textContent = subject.hoursTotal;
        row.insertCell().textContent = subject.hoursLection;
        row.insertCell().textContent = subject.hoursPractice;

        const actionsCell = row.insertCell();
        if (isAdmin) {
            const editBtn = createActionButton('Редагувати', 'edit-btn', () => createSubjectForm(subject));
            const deleteBtn = createActionButton('Видалити', 'delete-btn', () => deleteSubject(subject._id));
            actionsCell.append(editBtn, deleteBtn);
        } else {
            actionsCell.textContent = '---';
        }
    });
}

async function fetchAndRenderSubjects() {
    const subjects = await fetchData('/subjects');
    if (subjects) renderSubjects(subjects, true);
}

async function deleteSubject(id) {
    if (confirm('Ви впевнені, що хочете видалити цей предмет?')) {
        if (await sendData(`/subjects/${id}`, 'DELETE')) {
            fetchAndRenderSubjects();
        }
    }
}


// ====================================
//             7. Групи
// ====================================

function createGroupForm(group = {}) {
    const isEdit = group._id;
    groupFormContainer.innerHTML = `
        <h3>${isEdit ? 'Редагувати' : 'Додати'} Групу</h3>
        <form id="group-form">
            <input type="hidden" id="group-id" value="${group._id || ''}">
            <input type="text" id="group-name" placeholder="Назва Групи (напр. ПІ-21)" value="${group.name || ''}" required>
            <input type="number" id="group-course" placeholder="Курс (1-6)" value="${group.course || ''}" required min="1" max="6">
            <input type="number" id="group-studentsCount" placeholder="Кількість Студентів" value="${group.studentsCount || ''}" required min="1">
            <button type="submit">${isEdit ? 'Зберегти зміни' : 'Створити'}</button>
            <button type="button" class="cancel-btn">Скасувати</button>
        </form>
    `;
    groupFormContainer.classList.remove('hidden');

    document.getElementById('group-form').addEventListener('submit', handleGroupSubmit);
    groupFormContainer.querySelector('.cancel-btn').addEventListener('click', () => groupFormContainer.classList.add('hidden'));
}

async function handleGroupSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('group-id').value;
    const data = {
        name: document.getElementById('group-name').value,
        course: parseInt(document.getElementById('group-course').value),
        studentsCount: parseInt(document.getElementById('group-studentsCount').value),
    };

    if (data.course < 1 || data.course > 6) {
        alert('Курс має бути від 1 до 6');
        return;
    }

    const endpoint = id ? `/groups/${id}` : '/groups';
    const method = id ? 'PUT' : 'POST';

    if (await sendData(endpoint, method, data)) {
        groupFormContainer.classList.add('hidden');
        fetchAndRenderGroups();
    }
}

function setupGroupFilters(allData) {
    if (!groupFilterContainer) return;

    groupFilterContainer.innerHTML = `
        <label for="group-text-filter">Назва/Курс:</label>
        <input type="text" id="group-text-filter" placeholder="Пошук..." style="min-width: 150px;">
    `;

    const applyFilters = () => {
        const query = document.getElementById('group-text-filter').value.toLowerCase();

        const filtered = allData.filter(g =>
            g.name.toLowerCase().includes(query) ||
            String(g.course).includes(query)
        );

        currentSort.data = filtered;
        renderGroups(filtered, false);
    };

    document.getElementById('group-text-filter').addEventListener('input', applyFilters);
}


function renderGroups(groups, isInitialRender = true) {
    groupList.innerHTML = '';
    const isAdmin = getUserInfo()?.role === 'admin';

    if (isInitialRender) {
        currentSort.data = groups;
        setupGroupFilters(groups);
        setupSortHeaders('groups-table', 'groups', renderGroups);
    }

    if (!groups || groups.length === 0) {
        groupList.innerHTML = '<tr><td colspan="4">Груп не знайдено</td></tr>';
        return;
    }

    groups.forEach(group => {
        const row = groupList.insertRow();
        row.insertCell().textContent = group.name;
        row.insertCell().textContent = group.course;
        row.insertCell().textContent = group.studentsCount;

        const actionsCell = row.insertCell();
        if (isAdmin) {
            const editBtn = createActionButton('Редагувати', 'edit-btn', () => createGroupForm(group));
            const deleteBtn = createActionButton('Видалити', 'delete-btn', () => deleteGroup(group._id));
            actionsCell.append(editBtn, deleteBtn);
        } else {
            actionsCell.textContent = '---';
        }
    });
}

async function fetchAndRenderGroups() {
    const groups = await fetchData('/groups');
    if (groups) renderGroups(groups, true);
}

async function deleteGroup(id) {
    if (confirm('Ви впевнені, що хочете видалити цю групу?')) {
        if (await sendData(`/groups/${id}`, 'DELETE')) {
            fetchAndRenderGroups();
        }
    }
}


// ====================================
// 8. Розподіл Навантаження та Аналітика
// ====================================

async function fetchLoadStats() {
    const subjects = await fetchData('/subjects');
    const loads = await fetchData('/loads');

    if (!subjects || !loads) return {};

    const stats = {};

    subjects.forEach(subject => {
        stats[subject._id] = {
            name: subject.name,
            code: subject.code,
            totalLection: subject.hoursLection,
            totalPractice: subject.hoursPractice,
            assignedLection: 0,
            assignedPractice: 0,
        };
    });

    loads.forEach(load => {
        const subjectId = load.subject?._id || load.subject;

        if (subjectId && stats[subjectId]) {
            if (load.type === 'Лекція') {
                stats[subjectId].assignedLection += load.hoursAssigned;
            } else if (load.type === 'Практика' || load.type === 'Лабораторна') {
                stats[subjectId].assignedPractice += load.hoursAssigned;
            }
        }
    });

    return stats;
}

async function createLoadForm() {
    const [teachers, subjects, groups] = await Promise.all([
        fetchData('/teachers'),
        fetchData('/subjects'),
        fetchData('/groups'),
    ]);

    if (!teachers?.length || !subjects?.length || !groups?.length) {
        alert('Неможливо призначити навантаження: Спершу додайте Викладачів, Предмети та Групи');
        return;
    }

    const teacherOptions = teachers.map(t => createOption(t._id, t.fullName)).join('');
    const subjectOptions = subjects.map(s => createOption(s._id, `${s.code} - ${s.name} (Л: ${s.hoursLection}год, П: ${s.hoursPractice}год)`)).join('');
    const groupOptions = groups.map(g => createOption(g._id, `${g.name} (${g.course} курс, ${g.studentsCount} студ.)`)).join('');

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;


    loadFormContainer.innerHTML = `
        <h3>Призначити Нове Навантаження</h3>
        <form id="load-form">
            <label>Навчальний Рік:</label>
            <input type="text" id="load-academicYear" value="${academicYear}" readonly required>

            <label>Семестр:</label>
            <select id="load-semester" required>
                <option value="1">1 (Осінній)</option>
                <option value="2">2 (Весняний)</option>
            </select>

            <label>Викладач:</label>
            <select id="load-teacher" required>
                <option value="">-- Оберіть Викладача --</option>
                ${teacherOptions}
            </select>

            <label>Предмет:</label>
            <select id="load-subject" required>
                <option value="">-- Оберіть Предмет --</option>
                ${subjectOptions}
            </select>

            <label>Група:</label>
            <select id="load-group" required>
                <option value="">-- Оберіть Групу --</option>
                ${groupOptions}
            </select>
            
            <label>Тип Занять:</label>
            <select id="load-type" required>
                <option value="">-- Оберіть Тип --</option>
                <option value="Лекція">Лекція</option>
                <option value="Практика">Практика</option>
                <option value="Лабораторна">Лабораторна</option>
            </select>

            <label>Кількість Годин:</label>
            <input type="number" id="load-hoursAssigned" placeholder="Години для призначення" required min="1">
            
            <button type="submit">Призначити</button>
            <button type="button" class="cancel-btn">Скасувати</button>
        </form>
    `;
    loadFormContainer.classList.remove('hidden');

    document.getElementById('load-form').addEventListener('submit', handleLoadSubmit);
    loadFormContainer.querySelector('.cancel-btn').addEventListener('click', () => loadFormContainer.classList.add('hidden'));
}

async function handleLoadSubmit(e) {
    e.preventDefault();

    const data = {
        teacher: document.getElementById('load-teacher').value,
        subject: document.getElementById('load-subject').value,
        group: document.getElementById('load-group').value,
        type: document.getElementById('load-type').value,
        hoursAssigned: parseInt(document.getElementById('load-hoursAssigned').value),
        semester: parseInt(document.getElementById('load-semester').value),
        academicYear: document.getElementById('load-academicYear').value,
    };

    const result = await sendData('/loads', 'POST', data);

    if (result) {
        alert('Навантаження успішно призначено!');
        loadFormContainer.classList.add('hidden');
        fetchAndRenderLoad();
    }
}

async function fetchAndRenderLoad() {
    const [loads, stats, teachers, groups, subjects] = await Promise.all([
        fetchData('/loads'),
        fetchLoadStats(),
        fetchData('/teachers'),
        fetchData('/groups'),
        fetchData('/subjects')
    ]);

    if (!loads) return;

    globalStats = stats;

    currentSort.data = loads;
    setupLoadFilters(loads, teachers, groups, subjects);
    setupSortHeaders('load-table', 'load', renderLoad);

    renderLoad(loads, false);
}

function renderLoad(loads, isFiltered = false) {
    const isAdmin = getUserInfo()?.role === 'admin';
    loadList.innerHTML = '';

    if (!loads || loads.length === 0) {
        loadList.innerHTML = '<tr><td colspan="7">Навантаження не знайдено</td></tr>';
        return;
    }

    loads.forEach(load => {
        const row = loadList.insertRow();
        const subjectId = load.subject?._id;

        row.insertCell().textContent = `${load.academicYear} / ${load.semester}`;
        row.insertCell().textContent = load.teacher ? load.teacher.fullName : 'N/A';
        row.insertCell().textContent = load.subject ? `${load.subject.code} - ${load.subject.name}` : 'N/A';
        row.insertCell().textContent = load.group ? load.group.name : 'N/A';
        row.insertCell().textContent = load.type;

        let hoursText = `${load.hoursAssigned} год.`;
        if (isAdmin && subjectId) {
            const stat = globalStats[subjectId];
            if (stat) {
                let assigned = load.type === 'Лекція' ? stat.assignedLection : stat.assignedPractice;
                let total = load.type === 'Лекція' ? stat.totalLection : stat.totalPractice;

                hoursText += `<br><small style="color: grey;">(Призначено: ${assigned} з ${total})</small>`;
            }
        }
        row.insertCell().innerHTML = hoursText;

        const actionsCell = row.insertCell();
        if (isAdmin) {
            const deleteBtn = createActionButton('Видалити', 'delete-btn', () => deleteLoad(load._id));
            actionsCell.append(deleteBtn);
        } else {
            actionsCell.textContent = '---';
        }
    });
}

function setupLoadFilters(allData, teachers, groups, subjects) {
    if (!loadFilterContainer) return;

    const teacherOptions = teachers.map(t => createOption(t._id, t.fullName)).join('');
    const groupOptions = groups.map(g => createOption(g._id, g.name)).join('');
    const subjectOptions = subjects.map(s => createOption(s._id, s.name)).join('');

    loadFilterContainer.innerHTML = `
        <label>Викладач:</label>
        <select id="load-filter-teacher">
            <option value="">Всі</option>
            ${teacherOptions}
        </select>
        
        <label>Група:</label>
        <select id="load-filter-group">
            <option value="">Всі</option>
            ${groupOptions}
        </select>

        <label>Предмет:</label>
        <select id="load-filter-subject">
            <option value="">Всі</option>
            ${subjectOptions}
        </select>

        <label>Тип:</label>
        <select id="load-filter-type">
            <option value="">Всі</option>
            <option value="Лекція">Лекція</option>
            <option value="Практика">Практика</option>
            <option value="Лабораторна">Лабораторна</option>
        </select>
        
        <button id="apply-load-filter" class="secondary-btn">Фільтрувати</button>
    `;

    const applyFilters = () => {
        const teacherId = document.getElementById('load-filter-teacher').value;
        const groupId = document.getElementById('load-filter-group').value;
        const subjectId = document.getElementById('load-filter-subject').value;
        const type = document.getElementById('load-filter-type').value;

        const filtered = allData.filter(load => {
            const matchesTeacher = !teacherId || (load.teacher?._id || load.teacher) === teacherId;
            const matchesGroup = !groupId || (load.group?._id || load.group) === groupId;
            const matchesSubject = !subjectId || (load.subject?._id || load.subject) === subjectId;
            const matchesType = !type || load.type === type;

            return matchesTeacher && matchesGroup && matchesSubject && matchesType;
        });

        renderLoad(filtered, true);
    };

    document.getElementById('apply-load-filter').addEventListener('click', applyFilters);
}

async function deleteLoad(id) {
    if (confirm('Ви впевнені, що хочете видалити це навантаження?')) {
        if (await sendData(`/loads/${id}`, 'DELETE')) {
            fetchAndRenderLoad();
        }
    }
}


// ====================================
//            9. Розклад
// ====================================

async function createScheduleForm() {
    const loads = await fetchData('/loads');

    if (!loads?.length) {
        alert('Неможливо створити розклад: Спершу призначте Навантаження');
        return;
    }

    const dayOptionsHTML = dayOptions.map(d => `<option value="${d}">${d}</option>`).join('');
    const timeOptionsHTML = timeOptions.map(t => `<option value="${t}">${t}</option>`).join('');

    const loadOptions = loads.map(l => {
        const subjectName = l.subject ? l.subject.name : 'Невідомий предмет';
        const teacherName = l.teacher ? l.teacher.fullName : 'Невідомий викладач';
        const groupName = l.group ? l.group.name : 'Невідома група';
        return createOption(l._id, `${subjectName} (${l.type}, ${l.hoursAssigned} год.) - ${teacherName} для ${groupName}`);
    }).join('');

    scheduleFormContainer.innerHTML = `
        <h3>Додати Запис Розкладу</h3>
        <form id="schedule-form">
            <label>Виберіть Навантаження:</label>
            <select id="schedule-load-id" required>
                <option value="">-- Оберіть Навантаження --</option>
                ${loadOptions}
            </select>
            
            <label>День Тижня:</label>
            <select id="schedule-day" required>${dayOptionsHTML}</select>
            
            <label>Час Початку:</label>
            <select id="schedule-time" required>${timeOptionsHTML}</select>

            <label>Аудиторія:</label>
            <input type="text" id="schedule-auditorium" placeholder="Наприклад, 205 або Online" required>
            
            <button type="submit">Створити Запис</button>
            <button type="button" class="cancel-btn">Скасувати</button>
        </form>
    `;
    scheduleFormContainer.classList.remove('hidden');

    document.getElementById('schedule-form').addEventListener('submit', handleScheduleSubmit);
    scheduleFormContainer.querySelector('.cancel-btn').addEventListener('click', () => scheduleFormContainer.classList.add('hidden'));
}

async function handleScheduleSubmit(e) {
    e.preventDefault();

    const data = {
        load: document.getElementById('schedule-load-id').value,
        dayOfWeek: document.getElementById('schedule-day').value,
        startTime: document.getElementById('schedule-time').value,
        auditorium: document.getElementById('schedule-auditorium').value,
    };

    const result = await sendData('/schedule', 'POST', data);

    if (result) {
        alert('Запис розкладу успішно додано!');
        scheduleFormContainer.classList.add('hidden');
        fetchAndRenderSchedule();
    }
}

async function fetchAndRenderSchedule() {
    const schedule = await fetchData('/schedule');
    if (!schedule) return;

    currentSort.data = schedule;
    setupScheduleFilters(schedule);
    setupSortHeaders('schedule-table', 'schedule', renderSchedule);

    renderSchedule(schedule);
}

function renderSchedule(schedule, isFiltered = false) {
    const isAdmin = getUserInfo()?.role === 'admin';
    scheduleList.innerHTML = '';

    if (!schedule || schedule.length === 0) {
        scheduleList.innerHTML = '<tr><td colspan="8">Розклад не знайдено</td></tr>';
        return;
    }

    const dayOrder = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
    schedule.sort((a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime));

    schedule.forEach(entry => {
        const row = scheduleList.insertRow();
        const subjectData = entry.load && entry.load.subject ? entry.load.subject : { name: 'N/A' };

        row.insertCell().textContent = `${entry.academicYear} / ${entry.semester}`;
        row.insertCell().textContent = entry.dayOfWeek;
        row.insertCell().textContent = entry.startTime;
        row.insertCell().textContent = entry.auditorium;
        row.insertCell().textContent = entry.teacher ? entry.teacher.fullName : 'N/A';
        row.insertCell().textContent = entry.group ? entry.group.name : 'N/A';
        row.insertCell().textContent = `${subjectData.name} (${entry.load.type})`;

        const actionsCell = row.insertCell();
        if (isAdmin) {
            const deleteBtn = createActionButton('Видалити', 'delete-btn', () => deleteScheduleEntry(entry._id));
            actionsCell.appendChild(deleteBtn);
        } else {
            actionsCell.textContent = '---';
        }
    });
}

function setupScheduleFilters(allData) {
    if (!scheduleFilterContainer) return;

    const dayOptionsHTML = dayOptions.map(d => `<option value="${d}">${d}</option>`).join('');

    scheduleFilterContainer.innerHTML = `
        <label>День Тижня:</label>
        <select id="schedule-filter-day">
            <option value="">Всі дні</option>
            ${dayOptionsHTML}
        </select>
        
        <label>Аудиторія:</label>
        <input type="text" id="schedule-filter-auditorium" placeholder="Аудиторія або Online">

        <label>Шукати за датою (День тижня):</label>
        <input type="date" id="schedule-filter-date">
        
        <button id="apply-schedule-filter" class="secondary-btn">Фільтрувати</button>
    `;

    const applyFilters = () => {
        const dayFilter = document.getElementById('schedule-filter-day').value;
        const auditoriumFilter = document.getElementById('schedule-filter-auditorium').value.toLowerCase();

        const dateInput = document.getElementById('schedule-filter-date').value;
        let dayOfWeekFromDate = '';
        if (dateInput) {
            const date = new Date(dateInput);
            const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
            dayOfWeekFromDate = dayNames[date.getDay()];
        }

        const filtered = allData.filter(entry => {
            const matchesDay = !dayFilter || entry.dayOfWeek === dayFilter;
            const matchesAuditorium = !auditoriumFilter || entry.auditorium.toLowerCase().includes(auditoriumFilter);
            const matchesDate = !dayOfWeekFromDate || entry.dayOfWeek === dayOfWeekFromDate;
            return matchesDay && matchesAuditorium && matchesDate;
        });

        renderSchedule(filtered, true);
    };

    document.getElementById('apply-schedule-filter').addEventListener('click', applyFilters);
    document.getElementById('schedule-filter-day').addEventListener('change', applyFilters);
    document.getElementById('schedule-filter-auditorium').addEventListener('input', applyFilters);
    document.getElementById('schedule-filter-date').addEventListener('change', applyFilters);
}

async function deleteScheduleEntry(id) {
    if (confirm('Ви впевнені, що хочете видалити цей запис розкладу?')) {
        if (await sendData(`/schedule/${id}`, 'DELETE')) {
            fetchAndRenderSchedule();
        }
    }
}


// ====================================
//      10. Мій Розклад Викладача
// ====================================

async function fetchAndRenderMySchedule() {
    const userInfo = getUserInfo();
    teacherMyScheduleContainer.innerHTML = 'Завантаження...';

    if (userInfo.role !== 'teacher' || !userInfo.teacherId) {
        teacherMyScheduleContainer.innerHTML = '<p>Цей розділ доступний лише авторизованим викладачам</p>';
        return;
    }

    const allSchedule = await fetchData('/schedule');

    if (!allSchedule) {
        teacherMyScheduleContainer.innerHTML = '<p>Помилка завантаження розкладу</p>';
        return;
    }

    const mySchedule = allSchedule.filter(entry => entry.teacher && entry.teacher._id === userInfo.teacherId);

    if (mySchedule.length === 0) {
        teacherMyScheduleContainer.innerHTML = '<p>Ваш розклад наразі порожній</p>';
        return;
    }

    const times = timeOptions;
    const days = dayOptions;

    let html = '<h3>Персональний розклад</h3>';
    html += '<table class="schedule-grid">';

    html += '<thead><tr><th>Час</th>' + days.map(d => `<th>${d}</th>`).join('') + '</tr></thead>';
    html += '<tbody>';

    times.forEach(time => {
        html += `<tr><th>${time}</th>`;
        days.forEach(day => {
            const entry = mySchedule.find(e => e.dayOfWeek === day && e.startTime === time);

            if (entry) {
                const subject = entry.load.subject ? entry.load.subject.name : 'N/A';
                const group = entry.group ? entry.group.name : 'N/A';
                html += `<td class="occupied">
                            <strong>${subject}</strong> (${entry.load.type})<br>
                            ${group}, ауд. ${entry.auditorium}
                         </td>`;
            } else {
                html += `<td class="free"></td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    teacherMyScheduleContainer.innerHTML = html;
}


// ====================================
//      11. Мій Розклад Студента
// ====================================

async function fetchAndRenderStudentSchedule() {
    const userInfo = getUserInfo();
    studentScheduleContainer.innerHTML = 'Завантаження...';

    if (userInfo.role !== 'student' || !userInfo.studentId) {
        studentScheduleContainer.innerHTML = '<p>Цей розділ доступний лише авторизованим студентам</p>';
        return;
    }

    const studentInfo = await fetchData(`/students/${userInfo.studentId}`);

    if (!studentInfo || !studentInfo.group) {
        studentScheduleContainer.innerHTML = '<p>Помилка: Не вдалося отримати дані вашої групи</p>';
        return;
    }

    const studentGroupId = studentInfo.group?._id || studentInfo.group;
    const allSchedule = await fetchData('/schedule');

    if (!allSchedule) {
        studentScheduleContainer.innerHTML = '<p>Помилка завантаження розкладу</p>';
        return;
    }

    const myGroupSchedule = allSchedule.filter(entry => entry.group?._id === studentGroupId);

    if (myGroupSchedule.length === 0) {
        studentScheduleContainer.innerHTML = `<p>Розклад для вашої групи (${studentInfo.group.name}) ще не складено</p>`;
        return;
    }

    const times = timeOptions;
    const days = dayOptions;

    let html = `<h3>Розклад для групи: ${studentInfo.group.name} (${studentInfo.group.course} курс)</h3>`;
    html += '<table class="schedule-grid">';

    html += '<thead><tr><th>Час</th>' + days.map(d => `<th>${d}</th>`).join('') + '</tr></thead>';
    html += '<tbody>';

    times.forEach(time => {
        html += `<tr><th>${time}</th>`;
        days.forEach(day => {
            const entry = myGroupSchedule.find(e => e.dayOfWeek === day && e.startTime === time);

            if (entry) {
                const subject = entry.load.subject ? entry.load.subject.name : 'N/A';
                const teacher = entry.teacher ? entry.teacher.fullName : 'N/A';
                html += `<td class="occupied student-schedule">
                            <strong>${subject}</strong> (${entry.load.type})<br>
                            Викладач: ${teacher}<br>
                            Ауд. ${entry.auditorium}
                         </td>`;
            } else {
                html += `<td class="free"></td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    studentScheduleContainer.innerHTML = html;
}


// ====================================
//     12. Фінальна Ініціалізація
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    showLoginBtn.addEventListener('click', () => handleLoginModal(true));
    closeModalBtn.addEventListener('click', () => handleLoginModal(false));

    loginForm.addEventListener('submit', handleLoginSubmit);

    const passwordInput = document.getElementById('login-password');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            togglePasswordBtn.classList.toggle('fa-eye');
            togglePasswordBtn.classList.toggle('fa-eye-slash');
        });
    }

    logoutBtn.addEventListener('click', handleLogout);

    document.getElementById('add-teacher-btn').addEventListener('click', () => createTeacherForm());
    document.getElementById('add-subject-btn').addEventListener('click', () => createSubjectForm());
    document.getElementById('add-group-btn').addEventListener('click', () => createGroupForm());
    document.getElementById('add-load-btn').addEventListener('click', () => createLoadForm());
    document.getElementById('add-schedule-btn').addEventListener('click', () => createScheduleForm());
    document.getElementById('add-student-btn').addEventListener('click', () => createStudentForm());

    const userInfo = getUserInfo();
    if (userInfo) {
        renderApp(userInfo);
    } else {
        handleGuestLogin();
    }
});
