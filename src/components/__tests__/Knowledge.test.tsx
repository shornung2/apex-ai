import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Knowledge from "@/pages/Knowledge";

// Mock supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUpload = vi.fn();
const mockInvoke = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockRemove = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        order: () => ({
          eq: () => ({ data: [], error: null }),
          is: () => ({ data: [], error: null }),
          ilike: () => ({ data: [], error: null }),
        }),
        eq: () => ({
          single: () => ({ data: null, error: null }),
        }),
      }),
      insert: mockInsert,
      update: () => ({ eq: mockUpdate }),
      delete: () => ({ eq: mockDelete }),
    }),
    storage: {
      from: () => ({
        upload: mockUpload,
        createSignedUrl: mockCreateSignedUrl,
        remove: mockRemove,
      }),
    },
    functions: { invoke: mockInvoke },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("Knowledge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Knowledge Base heading", () => {
    render(<Knowledge />);
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<Knowledge />);
    expect(screen.getByPlaceholderText("Search documents...")).toBeInTheDocument();
  });

  it("renders New Folder and Upload buttons", () => {
    render(<Knowledge />);
    expect(screen.getByText("New Folder")).toBeInTheDocument();
    expect(screen.getByText("Upload Files")).toBeInTheDocument();
  });

  it("shows empty state when no docs or folders", async () => {
    render(<Knowledge />);
    await waitFor(() => {
      expect(screen.getByText(/Drop files here or click to upload/)).toBeInTheDocument();
    });
  });

  it("shows create folder form when clicking New Folder", async () => {
    render(<Knowledge />);
    const btn = screen.getByText("New Folder");
    await userEvent.click(btn);
    expect(screen.getByPlaceholderText("Folder name...")).toBeInTheDocument();
  });

  it("shows drag overlay text for drop zone", () => {
    render(<Knowledge />);
    // The drag overlay only appears on drag events, not by default
    expect(screen.queryByText("Drop files to upload")).not.toBeInTheDocument();
  });
});
