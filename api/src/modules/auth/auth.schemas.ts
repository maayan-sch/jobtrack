import { z } from "zod";

const email = z
  .email()
  .max(254)
  .transform((v) => v.trim().toLowerCase());

export const registerSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes of the password
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  fullName: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
