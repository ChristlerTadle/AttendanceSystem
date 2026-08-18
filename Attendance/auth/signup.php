<?php
include("../config.php");

if (isset($_POST['signup'])) {

    $firstName = $_POST['firstName'];
    $lastName = $_POST['lastName'];
    $name = $firstName . " " . $lastName;

    $email = $_POST['email'];
    $institutionId = $_POST['institutionId'];
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirmPassword'];
    $role = $_POST['role'];

    // Validation
    if ($password !== $confirmPassword) {
        echo "<script>alert('Passwords do not match!');</script>";
    } elseif (strlen($password) < 8) {
        echo "<script>alert('Password must be at least 8 characters!');</script>";
    } else {

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Check if email exists
        $check = $conn->query("SELECT * FROM users WHERE email='$email'");
        if ($check->num_rows > 0) {
            echo "<script>alert('Email already exists!');</script>";
        } else {

            $sql = "INSERT INTO users (name, email, password, role)
                    VALUES ('$name', '$email', '$hashedPassword', '$role')";

            if ($conn->query($sql)) {
                echo "<script>
                    alert('Account created successfully!');
                    window.location.href='login.php';
                </script>";
            } else {
                echo "Error: " . $conn->error;
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Attendance Management System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="container-custom">
        <div class="card">
            <div class="card-header">
                <h2>Create Account</h2>
                <p>Attendance Management System</p>
            </div>
            <div class="card-body">
                <form method="POST" id="signupForm">

                    <!-- Role Selection -->
                    <label class="form-label">Select Your Role</label>
                    <div class="role-selector">
                        <button type="button" class="role-btn active" data-role="teacher">Teacher</button>
                        <button type="button" class="role-btn" data-role="admin">Admin</button>
                    </div>

                    <!-- Hidden Role -->
                    <input type="hidden" name="role" id="roleInput" value="teacher">

                    <!-- Name -->
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" name="firstName" class="form-control" placeholder="First Name" required>
                        </div>
                        <div class="form-group">
                            <input type="text" name="lastName" class="form-control" placeholder="Last Name" required>
                        </div>
                    </div>

                    <!-- Email -->
                    <div class="form-group">
                        <input type="email" name="email" class="form-control" placeholder="Email" required>
                    </div>

                    <!-- ID -->
                    <div class="form-group">
                        <input type="text" name="institutionId" class="form-control" placeholder="ID Number" required>
                    </div>

                    <!-- Password -->
                    <div class="form-group">
                        <input type="password" name="password" id="password" class="form-control" placeholder="Password" required>
                    </div>

                    <!-- Confirm Password -->
                    <div class="form-group">
                        <input type="password" name="confirmPassword" id="confirmPassword" class="form-control" placeholder="Confirm Password" required>
                    </div>

                    <!-- Terms -->
                    <div class="checkbox-group">
                        <input type="checkbox" required>
                        <label>I agree to terms</label>
                    </div>

                    <button type="submit" name="signup" class="btn-signup">Create Account</button>

                    <div class="form-footer">
                        <p>Already have an account? <a href="login.php">Login</a></p>
                    </div>

                </form>
            </div>
        </div>
    </div>

<script>
let selectedRole = 'teacher';

document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedRole = this.getAttribute('data-role');
    });
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        e.preventDefault();
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters!');
        e.preventDefault();
        return;
    }

    document.getElementById('roleInput').value = selectedRole;
});
</script>

</body>
</html>