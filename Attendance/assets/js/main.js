// Role selection - works for both login and signup
const roleButtons = document.querySelectorAll('.role-btn');
let selectedRole = 'student';

roleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        roleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRole = btn.dataset.role;
    });
});

// Login Form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember').checked;

        console.log({
            role: selectedRole,
            email,
            password,
            rememberMe
        });

        // Add your login logic here
        alert(`Login as ${selectedRole} with email: ${email}`);
    });
}

// Signup Form submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const institutionId = document.getElementById('institutionId').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        console.log({
            role: selectedRole,
            firstName,
            lastName,
            email,
            institutionId,
            password
        });

        // Add your signup logic here
        alert(`Account created for ${firstName} ${lastName} as ${selectedRole}`);
    });
}
