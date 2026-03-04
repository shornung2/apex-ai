import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "../AppLayout";

vi.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ onboardingComplete: false, isLoading: false }),
}));

vi.mock("@/components/AlexChat", () => ({
  AlexChat: () => <div data-testid="alex-chat" />,
}));

vi.mock("@/components/OnboardingWizard", () => ({
  OnboardingWizard: () => <div data-testid="onboarding-wizard">Onboarding</div>,
}));

vi.mock("@/components/AppSidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>,
}));

describe("AppLayout", () => {
  it("renders sidebar", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>Page Content</div>
        </AppLayout>
      </MemoryRouter>
    );
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
  });

  it("shows onboarding wizard when onboardingComplete is false", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>Page Content</div>
        </AppLayout>
      </MemoryRouter>
    );
    expect(screen.getByTestId("onboarding-wizard")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>Page Content</div>
        </AppLayout>
      </MemoryRouter>
    );
    expect(screen.getByText("Page Content")).toBeInTheDocument();
  });
});
