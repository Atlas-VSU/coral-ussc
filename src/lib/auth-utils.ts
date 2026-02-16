/**
 * This utility file contains functions for managing the session cookie.
 * This code runs on the client-side (in the browser).
 */

/**
 * Sets a session cookie to indicate that the user is logged in.
 * The middleware will check for this cookie.
 * @param {number} days - The number of days until the cookie expires.
 */
export function setSessionCookie(days: number = 7) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  // Set a simple 'session=true' cookie accessible across the site.
  document.cookie = "session=true" + expires + "; path=/";
  console.log("Session cookie set.");
}

/**
 * Deletes the session cookie upon logout.
 */
export function clearSessionCookie() {
  document.cookie = "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  console.log("Session cookie cleared.");
}
