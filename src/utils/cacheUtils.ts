import { cacheService } from "@/services/cacheService";

/**
 * Helper functions for cache management across the application
 */
export const cacheUtils = {
  /**
   * Clears all client-accessible cookies
   */
  clearClientCookies: () => {
    try {
      // Get all cookies
      const cookies = document.cookie.split(";");

      // Expire each cookie
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

        // Skip HTTP-only cookies which will be handled by the server
        if (name === "session") continue;

        // Set expiration to a past date to remove the cookie
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }

      return true;
    } catch (error) {
      console.error("Error clearing client cookies:", error);
      return false;
    }
  },

  /**
   * Sets a sign out flag to indicate logout is in progress
   * This helps prevent layout flickering during sign out
   */
  setSigningOut: (value: boolean) => {
    try {
      if (value) {
        // Store signing out state in sessionStorage
        sessionStorage.setItem("app:signing-out", "true");
      } else {
        sessionStorage.removeItem("app:signing-out");
      }
      return true;
    } catch (error) {
      console.error("Error setting signing out state:", error);
      return false;
    }
  },

  /**
   * Checks if user is currently signing out
   */
  isSigningOut: () => {
    try {
      return sessionStorage.getItem("app:signing-out") === "true";
    } catch (error) {
      console.error("Error checking signing out state:", error);
      return false;
    }
  },

  /**
   * Clear all application caches and local storage during logout
   * This provides a central place to manage all cache clearing logic
   */
  clearOnLogout: () => {
    try {
      // 1. Set signing out flag first
      cacheUtils.setSigningOut(true);

      // 2. Clear all cache data from cacheService
      cacheService.clearAllOnLogout();

      // 3. Clear sessionStorage (except our signing-out flag)
      const signingOut = sessionStorage.getItem("app:signing-out");
      sessionStorage.clear();
      if (signingOut) {
        sessionStorage.setItem("app:signing-out", signingOut);
      }

      // 4. Clear client cookies
      cacheUtils.clearClientCookies();

      console.log("All cache data cleared successfully during logout");
      return true;
    } catch (error) {
      console.error("Error clearing caches:", error);
      return false;
    }
  },

  /**
   * Invalidate all caches related to a specific data type
   * @param type The data type to invalidate (e.g., 'events', 'members', 'dashboard')
   */
  invalidateType: (type: string) => {
    try {
      cacheService.invalidateByPrefix(`${type}:`);
      return true;
    } catch (error) {
      console.error(`Error invalidating ${type} caches:`, error);
      return false;
    }
  },
};
