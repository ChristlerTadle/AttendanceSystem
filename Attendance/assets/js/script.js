// ===========================
// SAMPLE DATA
// ===========================

// Sample users for admin dashboard
const sampleUsers = [
    { id: 1, name: 'Alice Johnson', role: 'Teacher', email: 'alice@school.com' },
    { id: 2, name: 'Bob Smith', role: 'Student', email: 'bob@school.com' },
    { id: 3, name: 'Charlie Brown', role: 'Teacher', email: 'charlie@school.com' },
    { id: 4, name: 'Diana Prince', role: 'Student', email: 'diana@school.com' },
];

// Sample attendance records
let attendanceRecords = [
    { id: 1, studentName: 'Alice Johnson', subject: 'Mathematics', date: '2024-01-20', status: 'Present' },
    { id: 2, studentName: 'Bob Smith', subject: 'English', date: '2024-01-20', status: 'Absent' },
    { id: 3, studentName: 'Charlie Brown', subject: 'Science', date: '2024-01-21', status: 'Present' },
];

// Sample student attendance (for student view)
const studentAttendanceData = [
    { date: '2024-01-15', subject: 'Mathematics', status: 'Present' },
    { date: '2024-01-16', subject: 'English', status: 'Present' },
    { date: '2024-01-17', subject: 'Science', status: 'Absent' },
    { date: '2024-01-18', subject: 'History', status: 'Present' },
    { date: '2024-01-19', subject: 'Computer Science', status: 'Present' },
];

// ===========================
// GLOBAL VARIABLES
// ===========================

let currentRole = 'admin';
let currentEditId = null;
let nextUserId = 5;
let nextRecordId = 4;

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setDefaultDateValues();
    switchRole('admin');
}

function setDefaultDateValues() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('teacherDate').value = today;
    if (document.getElementById('editDate')) {
        document.getElementById('editDate').value = today;
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('closeSidebar').addEventListener('click', toggleSidebar);

    // Role selector
    document.getElementById('roleSelect').addEventListener('change', function(e) {
        switchRole(e.target.value);
    });

    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Teacher form submission
    document.getElementById('teacherAttendanceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addAttendanceRecord();
    });

    // Admin add user form
    document.getElementById('addUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewUser();
    });

    document.getElementById('saveUserBtn').addEventListener('click', addNewUser);
    document.getElementById('saveRecordBtn').addEventListener('click', saveEditedRecord);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Search functionality
    document.getElementById('adminSearchRecords').addEventListener('keyup', function(e) {
        filterAdminAttendance(e.target.value);
    });

    document.getElementById('teacherSearchRecords').addEventListener('keyup', function(e) {
        filterTeacherAttendance(e.target.value);
    });

    document.getElementById('studentSearchRecords').addEventListener('keyup', function(e) {
        filterStudentAttendance(e.target.value);
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        if (window.innerWidth <= 576 && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
            sidebar.classList.remove('show');
        }
    });
}

// ===========================
// SIDEBAR TOGGLE
// ===========================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 576) {
        sidebar.classList.toggle('show');
    } else {
        sidebar.classList.toggle('hide');
        const mainContent = document.getElementById('mainContent');
        mainContent.style.marginLeft = sidebar.classList.contains('hide') ? '0' : '250px';
    }
}

// ===========================
// ROLE SWITCHING
// ===========================

function switchRole(role) {
    currentRole = role;

    // Hide all dashboards
    document.getElementById('adminDashboard').classList.remove('active');
    document.getElementById('teacherDashboard').classList.remove('active');
    document.getElementById('studentDashboard').classList.remove('active');

    // Show selected dashboard
    switch(role) {
        case 'admin':
            document.getElementById('adminDashboard').classList.add('active');
            loadAdminDashboard();
            break;
        case 'teacher':
            document.getElementById('teacherDashboard').classList.add('active');
            loadTeacherDashboard();
            break;
        case 'student':
            document.getElementById('studentDashboard').classList.add('active');
            loadStudentDashboard();
            break;
    }

    document.getElementById('roleSelect').value = role;
}

