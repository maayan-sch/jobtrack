import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

test("renders the human label for a status", () => {
  render(<StatusBadge status="phone_screen" />);
  expect(screen.getByText("Phone screen")).toBeInTheDocument();
});
