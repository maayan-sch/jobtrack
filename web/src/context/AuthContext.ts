import { createContext } from "react";
import type { User } from "../api/types";

interface LoginInput {
  email: string;
  password: string;
}
interface RegisterInput extends LoginInput {
  fullName: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
export type { LoginInput, RegisterInput, AuthContextValue };
