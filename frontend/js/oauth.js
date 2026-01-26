/**
 * OAuth Handler - Google and Facebook Authentication
 * Initialize OAuth SDKs and handle authentication flows
 */

// ⚠️ IMPORTANT: Add your real credentials here!
// Get Google Client ID from: https://console.cloud.google.com/
// Get Facebook App ID from: https://developers.facebook.com/

const OAuthHandler = {
  // API base URL
  API_BASE_URL: "http://localhost:5000",

  // Google OAuth Configuration
  // Replace with your actual Google Client ID from https://console.cloud.google.com/
  GOOGLE_CLIENT_ID:
    "450744388795-t12ki85btevbaqrnrkbhih11vu53aq7k.apps.googleusercontent.com", // LEAVE EMPTY OR ADD YOUR REAL ID

  // Facebook OAuth Configuration
  // Replace with your actual Facebook App ID from https://developers.facebook.com/
  FACEBOOK_APP_ID: "878457868404554", // LEAVE EMPTY OR ADD YOUR REAL ID

  /**
   * Initialize OAuth handlers
   */
  init() {
    // Check if credentials are set
    if (!this.GOOGLE_CLIENT_ID || this.GOOGLE_CLIENT_ID.includes("YOUR_")) {
      console.warn(
        "⚠️ GOOGLE: Client ID not set. Please add your Google Client ID to oauth.js line ~17",
      );
      this.showOAuthWarning("google");
    }

    if (!this.FACEBOOK_APP_ID || this.FACEBOOK_APP_ID.includes("YOUR_")) {
      console.warn(
        "⚠️ FACEBOOK: App ID not set. Please add your Facebook App ID to oauth.js line ~21",
      );
      this.showOAuthWarning("facebook");
    }

    this.initGoogle();
    this.initFacebook();
    this.attachEventListeners();
  },

  /**
   * Show warning message for missing credentials
   */
  showOAuthWarning(provider) {
    const btnId =
      provider === "google" ? "google-signin-btn" : "facebook-signin-btn";
    const btn = document.getElementById(btnId);

    if (btn) {
      btn.disabled = true;
      btn.title = `${provider.charAt(0).toUpperCase() + provider.slice(1)} credentials not configured. See console.`;
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    }
  },

  /**
   * Initialize Google Identity Services
   */
  initGoogle() {
    if (typeof google === "undefined") {
      console.warn("Google Identity Services not loaded");
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: this.GOOGLE_CLIENT_ID,
        callback: this.handleGoogleResponse.bind(this),
      });

      // Render Google button as fallback
      const googleSigninBtn = document.getElementById("google-signin-btn");
      if (googleSigninBtn) {
        google.accounts.id.renderButton(googleSigninBtn, {
          theme: "outline",
          size: "large",
          type: "standard",
        });
      }
    } catch (error) {
      console.error("Failed to initialize Google OAuth:", error);
    }
  },

  /**
   * Initialize Facebook SDK
   */
  initFacebook() {
    if (typeof FB === "undefined") {
      console.warn("Facebook SDK not loaded");
      return;
    }

    try {
      FB.init({
        appId: this.FACEBOOK_APP_ID,
        xfbml: true,
        version: "v18.0",
      });
    } catch (error) {
      console.error("Failed to initialize Facebook OAuth:", error);
    }
  },

  /**
   * Attach event listeners to OAuth buttons
   */
  attachEventListeners() {
    // Login form OAuth buttons
    const googleSigninBtn = document.getElementById("google-signin-btn");
    const facebookSigninBtn = document.getElementById("facebook-signin-btn");

    if (googleSigninBtn) {
      googleSigninBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.triggerGoogleSignin();
      });
    }

    if (facebookSigninBtn) {
      facebookSigninBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.triggerFacebookLogin();
      });
    }

    // Register form OAuth buttons
    const googleRegisterBtn = document.getElementById("google-register-btn");
    const facebookRegisterBtn = document.getElementById(
      "facebook-register-btn",
    );

    if (googleRegisterBtn) {
      googleRegisterBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.triggerGoogleSignin();
      });
    }

    if (facebookRegisterBtn) {
      facebookRegisterBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.triggerFacebookLogin();
      });
    }
  },

  /**
   * Trigger Google Sign-In
   */
  triggerGoogleSignin() {
    if (typeof google === "undefined") {
      this.showMessage(
        "Google Sign-In is not available. Please try again later.",
        "error",
      );
      return;
    }

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Prompt not shown, trigger One Tap
        google.accounts.id.renderButton(document.createElement("div"), {
          theme: "outline",
          size: "large",
        });
      }
    });
  },

  /**
   * Handle Google OAuth Response
   */
  async handleGoogleResponse(response) {
    try {
      this.showMessage("", "");
      this.setSubmitting(true);

      // Decode JWT to get user info
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      const userData = JSON.parse(jsonPayload);

      // Send to backend
      const result = await this.sendOAuthToBackend(
        {
          email: userData.email,
          name: userData.name,
          providerId: userData.sub,
          profilePicture: userData.picture,
        },
        "/api/auth/google",
      );

      // Handle successful authentication
      this.handleAuthSuccess(result.user);
    } catch (error) {
      this.showMessage(
        error.message || "Google sign-in failed. Please try again.",
        "error",
      );
    } finally {
      this.setSubmitting(false);
    }
  },

  /**
   * Trigger Facebook Login
   */
  triggerFacebookLogin() {
    if (typeof FB === "undefined") {
      this.showMessage(
        "Facebook Login is not available. Please try again later.",
        "error",
      );
      return;
    }

    FB.login(
      (response) => {
        if (response.authResponse) {
          this.handleFacebookResponse(response);
        } else {
          this.showMessage("Facebook login failed. Please try again.", "error");
        }
      },
      { scope: "public_profile,email" },
    );
  },

  /**
   * Handle Facebook Login Response
   */
  async handleFacebookResponse(response) {
    try {
      this.showMessage("", "");
      this.setSubmitting(true);

      // Get user info from Facebook
      FB.api("/me", { fields: "id,name,email,picture" }, async (userInfo) => {
        try {
          // Send to backend
          const result = await this.sendOAuthToBackend(
            {
              email: userInfo.email,
              name: userInfo.name,
              providerId: userInfo.id,
              profilePicture: userInfo.picture?.data?.url || null,
            },
            "/api/auth/facebook",
          );

          // Handle successful authentication
          this.handleAuthSuccess(result.user);
        } catch (error) {
          this.showMessage(
            error.message || "Facebook login failed. Please try again.",
            "error",
          );
          this.setSubmitting(false);
        }
      });
    } catch (error) {
      this.showMessage(
        error.message || "Facebook login failed. Please try again.",
        "error",
      );
      this.setSubmitting(false);
    }
  },

  /**
   * Send OAuth data to backend
   */
  async sendOAuthToBackend(oauthData, endpoint) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(oauthData),
    };

    let response;
    try {
      response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);
    } catch (networkError) {
      throw new Error("Network error. Please check your connection.");
    }

    const data = await response.json();

    if (!response.ok) {
      const msg =
        data?.message || response.statusText || "Authentication failed";
      throw new Error(msg);
    }

    return data;
  },

  /**
   * Handle successful authentication
   */
  handleAuthSuccess(user) {
    if (!user) {
      this.showMessage("Authentication failed. Please try again.", "error");
      return;
    }

    // Save user data to auth config
    AuthConfig.setUser(user, "oauth-token-" + Date.now());

    this.showMessage(`Welcome, ${user.name}! Redirecting...`, "success");

    // Redirect to home page after 1.5 seconds
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  },

  /**
   * Show message to user
   */
  showMessage(text, type = "info") {
    const messageEl = document.getElementById("auth-message");
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `auth-message ${type}`;
  },

  /**
   * Set loading state for buttons
   */
  setSubmitting(isSubmitting) {
    const buttons = document.querySelectorAll(".oauth-btn");
    buttons.forEach((btn) => {
      btn.disabled = isSubmitting;
      btn.setAttribute("aria-busy", String(isSubmitting));
    });
  },
};

// Initialize OAuth when DOM is ready
function readyOAuth(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

readyOAuth(() => {
  OAuthHandler.init();
});
