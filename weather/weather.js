document.addEventListener('DOMContentLoaded', () => {
    // Authentication Check
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.replace('../auth/login.html');
        return;
    }

    // Set Welcome Name
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.name) {
        document.getElementById('user-greeting').innerText = `Hi, ${currentUser.name.split(' ')[0]}`;
    }

    // UI Elements
    const cityInput = document.getElementById('city-search');
    const countrySelect = document.getElementById('country-select');
    const logoutBtn = document.getElementById('logout-btn');
    const preloader = document.getElementById('preloader');
    const dashboard = document.getElementById('dashboard');

    // DOM Elements for Weather
    const cityNameEl = document.getElementById('city-name');
    const dateTimeEl = document.getElementById('date-time');
    const currentTempEl = document.getElementById('current-temp');
    const feelsLikeEl = document.getElementById('feels-like');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    const pressureEl = document.getElementById('pressure');
    const descEl = document.getElementById('weather-desc');
    const mainIconEl = document.getElementById('main-weather-icon');
    const hourlyForecastContainer = document.getElementById('hourly-forecast');

    // Web Audio API helper for sound effects
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
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.6);
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

    // Logout Functionality
    logoutBtn.addEventListener('click', () => {
        playSound('click');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.replace('../auth/login.html');
    });

    // Update Date Time dynamically
    function updateDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        dateTimeEl.innerText = now.toLocaleDateString('en-US', options);
    }
    updateDate();
    setInterval(updateDate, 60000); // update every minute

    // Detailed Weather mapping (Desc, Icon, and Dynamic Theme)
    function getWeatherDetails(code) {
        const mapping = {
            0: { desc: 'Clear sky', icon: 'fa-sun', type: 'clear' },
            1: { desc: 'Mainly clear', icon: 'fa-sun', type: 'clear' },
            2: { desc: 'Partly cloudy', icon: 'fa-cloud-sun', type: 'clouds' },
            3: { desc: 'Overcast', icon: 'fa-cloud', type: 'clouds' },
            45: { desc: 'Fog', icon: 'fa-smog', type: 'clouds' },
            48: { desc: 'Fog', icon: 'fa-smog', type: 'clouds' },
            51: { desc: 'Light drizzle', icon: 'fa-cloud-rain', type: 'rain' },
            53: { desc: 'Moderate drizzle', icon: 'fa-cloud-rain', type: 'rain' },
            55: { desc: 'Dense drizzle', icon: 'fa-cloud-showers-heavy', type: 'rain' },
            61: { desc: 'Slight rain', icon: 'fa-cloud-rain', type: 'rain' },
            63: { desc: 'Moderate rain', icon: 'fa-cloud-showers-heavy', type: 'rain' },
            65: { desc: 'Heavy rain', icon: 'fa-cloud-showers-water', type: 'rain' },
            71: { desc: 'Slight snow', icon: 'fa-snowflake', type: 'snow' },
            73: { desc: 'Moderate snow', icon: 'fa-snowflake', type: 'snow' },
            75: { desc: 'Heavy snow', icon: 'fa-snowflake', type: 'snow' },
            95: { desc: 'Thunderstorm', icon: 'fa-cloud-bolt', type: 'rain' }
        };
        return mapping[code] || { desc: 'Scattered Clouds', icon: 'fa-cloud', type: 'default' };
    }

    function setDynamicTheme(type) {
        // Updated to use deep, rich, high-contrast, premium gradients
        const themes = {
            clear: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', // Deep modern blue
            clouds: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', // Moody steel blue
            rain: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', // Midnight stormy
            snow: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)', // Frosty night
            default: 'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)' // Elegant emerald fallback
        };
        const selectedTheme = themes[type] || themes['default'];
        document.body.style.setProperty('--dynamic-bg', selectedTheme);
    }

    // Fetch Weather Logic setup
    async function fetchWeather(city) {
        try {
            // Geocoding API
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                showToast(`Location "${city}" not found. Please try a valid city or country!`, 'error');
                preloader.style.opacity = '0';
                setTimeout(() => { preloader.className = 'hidden'; }, 500);
                return;
            }

            playSound('success');

            const loc = geoData.results[0];
            const lat = loc.latitude;
            const lon = loc.longitude;

            // Format nice string
            cityNameEl.innerText = `${loc.name}, ${loc.country || ''}`;

            // Weather API (Current, Hourly & Daily)
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
            const weatherRes = await fetch(url);
            const weatherData = await weatherRes.json();

            // Populate Current Weather
            const current = weatherData.current;
            const details = getWeatherDetails(current.weather_code);

            currentTempEl.innerText = `${Math.round(current.temperature_2m)}°`;
            feelsLikeEl.innerText = `${Math.round(current.apparent_temperature)}°`;
            humidityEl.innerText = `${current.relative_humidity_2m}%`;
            windSpeedEl.innerText = `${current.wind_speed_10m} km/h`;
            pressureEl.innerText = `${current.surface_pressure} hPa`;
            descEl.innerText = details.desc;

            // Set dynamic icon and theme
            mainIconEl.className = `fa-solid ${details.icon}`;
            setDynamicTheme(details.type);

            // Populate 24-Hour Forecast
            const hourly = weatherData.hourly;
            hourlyForecastContainer.innerHTML = ''; // prevent stacking

            // Find current hour index
            const now = new Date();
            // Match ISO hour format from API (e.g. 2026-04-16T14:00) 
            const currentTimeStr = now.toISOString().slice(0, 13) + ':00';
            let startIndex = hourly.time.findIndex(t => t.startsWith(now.toISOString().slice(0, 13)));

            if (startIndex === -1) startIndex = 0;

            // Iterate 24 hours into the future
            for (let i = startIndex; i < startIndex + 24; i++) {
                if (!hourly.time[i]) break; // bounds check

                const timeDate = new Date(hourly.time[i]);
                const timeString = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g. "02:00 PM"
                const hTemp = Math.round(hourly.temperature_2m[i]);
                const hDetails = getWeatherDetails(hourly.weather_code[i]);

                // Construct HTML item
                const item = document.createElement('div');
                item.className = 'hourly-item';
                item.innerHTML = `
                    <p class="hourly-time">${timeString}</p>
                    <div class="hourly-icon"><i class="fa-solid ${hDetails.icon}"></i></div>
                    <p class="hourly-temp">${hTemp}°</p>
                `;
                hourlyForecastContainer.appendChild(item);
            }

            // Populate 7-Day Forecast
            const daily = weatherData.daily;
            const dailyContainer = document.getElementById('daily-forecast');
            if (dailyContainer) {
                dailyContainer.innerHTML = '';
                
                for(let i = 0; i < daily.time.length; i++) {
                    if (i >= 7) break; // ensuring 7 days max
                    const date = new Date(daily.time[i]);
                    const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                    const maxTemp = Math.round(daily.temperature_2m_max[i]);
                    const minTemp = Math.round(daily.temperature_2m_min[i]);
                    const wd = getWeatherDetails(daily.weather_code[i]);

                    const dItem = document.createElement('div');
                    dItem.className = 'daily-item fade-in';
                    dItem.style.animationDelay = `${0.3 + (i * 0.1)}s`;
                    dItem.innerHTML = `
                        <div class="daily-day">${dayName}</div>
                        <div class="daily-icon"><i class="fa-solid ${wd.icon}"></i></div>
                        <div class="daily-temp-range"><strong>${maxTemp}°</strong><br><span style="font-size:0.85em; opacity:0.8;">${minTemp}°</span></div>
                    `;
                    dailyContainer.appendChild(dItem);
                }
            }

            // Hide loader gently
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.className = 'hidden';
                dashboard.classList.remove('hidden');
            }, 500);

        } catch (error) {
            console.error(error);
            showToast("Failed to fetch. Please check your spelling.", "error");
            preloader.style.opacity = '0';
            setTimeout(() => { preloader.className = 'hidden'; }, 500);
        }
    }

    // Handlers
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                playSound('click');
                preloader.className = 'preloader';
                preloader.style.opacity = '1';
                fetchWeather(city);
            }
            cityInput.value = '';
        }
    });

    countrySelect.addEventListener('change', (e) => {
        playSound('click');
        preloader.className = 'preloader';
        preloader.style.opacity = '1';
        fetchWeather(e.target.value);
    });

    // Initial Load - Default City (or from landing page)
    const initCity = localStorage.getItem('landingSearchCity') || 'New York';
    fetchWeather(initCity);
    if(localStorage.getItem('landingSearchCity')) {
        localStorage.removeItem('landingSearchCity');
        cityInput.value = initCity;
    }
    // Simple toast helper (reused pattern)
    function showToast(msg, type = 'error') {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.className = `toast ${type} show`;
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }
});
