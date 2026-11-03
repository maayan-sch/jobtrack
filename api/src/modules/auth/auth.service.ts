import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../config.js";
import { conflict, notFound, unauthorized } from "../../lib/errors.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  type UserRow,
} from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const BCRYPT_ROUNDS = 12;
// Used when the email does not exist, so login takes the same time either way
// (prevents timing-based user enumeration).
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    createdAt: user.created_at,
  };
}
export type PublicUser = ReturnType<typeof toPublicUser>;

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN_SECONDS,
  });
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, config.JWT_SECRET);
  if (typeof payload === "string" || !payload.sub)
    throw unauthorized("Invalid token");
  return payload.sub;
}

export async function register(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw conflict("Email is already registered");
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await createUser({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
  });
  return { user: toPublicUser(user), token: signToken(user.id) };
}

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  const ok = await bcrypt.compare(
    input.password,
    user?.password_hash ?? DUMMY_HASH,
  );
  if (!user || !ok) throw unauthorized("Invalid email or password");
  return { user: toPublicUser(user), token: signToken(user.id) };
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) throw notFound("User");
  return toPublicUser(user);
}
