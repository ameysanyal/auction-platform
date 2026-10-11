// This file sets the base server address for load tests.

// Get the backend API URL from the environment variable (BASE_URL),
// or default to "http://localhost:5050" if none is given.
// .replace(/\/$/, "") removes any trailing slash at the end to keep URL formatting clean.
export const BASE_URL = (__ENV.BASE_URL || "http://localhost:5050").replace(/\/$/, "");
