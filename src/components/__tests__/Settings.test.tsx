import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "@/pages/Settings";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: (...args: any[]) => {
        const chain: any = {
          eq: () => chain,
          in: () => chain,
          maybeSingle: () => Promise.resolve({ data: null }),
          then: (cb: any) => cb({ data: [], count: 0 }),
        };
        return Object.assign(Promise.resolve({ data: [], count: 0 }), chain);
      },
      upsert: () => Promise.resolve({}),
    }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { valid: false, models: [] } }) },
  },
}));

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "t1", isAdmin: true }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

vi.mock("@/components/TeamWorkspaceSection", () => ({
  default: () => <div>TeamWorkspace</div>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div className={props.className}>{children}</div>,
  },
}));

describe("SettingsPage", () => {
  it("renders Settings heading", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders tab triggers including Usage & Billing", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Usage & Billing")).toBeInTheDocument();
  });

  it("renders Appearance tab", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });
});
