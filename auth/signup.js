document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const toast = document.getElementById('toast');

    // Web Audio API Sound Helper
    function playSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
                osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.8);
            } else if (type === 'click') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            }
        } catch(e) {}
    }

    function showToast(message, type = 'error') {
        let icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';
        toast.innerHTML = `${icon} ${message}`;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Toggle Password Visibility
    const togglePwd = document.getElementById('toggle-pwd');
    const pwdInput = document.getElementById('password');
    if (togglePwd && pwdInput) {
        togglePwd.addEventListener('click', () => {
            playSound('click');
            const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
            pwdInput.setAttribute('type', type);
            togglePwd.className = type === 'password' ? 'fa-regular fa-eye toggle-password' : 'fa-regular fa-eye-slash toggle-password';
        });
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

        playSound('success');
        showToast('Account created successfully!', 'success');

        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
    // Social Login Handling
    function handleSocialLogin(provider) {
        playSound('click');
        // Create custom modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay fade-in';
        overlay.innerHTML = `
            <div class="glass-panel modal-content" style="padding: 30px; text-align: left; max-width: 380px; width: 90%;">
                <h3 style="margin-bottom: 10px; font-size: 1.5rem;"><i class="fa-brands fa-${provider.toLowerCase() === 'google' ? 'google' : 'facebook-f'}" style="margin-right: 8px;"></i>Join with ${provider}</h3>
                <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 25px;">Choose an account or enter your email to continue to Weather App.</p>
                <input type="email" id="social-email" placeholder="Email or phone" style="width: 100%; padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.25); color: white; margin-bottom: 25px; outline: none; transition: all 0.3s;" autocomplete="off">
                <div style="display: flex; gap: 15px;">
                    <button type="button" id="cancel-social" style="flex: 1; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.1); color: white; border: none; cursor: pointer; transition: 0.3s;">Cancel</button>
                    <button type="button" id="confirm-social" style="flex: 2; padding: 12px; border-radius: 12px; background: var(--accent); color: white; border: none; cursor: pointer; font-weight: 700; transition: 0.3s;">Next</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Cancel Event
        document.getElementById('cancel-social').addEventListener('click', () => {
            overlay.remove();
        });

        // Confirm Event
        document.getElementById('confirm-social').addEventListener('click', () => {
            const email = document.getElementById('social-email').value.trim();
            if(!email || !email.includes('@')) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            
            overlay.remove();
            playSound('success');
            showToast(`Verifying ${provider} connection...`, 'success');
            
            setTimeout(() => {
                // Extract part before @ as the user's name
                const nameStr = email.split('@')[0];
                const displayName = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
                
                const mockUser = { name: displayName, email: email, loginType: provider };
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(mockUser));
                window.location.href = '../weather/dashboard.html';
            }, 1200);
        });
    }

    const googleBtn = document.getElementById('google-login');
    const fbBtn = document.getElementById('fb-login');
    if (googleBtn) googleBtn.addEventListener('click', () => handleSocialLogin('Google'));
    if (fbBtn) fbBtn.addEventListener('click', () => handleSocialLogin('Facebook'));
});
