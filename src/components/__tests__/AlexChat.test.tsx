import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlexChat } from "@/components/AlexChat";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { document: { content: "test content" } }, error: null }),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("AlexChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the floating chat button", () => {
    render(<AlexChat />);
    expect(screen.getByLabelText("Chat with Alex")).toBeInTheDocument();
  });

  it("opens chat panel when button is clicked", async () => {
    render(<AlexChat />);
    await userEvent.click(screen.getByLabelText("Chat with Alex"));
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("shows welcome message when opened", async () => {
    render(<AlexChat />);
    await userEvent.click(screen.getByLabelText("Chat with Alex"));
    expect(screen.getByText("Hi! I'm Alex 👋")).toBeInTheDocument();
  });

  it("has paperclip attachment button in chat", async () => {
    render(<AlexChat />);
    await userEvent.click(screen.getByLabelText("Chat with Alex"));
    // Paperclip button exists
    const buttons = screen.getAllByRole("button");
    const paperclipBtn = buttons.find((b) => b.querySelector("svg.lucide-paperclip"));
    expect(paperclipBtn).toBeTruthy();
  });

  it("disables send button when input is empty", async () => {
    render(<AlexChat />);
    await userEvent.click(screen.getByLabelText("Chat with Alex"));
    const sendBtn = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-send"));
    expect(sendBtn).toBeDisabled();
  });

  it("closes chat panel when X is clicked", async () => {
    render(<AlexChat />);
    await userEvent.click(screen.getByLabelText("Chat with Alex"));
    expect(screen.getByText("Alex")).toBeInTheDocument();
    // Find close button (the X icon button in header)
    const closeBtn = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-x"));
    if (closeBtn) await userEvent.click(closeBtn);
    expect(screen.getByLabelText("Chat with Alex")).toBeInTheDocument();
  });
});
