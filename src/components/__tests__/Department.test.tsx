import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Department from "@/pages/Department";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [] }),
        in: () => ({
          not: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "t1" }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div className={props.className}>{children}</div>,
  },
}));

function renderDepartment(dept = "sales") {
  return render(
    <MemoryRouter initialEntries={[`/departments/${dept}`]}>
      <Routes>
        <Route path="/departments/:dept" element={<Department />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Department", () => {
  it("renders department heading for sales", () => {
    renderDepartment("sales");
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("renders department heading for marketing", () => {
    renderDepartment("marketing");
    expect(screen.getByText("Marketing")).toBeInTheDocument();
  });

  it("redirects for invalid department", () => {
    renderDepartment("invalid");
    // Navigate component redirects to /, so the department heading won't be shown
    expect(screen.queryByText("invalid")).not.toBeInTheDocument();
  });
});
