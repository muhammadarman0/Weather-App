document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.replace('../weather/dashboard.html');
    }

    const loginForm = document.getElementById('login-form');
    const toast = document.getElementById('toast');

    function showToast(message, type = 'error') {
        let icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';
        toast.innerHTML = `${icon} ${message}`;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const existingUsers = JSON.parse(localStorage.getItem('usersDB')) || [];

        // Find matching user
        const validUser = existingUsers.find(u => u.email === email && u.password === password);

        if (validUser) {
            // Save active user session
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(validUser));

            showToast('Login successful!', 'success');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '../weather/dashboard.html';
            }, 1000);
        } else {
            showToast('Invalid email or password', 'error');
        }
    });
});
