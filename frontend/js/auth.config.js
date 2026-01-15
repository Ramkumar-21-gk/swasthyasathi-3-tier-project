/**
 * Auth Config - Centralized authentication state management
 * Manages user login state, token storage, and scan limits
 */

const AuthConfig = {
  // Check if user is logged in
  get isLoggedIn() {
    return localStorage.getItem("userToken") !== null;
  },

  // Get stored user data
  get user() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Get user token
  get token() {
    return localStorage.getItem("userToken");
  },

  // Get current scan count (for non-logged-in users)
  get scanCount() {
    return parseInt(localStorage.getItem("scanCount") || "0");
  },

  // Check if scan limit reached (3 scans for non-logged-in users)
  get canScan() {
    if (this.isLoggedIn) return true;
    return this.scanCount < 3;
  },

  // Get remaining scans for non-logged-in users
  get remainingScans() {
    if (this.isLoggedIn) return -1; // Unlimited
    return Math.max(0, 3 - this.scanCount);
  },

  /**
   * Set user data and token (called on successful login/register)
   * @param {Object} user - User data object with id, name, email
   * @param {string} token - Authentication token from backend
   */
  setUser(user, token) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userToken", token);
    localStorage.setItem("scanCount", "0"); // Reset scan counter on login
  },

  /**
   * Clear auth data (called on logout)
   */
  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("userToken");
    localStorage.setItem("scanCount", "0"); // Reset counter
    window.location.href = "index.html"; // Redirect to home
  },

  /**
   * Increment scan count for non-logged-in users
   * @returns {number} New scan count
   */
  incrementScan() {
    const current = parseInt(localStorage.getItem("scanCount") || "0");
    const newCount = current + 1;
    localStorage.setItem("scanCount", newCount);
    return newCount;
  },

  /**
   * Get headers for authenticated API requests
   * @returns {Object} Headers object with authorization token if available
   */
  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  },
};
