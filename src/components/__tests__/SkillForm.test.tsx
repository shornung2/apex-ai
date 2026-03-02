import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillForm } from "@/components/SkillForm";
import type { Skill } from "@/data/mock-data";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { document: { content: "extracted text" } }, error: null }),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const textSkill: Skill = {
  id: "test-1",
  name: "test_skill",
  displayName: "Test Skill",
  description: "A test skill",
  department: "sales",
  agentType: "researcher",
  emoji: "🧪",
  inputs: [
    { label: "Company Name", type: "text", required: true, placeholder: "Enter company" },
    { label: "Notes", type: "textarea", required: false, placeholder: "Optional notes" },
  ],
  promptTemplate: "Research {{company_name}}",
};

const fileSkill: Skill = {
  id: "test-2",
  name: "file_skill",
  displayName: "File Skill",
  description: "A skill with file input",
  department: "sales",
  agentType: "meeting-prep",
  emoji: "📎",
  inputs: [
    { label: "Company Name", type: "text", required: true, placeholder: "Enter company" },
    { label: "Meeting Notes", type: "file", required: false, hint: "Upload prior meeting notes" },
  ],
  promptTemplate: "Prep for {{company_name}} using {{meeting_notes}}",
};

const selectSkill: Skill = {
  id: "test-3",
  name: "select_skill",
  displayName: "Select Skill",
  description: "Skill with select/radio/multi-select",
  department: "marketing",
  agentType: "content",
  emoji: "📝",
  inputs: [
    { label: "Format", type: "select", required: true, options: ["Short", "Medium", "Long"] },
    { label: "Tone", type: "radio", required: true, options: ["Formal", "Casual"] },
    { label: "Channels", type: "multi-select", required: false, options: ["Email", "Social", "Blog"] },
  ],
  promptTemplate: "Write {{format}} {{tone}} for {{channels}}",
};

describe("SkillForm", () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders text and textarea inputs", () => {
    render(<SkillForm skill={textSkill} onSubmit={mockSubmit} />);
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
  });

  it("renders required indicator", () => {
    render(<SkillForm skill={textSkill} onSubmit={mockSubmit} />);
    const label = screen.getByText("Company Name");
    expect(label.parentElement?.textContent).toContain("*");
  });

  it("renders file input with Attach File button", () => {
    render(<SkillForm skill={fileSkill} onSubmit={mockSubmit} />);
    expect(screen.getByText("Attach File")).toBeInTheDocument();
    expect(screen.getByText("Upload prior meeting notes")).toBeInTheDocument();
  });

  it("renders select, radio, and multi-select inputs", () => {
    render(<SkillForm skill={selectSkill} onSubmit={mockSubmit} />);
    expect(screen.getByText("Formal")).toBeInTheDocument();
    expect(screen.getByText("Casual")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("shows run button with skill name", () => {
    render(<SkillForm skill={textSkill} onSubmit={mockSubmit} />);
    expect(screen.getByText("Run Test Skill")).toBeInTheDocument();
  });

  it("shows Running state when isRunning", () => {
    render(<SkillForm skill={textSkill} onSubmit={mockSubmit} isRunning />);
    expect(screen.getByText("Running...")).toBeInTheDocument();
  });

  it("disables inputs when running", () => {
    render(<SkillForm skill={textSkill} onSubmit={mockSubmit} isRunning />);
    expect(screen.getByPlaceholderText("Enter company")).toBeDisabled();
  });
});
