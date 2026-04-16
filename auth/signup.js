document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const toast = document.getElementById('toast');

    function showToast(message, type = 'error') {
        let icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';
        toast.innerHTML = `${icon} ${message}`;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!name || !email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Check if user already exists
        const existingUsers = JSON.parse(localStorage.getItem('usersDB')) || [];
        const userExists = existingUsers.some(u => u.email === email);

        if (userExists) {
            showToast('Email already registered', 'error');
            return;
        }

        // Save user
        const newUser = { name, email, password };
        existingUsers.push(newUser);
        localStorage.setItem('usersDB', JSON.stringify(existingUsers));

        showToast('Account created successfully!', 'success');

        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
});
