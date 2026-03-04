import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import JobDetail from "@/pages/JobDetail";

const mockJob = {
  id: "j1",
  title: "Test Job",
  agent_type: "researcher",
  department: "sales",
  status: "complete",
  created_at: "2026-01-01T00:00:00Z",
  completed_at: "2026-01-01T00:01:00Z",
  tokens_used: 500,
  confidence_score: 90,
  output: "# Hello\nThis is the output.",
  inputs: { topic: "AI" },
  feedback_rating: null,
  feedback_note: null,
  file_url: null,
  skill_id: "s1",
};

let resolveSelect: any;
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockJob }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({}),
      }),
    }),
    storage: { from: () => ({ createSignedUrl: () => Promise.resolve({ data: null }) }) },
  },
}));

vi.mock("@/lib/agent-client", () => ({
  subscribeToJob: () => () => {},
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

function renderJobDetail() {
  return render(
    <MemoryRouter initialEntries={["/jobs/j1"]}>
      <Routes>
        <Route path="/jobs/:jobId" element={<JobDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("JobDetail", () => {
  it("renders loading state initially", () => {
    renderJobDetail();
    // The component shows a loader before data loads
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows feedback section text for completed jobs", async () => {
    renderJobDetail();
    // Wait for the feedback section
    const feedbackText = await screen.findByText("Was this output useful?", {}, { timeout: 3000 });
    expect(feedbackText).toBeInTheDocument();
  });

  it("shows ThumbsUp and ThumbsDown buttons", async () => {
    renderJobDetail();
    await screen.findByText("Was this output useful?", {}, { timeout: 3000 });
    // Both buttons should exist
    const buttons = document.querySelectorAll("button.h-8.w-8");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
