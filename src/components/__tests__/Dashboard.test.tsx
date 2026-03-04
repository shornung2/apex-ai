import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: (cols?: string, opts?: any) => {
        const chain: any = {
          order: () => chain,
          limit: () => chain,
          eq: () => chain,
          then: (cb: any) => cb({
            data: [],
            count: 0,
          }),
        };
        return Object.assign(Promise.resolve({ data: [], count: 0 }), chain);
      },
    }),
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-testid={props["data-testid"]} className={props.className}>{children}</div>,
  },
}));

describe("Dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders stat card labels", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText("Total Runs")).toBeInTheDocument();
    expect(screen.getByText("Tokens Used")).toBeInTheDocument();
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
  });

  it("renders Recent Activity section", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("shows Quick Start banner when localStorage flag is set", () => {
    localStorage.setItem("show_quick_start", "true");
    localStorage.setItem("quick_start_packs", JSON.stringify(["presales"]));
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/Your workspace is ready/)).toBeInTheDocument();
  });

  it("dismisses Quick Start banner on click", () => {
    localStorage.setItem("show_quick_start", "true");
    localStorage.setItem("quick_start_packs", JSON.stringify(["presales"]));
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    const banner = screen.getByText(/Your workspace is ready/);
    expect(banner).toBeInTheDocument();
    // Click the X button (it's a sibling)
    const closeBtn = banner.closest(".relative")?.querySelector("button");
    if (closeBtn) fireEvent.click(closeBtn);
    expect(localStorage.getItem("show_quick_start")).toBeNull();
  });
});
