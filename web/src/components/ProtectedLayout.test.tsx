import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ProtectedLayout } from "./ProtectedLayout";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

test("redirects unauthenticated users to login", () => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });

  render(
    <MemoryRouter initialEntries={["/applications"]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedLayout />}>
          <Route path="/applications" element={<p>Applications page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText("Login page")).toBeInTheDocument();
  expect(screen.queryByText("Applications page")).not.toBeInTheDocument();
});
