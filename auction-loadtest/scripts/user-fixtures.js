// This file provides pre-seeded user data to k6 virtual users (VUs).

import { SharedArray } from "k6/data";

// SharedArray loads the user data into memory once and shares it across all virtual users (VUs).
// This saves a lot of memory compared to loading the file separately for each VU.
// By default, it reads from "../data/users.json".
export const users = new SharedArray("users", () => JSON.parse(open(__ENV.USERS_FILE || "../data/users.json")));

// Helper function to pick a specific user for the current virtual user (VU).
// __VU is the 1-based index of the virtual user running the test.
// Using modulo (%) ensures each VU gets assigned a predictable user, looping if there are more VUs than users.
export function userForVU() {
  return users[(__VU - 1) % users.length];
}
