// ===========================
// QR CODE ATTENDANCE SYSTEM
// ===========================

// ===========================
// GLOBAL DATA & VARIABLES
// ===========================

// Sample Students
let students = [
    { id: '2024-001', name: 'Juan Dela Cruz', email: 'juan@school.com' },
    { id: '2024-002', name: 'Maria Santos', email: 'maria@school.com' },
    { id: '2024-003', name: 'Pedro Garcia', email: 'pedro@school.com' },
    { id: '2024-004', name: 'Ana Rodriguez', email: 'ana@school.com' },
    { id: '2024-005', name: 'Luis Fernandez', email: 'luis@school.com' },
];

// Attendance Session State
let sessionActive = false;
let sessionSubject = '';
let sessionStartTime = null;
let currentScannedQRData = null;
let qrScanner = null;

// Attendance Records (with snapshots)
let attendanceRecords = [];

// Attendance History (persisted sessions)
let attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory')) || [];

// Scanned students in current session (to prevent duplicates)
let scannedStudentsInSession = new Set();

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on
    const page = getCurrentPage();
    
    if (page === 'landing') {
        initializeLanding();
    } else if (page === 'admin') {
        initializeAdmin();
    } else if (page === 'teacher') {
        initializeTeacher();
    }
});

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('admin')) return 'admin';
    if (path.includes('teacher')) return 'teacher';
    return 'landing';
}

// ===========================
// LANDING PAGE INITIALIZATION
// ===========================

function initializeLanding() {
    // Landing page just needs the role selection navigation
    // Already handled by onclick handlers in index.html
}

// ===========================
// ADMIN DASHBOARD INITIALIZATION
// ===========================

function initializeAdmin() {
    setupDateTimeDisplay();
    setupAdminSidebar();
    loadStudentsTable();
    loadAttendanceRecords();
    setupAdminModals();
}

function setupAdminSidebar() {
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            switchAdminSection(section);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function switchAdminSection(section) {
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
        sectionEl.classList.add('active');
        
        if (section === 'students') {
            loadStudentsTable();
        } else if (section === 'attendance') {
            loadAttendanceRecords();
        }
    }
}

