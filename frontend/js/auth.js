// Centralized API base URL
const API_BASE_URL = "http://localhost:5000";

// Generic API request helper
async function apiRequest(endpoint, method = "GET", payload) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (payload !== undefined) {
    options.body = JSON.stringify(payload);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch (networkError) {
    throw new Error("Network error. Please check your connection.");
  }

  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text };
  }

  if (!response.ok) {
    const msg =
      data?.message || data?.error || response.statusText || "Unexpected error";
    throw new Error(msg);
  }

  return data;
}

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

ready(() => {
  // Elements
  const titleEl = document.getElementById("form-title");
  const underlineEl = document.querySelector(".underline");
  const messageEl = document.getElementById("auth-message");

  const loginForm = document.getElementById("login-form");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginSubmitBtn = document.getElementById("login-submit");
  const showRegisterBtn = document.getElementById("show-register-btn");


  const registerForm = document.getElementById("register-form");
  const registerName = document.getElementById("register-name");
  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-password");
  const registerConfirmPassword = document.getElementById(
    "register-confirm-password"
  );
  const registerSubmitBtn = document.getElementById("register-submit");
  const showLoginBtn = document.getElementById("show-login-btn");

  // Helpers
  function showMessage(text, type = "info") {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `auth-message ${type}`; // expects CSS to style .auth-message.success / .error
  }

  function setSubmitting(btn, isSubmitting) {
    if (!btn) return;
    btn.disabled = isSubmitting;
    btn.setAttribute("aria-busy", String(isSubmitting));
  }

  function showLogin() {
    registerForm.hidden = true;
    loginForm.hidden = false;
    titleEl.textContent = "Sign In";
    showMessage("");
    if (underlineEl) underlineEl.style.transform = "translateX(35px)";
  }

  function showRegister() {
    loginForm.hidden = true;
    registerForm.hidden = false;
    titleEl.textContent = "Sign Up";
    showMessage("");
    if (underlineEl) underlineEl.style.transform = "translateX(0)";
  }

  // Toggle buttons
  showRegisterBtn.addEventListener("click", showRegister);
  showLoginBtn.addEventListener("click", showLogin);

  // Ensure login visible by default
  showLogin();

  // Submit handlers
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("");
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    if (!email || !password) {
      showMessage("Please enter email and password.", "error");
      return;
    }

    setSubmitting(loginSubmitBtn, true);
    try {
      const res = await apiRequest("/api/auth/login", "POST", {
        email,
        password,
      });
      const user = res?.user || res;
      const token = res?.token;
      console.log("Login success:", user);

      // Save user data and token to auth config
      AuthConfig.setUser(user, token);

      showMessage("Login successful. Redirecting...", "success");
      // Redirect to home page after 1.5 seconds
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (err) {
      showMessage(err.message || "Login failed.", "error");
    } finally {
      setSubmitting(loginSubmitBtn, false);
    }
  });

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");

  const name = registerName.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value.trim();
  const confirmPassword = registerConfirmPassword.value.trim();

  if (!name || !email || !password || !confirmPassword) {
    showMessage("Please fill in all fields.", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  setSubmitting(registerSubmitBtn, true);

  try {
    await apiRequest("/api/auth/register", "POST", {
      name,
      email,
      password,
    });

    showMessage("Account created successfully. Please sign in.", "success");

    registerForm.reset(); // optional but nice

    setTimeout(() => {
      showLogin(); // switch to Sign In form
    }, 1500);
  } catch (err) {
    showMessage(err.message || "Registration failed.", "error");
  } finally {
    setSubmitting(registerSubmitBtn, false);
  }
});

  // Also hook buttons to trigger form submission (for explicit requirement)
  loginSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.requestSubmit();
  });
  registerSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.requestSubmit();
  });
});
