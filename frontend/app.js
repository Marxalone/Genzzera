// frontend/app.js
const API_BASE = window.location.origin + '/api'; // adjust if backend hosted elsewhere

// UI elements
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loader = document.getElementById('loader');
const toastEl = document.getElementById('toast');

function showLoader() {
  loader.classList.remove('hidden');
}
function hideLoader() {
  loader.classList.add('hidden');
}
function toast(msg, duration = 3000) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastEl.classList.remove('hidden');
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 300);
  }, duration);
}

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  loginForm.classList.add('active'); registerForm.classList.remove('active');
});
tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  registerForm.classList.add('active'); loginForm.classList.remove('active');
});

// Register handler
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  if (password.length < 8) return toast('Password must be at least 8 characters');

  showLoader();
  try {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name,email,password})
    });
    const data = await res.json();
    hideLoader();
    if (!res.ok) return toast(data.message || 'Registration failed');
    // store token
    localStorage.setItem('genzera_token', data.token);
    toast('Account created — logged in');
    // redirect opening page: example /app
    setTimeout(() => window.location.href = '/app', 800);
  } catch(err){
    hideLoader();
    toast('Network error');
    console.error(err);
  }
});

// Login handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  showLoader();
  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email,password})
    });
    const data = await res.json();
    hideLoader();
    if (!res.ok) return toast(data.message || 'Login failed');
    localStorage.setItem('genzera_token', data.token);
    toast('Welcome back!');
    setTimeout(()=> window.location.href = '/app', 700);
  } catch (err) {
    hideLoader();
    toast('Network error');
    console.error(err);
  }
});

// Google / Facebook buttons open OAuth endpoints on server
document.getElementById('google-login').addEventListener('click', () => {
  window.location.href = '/auth/google';
});
document.getElementById('google-register').addEventListener('click', () => {
  window.location.href = '/auth/google';
});
document.getElementById('facebook-login').addEventListener('click', () => {
  // Implement /auth/facebook on backend (Facebook OAuth)
  window.location.href = '/auth/facebook';
});
document.getElementById('facebook-register').addEventListener('click', () => {
  window.location.href = '/auth/facebook';
});

// Example: on page load, check token and validate with backend (re-login check)
(async function checkToken(){
  const token = localStorage.getItem('genzera_token');
  if (!token) return;
  try {
    const res = await fetch(API_BASE + '/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      // user still valid — optionally redirect to /app
      // const user = await res.json();
      // console.log('user', user);
    } else {
      localStorage.removeItem('genzera_token');
    }
  } catch(e){ console.warn('token check failed', e) }
})();