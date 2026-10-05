import { SharedArray } from "k6/data";

export const users = new SharedArray("users", () => JSON.parse(open(__ENV.USERS_FILE || "../data/users.json")));

export function userForVU() {
  return users[(__VU - 1) % users.length];
}
