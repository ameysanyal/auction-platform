import { z } from "zod";

// Definition matching the 'Schemas' interface expected by your middleware
export const registerSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"), // Note: z.string().email(), not z.email()
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
  // params: z.object({ ... }) -> optional, omit if not needed
  // query: z.object({ ... }) -> optional, omit if not needed
};