// ===========================
// ADMIN DASHBOARD FUNCTIONS
// ===========================

function loadAdminDashboard() {
    updateAdminStats();
    loadAdminUsers();
    loadAdminAttendance();
}

function updateAdminStats() {
    document.getElementById('adminTotalStudents').textContent = '150';
    document.getElementById('adminTotalTeachers').textContent = '25';
    document.getElementById('adminTotalRecords').textContent = attendanceRecords.length;
}

function loadAdminUsers() {
    const tbody = document.getElementById('adminUsersTable');
    tbody.innerHTML = '';

    sampleUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${user.name}</strong></td>
            <td><span class="badge" style="background-color: ${user.role === 'Teacher' ? '#3498db' : '#27ae60'}">${user.role}</span></td>
            <td>${user.email}</td>
            <td>
                <button class="btn-action btn-edit btn-sm" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-delete btn-sm" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadAdminAttendance() {
    const tbody = document.getElementById('adminAttendanceTable');
    tbody.innerHTML = '';

    if (attendanceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">No attendance records yet</td></tr>';
        return;
    }

    attendanceRecords.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Present' ? 'status-present' : 'status-absent';
        row.innerHTML = `
            <td>${record.studentName}</td>
            <td>${record.subject}</td>
            <td>${formatDate(record.date)}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function addNewUser() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const role = document.getElementById('userRole').value;

    if (!name || !email || !role) {
        showAlert('Please fill all fields', 'danger');
        return;
    }

    sampleUsers.push({
        id: nextUserId++,
        name: name,
        role: role,
        email: email
    });

    loadAdminUsers();
    document.getElementById('addUserForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
    showAlert('User added successfully!', 'success');
}

function editUser(id) {
    alert('Edit functionality - Edit user ' + id);
}

function deleteUser(id) {
    const index = sampleUsers.findIndex(u => u.id === id);
    if (index > -1) {
        sampleUsers.splice(index, 1);
        loadAdminUsers();
        showAlert('User deleted successfully!', 'success');
    }
}

function filterAdminAttendance(searchTerm) {
    const tbody = document.getElementById('adminAttendanceTable');
    const filtered = attendanceRecords.filter(record =>
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.date.includes(searchTerm)
    );

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">No records found</td></tr>';
        return;
    }

    filtered.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Present' ? 'status-present' : 'status-absent';
        row.innerHTML = `
            <td>${record.studentName}</td>
            <td>${record.subject}</td>
            <td>${formatDate(record.date)}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// ===========================
// TEACHER DASHBOARD FUNCTIONS
// ===========================

function loadTeacherDashboard() {
    document.getElementById('teacherTotalStudents').textContent = '45';
    document.getElementById('teacherClassesToday').textContent = '3';
    document.getElementById('teacherAttendanceTaken').textContent = attendanceRecords.length;
    loadTeacherAttendance();
}

function loadTeacherAttendance() {
    const tbody = document.getElementById('teacherAttendanceTable');
    tbody.innerHTML = '';

    if (attendanceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records yet. Add your first record!</td></tr>';
        return;
    }

    attendanceRecords.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Present' ? 'status-present' : 'status-absent';
        row.innerHTML = `
            <td>${record.studentName}</td>
            <td>${record.subject}</td>
            <td>${formatDate(record.date)}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
            <td>
                <button class="btn-action btn-edit" onclick="openEditModal(${record.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-delete" onclick="openDeleteModal(${record.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addAttendanceRecord() {
    const studentName = document.getElementById('teacherStudentName').value.trim();
    const subject = document.getElementById('teacherSubject').value.trim();
    const date = document.getElementById('teacherDate').value;
    const status = document.getElementById('teacherStatus').value;

    if (!studentName || !subject || !date || !status) {
        showAlert('Please fill all fields', 'danger');
        return;
    }

    attendanceRecords.push({
        id: nextRecordId++,
        studentName: studentName,
        subject: subject,
        date: date,
        status: status
    });

    loadTeacherAttendance();
    updateAdminStats();
    document.getElementById('teacherAttendanceForm').reset();
    setDefaultDateValues();
    showAlert('Attendance record added successfully!', 'success');
}

function openEditModal(id) {
    const record = attendanceRecords.find(r => r.id === id);
    if (!record) return;

    currentEditId = id;
    document.getElementById('editStudentName').value = record.studentName;
    document.getElementById('editSubject').value = record.subject;
    document.getElementById('editDate').value = record.date;
    document.getElementById('editStatus').value = record.status;

    const modal = new bootstrap.Modal(document.getElementById('editRecordModal'));
    modal.show();
}

function saveEditedRecord() {
    const record = attendanceRecords.find(r => r.id === currentEditId);
    if (!record) return;

    record.studentName = document.getElementById('editStudentName').value.trim();
    record.subject = document.getElementById('editSubject').value.trim();
    record.date = document.getElementById('editDate').value;
    record.status = document.getElementById('editStatus').value;

    loadTeacherAttendance();
    loadAdminAttendance();
    bootstrap.Modal.getInstance(document.getElementById('editRecordModal')).hide();
    showAlert('Record updated successfully!', 'success');
}

function openDeleteModal(id) {
    currentEditId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

function confirmDelete() {
    const index = attendanceRecords.findIndex(r => r.id === currentEditId);
    if (index > -1) {
        attendanceRecords.splice(index, 1);
        loadTeacherAttendance();
        loadAdminAttendance();
        updateAdminStats();
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        showAlert('Record deleted successfully!', 'success');
    }
}

function filterTeacherAttendance(searchTerm) {
    const tbody = document.getElementById('teacherAttendanceTable');
    const filtered = attendanceRecords.filter(record =>
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.date.includes(searchTerm)
    );

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records found</td></tr>';
        return;
    }

    filtered.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Present' ? 'status-present' : 'status-absent';
        row.innerHTML = `
            <td>${record.studentName}</td>
            <td>${record.subject}</td>
            <td>${formatDate(record.date)}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
            <td>
                <button class="btn-action btn-edit" onclick="openEditModal(${record.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-delete" onclick="openDeleteModal(${record.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===========================
// STUDENT DASHBOARD FUNCTIONS
// ===========================

function loadStudentDashboard() {
    const totalClasses = studentAttendanceData.length;
    const presentCount = studentAttendanceData.filter(r => r.status === 'Present').length;
    const absentCount = studentAttendanceData.filter(r => r.status === 'Absent').length;

    document.getElementById('studentTotalClasses').textContent = totalClasses;
    document.getElementById('studentPresent').textContent = presentCount;
    document.getElementById('studentAbsent').textContent = absentCount;

    loadStudentAttendance();
}

function loadStudentAttendance() {
    const tbody = document.getElementById('studentAttendanceTable');
    tbody.innerHTML = '';

    studentAttendanceData.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Present' ? 'status-present' : 'status-absent';
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.subject}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function filterStudentAttendance(searchTerm) {
    const tbody = document.getElementById('studentAttendanceTable');
    const filtered = studentAttendanceData.filter(record =>
        record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.date.includes(searchTerm)
    );

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">No records found</td></tr>';
        return;
    }

    filtered.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = record.status === 'Present' ? 'status-present' : 'status-absent';
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.subject}</td>
            <td><span class="status-badge ${statusClass}">${record.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '100px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================

document.addEventListener('keydown', function(e) {
    // Alt + A: Switch to Admin
    if (e.altKey && e.key === 'a') {
        document.getElementById('roleSelect').value = 'admin';
        switchRole('admin');
    }
    // Alt + T: Switch to Teacher
    if (e.altKey && e.key === 't') {
        document.getElementById('roleSelect').value = 'teacher';
        switchRole('teacher');
    }
    // Alt + S: Switch to Student
    if (e.altKey && e.key === 's') {
        document.getElementById('roleSelect').value = 'student';
        switchRole('student');
    }
});

// ===========================
// RESPONSIVE SIDEBAR
// ===========================

window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 576) {
        sidebar.classList.remove('show');
    }
});

/**
 * Initialize the application
 */
