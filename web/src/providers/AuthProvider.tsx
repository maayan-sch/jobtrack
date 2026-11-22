import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../api/client";
import type { User } from "../api/types";

import { AuthContext } from "../context/AuthContext";
import type {
  AuthContextValue,
  LoginInput,
  RegisterInput,
} from "../context/AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const { user } = await api<{ user: User }>("/auth/me");
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const login = useMutation({
    mutationFn: (input: LoginInput) =>
      api<{ user: User }>("/auth/login", {
        method: "POST",
        body: input,
      }),
    onSuccess: ({ user }) => queryClient.setQueryData(["me"], user),
  });

  const register = useMutation({
    mutationFn: (input: RegisterInput) =>
      api<{ user: User }>("/auth/register", {
        method: "POST",
        body: input,
      }),
    onSuccess: ({ user }) => queryClient.setQueryData(["me"], user),
  });

  const logout = useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
      queryClient.removeQueries({ queryKey: ["applications"] });
      queryClient.removeQueries({ queryKey: ["stats"] });
    },
  });

  const value: AuthContextValue = {
    user: me.data ?? null,
    isLoading: me.isPending,
    login: async (input) => (await login.mutateAsync(input)).user,
    register: async (input) => (await register.mutateAsync(input)).user,
    logout: () => logout.mutateAsync(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