function loadStudentsTable() {
    const tbody = document.getElementById('studentTable');
    tbody.innerHTML = '';
    
    students.forEach(student => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="generateQRCode('${student.id}', '${student.name}')">
                    <i class="fas fa-qrcode me-1"></i>Generate QR
                </button>
            </td>
        `;
    });
    
    document.getElementById('totalStudents').textContent = students.length;
}

function generateQRCode(studentId, studentName) {
    // Clear previous QR code
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';
    
    // QR Data
    const qrData = JSON.stringify({
        student_id: studentId,
        name: studentName
    });
    
    // Show student info
    document.getElementById('qrStudentInfo').textContent = `${studentName} (${studentId})`;
    
    // Generate QR Code
    new QRCode(container, {
        text: qrData,
        width: 250,
        height: 250,
        colorDark: '#2563eb',
        colorLight: '#ffffff',
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
    modal.show();
    
    // Download button functionality
    document.getElementById('downloadQRBtn').onclick = function() {
        const canvas = container.querySelector('canvas');
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `QR_${studentId}_${studentName}.png`;
        link.click();
    };
}

function setupAdminModals() {
    document.getElementById('saveStudentBtn').addEventListener('click', function() {
        addNewStudent();
    });
}

function addNewStudent() {
    const studentId = document.getElementById('studentId').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const studentEmail = document.getElementById('studentEmail').value.trim();
    
    if (!studentId || !studentName || !studentEmail) {
        alert('All fields are required!');
        return;
    }
    
    students.push({
        id: studentId,
        name: studentName,
        email: studentEmail
    });
    
    // Reset form and close modal
    document.getElementById('addStudentForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
    
    // Reload table
    loadStudentsTable();
    showNotification('Student added successfully!', 'success');
}

function loadAttendanceRecords() {
    const tbody = document.getElementById('attendanceTable');
    tbody.innerHTML = '';
    
    if (attendanceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-inbox me-2"></i>No attendance records yet</td></tr>';
        return;
    }
    
    attendanceRecords.forEach(record => {
        const row = tbody.insertRow();
        const timeDisplay = new Date(record.timestamp).toLocaleString();
        
        row.innerHTML = `
            <td>${record.student_id}</td>
            <td>${record.name}</td>
            <td>${timeDisplay}</td>
            <td><span class="status-badge status-present">${record.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="previewSnapshot('${record.snapshot}')">
                    <i class="fas fa-image me-1"></i>View
                </button>
            </td>
        `;
    });
}

function previewSnapshot(snapshotData) {
    document.getElementById('previewImage').src = snapshotData;
    const modal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
    modal.show();
}

// ===========================
// TEACHER DASHBOARD INITIALIZATION
// ===========================

function initializeTeacher() {
    setupDateTimeDisplay();
    setupTeacherSidebar();
    setupTeacherSessionControl();
    setupHistoryListeners();
    initializeQRScanner();
    
    // Display history count
    document.getElementById('totalSessions').textContent = attendanceHistory.length;
    document.getElementById('sessionStatus').innerHTML = '<span class="badge bg-danger">Inactive</span>';
    document.getElementById('currentSessionDisplay').textContent = 'No active session';
}

function setupTeacherSidebar() {
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            
            // Prevent switching to scanning if no session active
            if (section === 'scanning' && !sessionActive) {
                showNotification('Please start a session first!', 'warning');
                return;
            }
            
            switchTeacherSection(section);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function switchTeacherSection(section) {
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
        sectionEl.classList.add('active');
        
        if (section === 'scanning') {
            // QR scanner will be initialized
            if (qrScanner && !qrScanner.isRunning) {
                qrScanner.start().catch(err => console.error('Failed to start scanner:', err));
            }
        } else if (section === 'attendance') {
            loadAttendanceTableTeacher();
            if (qrScanner && qrScanner.isRunning) {
                qrScanner.stop();
            }
        } else if (section === 'history') {
            if (qrScanner && qrScanner.isRunning) {
                qrScanner.stop();
            }
            loadAttendanceHistory();
        }
    }
}

function setupTeacherSessionControl() {
    const startBtn = document.getElementById('startSessionBtn');
    const endBtn = document.getElementById('endSessionBtn');
    
    startBtn.addEventListener('click', startSession);
    endBtn.addEventListener('click', endSession);
}

function startSession() {
    const subject = document.getElementById('sessionSubject').value.trim();
    
    if (!subject) {
        alert('Please enter a subject name!');
        return;
    }
    
    sessionActive = true;
    sessionSubject = subject;
    sessionStartTime = new Date();
    scannedStudentsInSession.clear();
    attendanceRecords = [];
    
    // Update UI
    document.getElementById('subjectName').textContent = subject;
    document.getElementById('totalStudentsSession').textContent = students.length;
    document.getElementById('sessionStatus').innerHTML = '<span class="badge bg-success">Active</span>';
    document.getElementById('currentSessionDisplay').textContent = subject + ' - ' + new Date().toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    document.getElementById('totalSessions').textContent = attendanceHistory.length;
    document.getElementById('sessionInfo').style.display = 'block';
    document.getElementById('startSessionBtn').disabled = true;
    document.getElementById('endSessionBtn').disabled = false;
    document.getElementById('sessionSubject').disabled = true;
    
    showNotification(`Session started for ${subject}!`, 'success');
}

function endSession() {
    if (attendanceRecords.length > 0) {
        // Save session to history
        const session = {
            id: Date.now(),
            subject: sessionSubject,
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString(),
            records: attendanceRecords,
            studentCount: attendanceRecords.length
        };
        
        attendanceHistory.unshift(session); // Add to beginning
        localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));
    }
    
    sessionActive = false;
    
    // Update UI
    document.getElementById('sessionStatus').innerHTML = '<span class="badge bg-danger">Inactive</span>';
    document.getElementById('sessionInfo').style.display = 'none';
    document.getElementById('startSessionBtn').disabled = false;
    document.getElementById('endSessionBtn').disabled = true;
    document.getElementById('sessionSubject').disabled = false;
    
    if (qrScanner && qrScanner.isRunning) {
        qrScanner.stop();
    }
    
    showNotification(`Session ended! ${attendanceRecords.length} students marked.`, 'success');
}

function initializeQRScanner() {
    const qrReaderDiv = document.getElementById('qr-reader');
    
    if (!qrReaderDiv) return;
    
    qrScanner = new Html5Qrcode('qr-reader');
    
    // Try to start with rear camera
    qrScanner.start(
        { facingMode: 'environment' },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        onQRCodeScanned,
        onQRCodeScanError
    ).catch(err => {
        console.error('Error starting QR scanner:', err);
    });
}

function onQRCodeScanned(decodedText) {
    if (!sessionActive) {
        updateScanStatus('Session not active. Please start a session first.', 'danger');
        return;
    }
    
    try {
        const qrData = JSON.parse(decodedText);
        const studentId = qrData.student_id;
        const studentName = qrData.name;
        
        // Check for duplicate scans in current session
        if (scannedStudentsInSession.has(studentId)) {
            updateScanStatus(`⚠️ ${studentName} already scanned in this session!`, 'warning');
            return;
        }
        
        // Capture snapshot
        captureSnapshot(studentId, studentName);
        
        // Mark as scanned
        scannedStudentsInSession.add(studentId);
        
        // Create attendance record
        const now = new Date();
        const record = {
            student_id: studentId,
            name: studentName,
            timestamp: now.toISOString(),
            status: 'Present',
            snapshot: currentScannedQRData
        };
        
        attendanceRecords.push(record);
        
        // Update UI
        updateScanStatus(`✅ ${studentName} scanned successfully!`, 'success');
        displayLastScannedInfo(studentName, studentId, now);
        playSuccessSound();
        loadAttendanceTableTeacher();
        
        // Update attendance count
        document.getElementById('teacherAttendanceTaken').textContent = attendanceRecords.length;
        
    } catch (error) {
        console.error('Error parsing QR data:', error);
        updateScanStatus('❌ Invalid QR code format!', 'danger');
    }
}

function onQRCodeScanError(errorMessage) {
    // Suppress console errors
}

function captureSnapshot(studentId, studentName) {
    try {
        const video = document.querySelector('#qr-reader video');
        if (!video) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        currentScannedQRData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Show snapshot modal briefly
        document.getElementById('snapshotInfo').innerHTML = `
            <strong>${studentName}</strong><br>
            <small>Time: ${new Date().toLocaleTimeString()}</small>
        `;
        
    } catch (error) {
        console.error('Error capturing snapshot:', error);
    }
}

function updateScanStatus(message, type = 'info') {
    const statusDiv = document.getElementById('scanStatus');
    const bgClass = `alert-${type}`;
    
    statusDiv.className = `alert ${bgClass}`;
    statusDiv.innerHTML = `<i class="fas fa-circle-notch me-2"></i>${message}`;
}

function displayLastScannedInfo(name, id, timestamp) {
    document.getElementById('lastScannedName').textContent = name;
    document.getElementById('lastScannedId').textContent = id;
    document.getElementById('lastScannedTime').textContent = timestamp.toLocaleTimeString();
    document.getElementById('lastScannedInfo').style.display = 'block';
}

function loadAttendanceTableTeacher() {
    const tbody = document.getElementById('attendanceTableTeacher');
    tbody.innerHTML = '';
    
    if (attendanceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-inbox me-2"></i>No scans yet</td></tr>';
        return;
    }
    
    attendanceRecords.forEach((record, index) => {
        const row = tbody.insertRow();
        const timeDisplay = new Date(record.timestamp).toLocaleTimeString();
        
        row.classList.add('highlight-row');
        row.innerHTML = `
            <td>${record.student_id}</td>
            <td>${record.name}</td>
            <td>${timeDisplay}</td>
            <td><span class="status-badge status-present">${record.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="previewSnapshotTeacher('${record.snapshot}')">
                    <i class="fas fa-image me-1"></i>View
                </button>
            </td>
        `;
        
        setTimeout(() => {
            row.classList.remove('highlight-row');
        }, 3000);
    });
    
    // Update count
    document.getElementById('currentSessionCount').textContent = attendanceRecords.length;
}

function loadAttendanceHistory() {
    const container = document.getElementById('historySessions');
    const noHistory = document.getElementById('noHistoryMessage');
    
    if (attendanceHistory.length === 0) {
        noHistory.style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    noHistory.style.display = 'none';
    
    // Apply filters
    const subjectFilter = document.getElementById('historyFilterSubject').value.toLowerCase();
    const dateFilter = document.getElementById('historyFilterDate').value;
    
    let filtered = attendanceHistory.filter(session => {
        const matchSubject = session.subject.toLowerCase().includes(subjectFilter);
        const matchDate = !dateFilter || session.date === new Date(dateFilter).toLocaleDateString();
        return matchSubject && matchDate;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-warning">No sessions match your filters.</div></div>';
        return;
    }
    
    container.innerHTML = filtered.map(session => `
        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-header bg-gradient-primary">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-0 text-white">${session.subject}</h5>
                            <small class="text-white-50">${session.date}</small>
                        </div>
                        <span class="badge bg-light text-dark">${session.studentCount} students</span>
                    </div>
                </div>
                <div class="card-body">
                    <p class="mb-3">
                        <strong>Time:</strong> ${new Date(session.timestamp).toLocaleTimeString()}<br>
                        <strong>Records:</strong> ${session.records.length} scanned
                    </p>
                    <button class="btn btn-sm btn-primary w-100 mb-2" onclick="viewSessionDetails('${session.id}')">
                        <i class="fas fa-eye me-1"></i>View Details
                    </button>
                    <button class="btn btn-sm btn-secondary w-100" onclick="exportSession('${session.id}')">
                        <i class="fas fa-download me-1"></i>Export
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewSessionDetails(sessionId) {
    const session = attendanceHistory.find(s => s.id == sessionId);
    if (!session) return;
    
    // Create modal dynamically
    const modal = new bootstrap.Modal(document.getElementById('imagePreviewModalTeacher'));
    
    // Replace modal content temporarily
    const modalBody = document.querySelector('#imagePreviewModalTeacher .modal-body');
    const originalContent = modalBody.innerHTML;
    
    let tableHTML = `
        <div class="text-start">
            <h6>${session.subject} - ${session.date}</h6>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    session.records.forEach(record => {
        tableHTML += `
            <tr>
                <td><small>${record.student_id}</small></td>
                <td><small>${record.name}</small></td>
                <td><small>${new Date(record.timestamp).toLocaleTimeString()}</small></td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    modalBody.innerHTML = tableHTML;
    
    const originalTitle = document.querySelector('#imagePreviewModalTeacher .modal-title');
    originalTitle.textContent = `Session Details: ${session.subject}`;
    
    modal.show();
    
    // Restore original content when modal closes
    document.getElementById('imagePreviewModalTeacher').addEventListener('hidden.bs.modal', function() {
        modalBody.innerHTML = originalContent;
        originalTitle.textContent = 'Proof Snapshot';
    });
}

function exportSession(sessionId) {
    const session = attendanceHistory.find(s => s.id == sessionId);
    if (!session) return;
    
    const csvContent = [
        ['Subject:', session.subject],
        ['Date:', session.date],
        ['Total Students:', session.studentCount],
        [],
        ['Student ID', 'Name', 'Time Scanned', 'Status'],
        ...session.records.map(r => [
            r.student_id,
            r.name,
            new Date(r.timestamp).toLocaleTimeString(),
            r.status
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${session.subject}_${session.date}.csv`;
    link.click();
    
    showNotification('Session exported as CSV!', 'success');
}

// Setup history event listeners
function setupHistoryListeners() {
    const subjectFilter = document.getElementById('historyFilterSubject');
    const dateFilter = document.getElementById('historyFilterDate');
    const clearBtn = document.getElementById('clearHistoryFilter');
    const exportBtn = document.getElementById('exportSessionBtn');
    
    if (subjectFilter) subjectFilter.addEventListener('input', loadAttendanceHistory);
    if (dateFilter) dateFilter.addEventListener('change', loadAttendanceHistory);
    if (clearBtn) clearBtn.addEventListener('click', function() {
        if (subjectFilter) subjectFilter.value = '';
        if (dateFilter) dateFilter.value = '';
        loadAttendanceHistory();
    });
    if (exportBtn) exportBtn.addEventListener('click', function() {
        // Export current session
        if (attendanceRecords.length === 0) {
            showNotification('No records to export!', 'warning');
            return;
        }
        
        const csvContent = [
            ['Subject:', sessionSubject],
            ['Date:', new Date().toLocaleDateString()],
            ['Time:', new Date().toLocaleTimeString()],
            ['Total Students:', attendanceRecords.length],
            [],
            ['Student ID', 'Name', 'Time Scanned', 'Status'],
            ...attendanceRecords.map(r => [
                r.student_id,
                r.name,
                new Date(r.timestamp).toLocaleTimeString(),
                r.status
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${sessionSubject}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('Current session exported as CSV!', 'success');
    });
}

function previewSnapshotTeacher(snapshotData) {
    document.getElementById('previewImageTeacher').src = snapshotData;
    const modal = new bootstrap.Modal(document.getElementById('imagePreviewModalTeacher'));
    modal.show();
}

function playSuccessSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Could not play sound:', error);
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function setupDateTimeDisplay() {
    function updateDateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const dateStr = now.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        const dateTimeEl = document.getElementById('currentDateTime');
        if (dateTimeEl) {
            dateTimeEl.textContent = `${dateStr} ${timeStr}`;
        }
    }
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function showNotification(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '100px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.style.animation = 'slideInLeft 0.3s ease';
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'warning' ? 'exclamation-circle' : 
                 'info-circle';
    
    alertDiv.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Export for use in other scripts
window.generateQRCode = generateQRCode;
window.previewSnapshot = previewSnapshot;
window.previewSnapshotTeacher = previewSnapshotTeacher;
window.viewSessionDetails = viewSessionDetails;
window.exportSession = exportSession;
