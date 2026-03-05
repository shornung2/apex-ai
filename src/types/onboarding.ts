export type OnboardingPhase = "immerse" | "observe" | "demonstrate";

export type SuccessProfileSkillItem = {
  id: string;
  category: "hard_skill" | "soft_skill" | "behavioral" | "knowledge_area";
  label: string;
  description: string;
  isRolePlayRubricItem?: boolean;
};

export type PhaseConfig = {
  phase: OnboardingPhase;
  durationDays: number;
  objectives: string[];
};

export type SuccessProfile = {
  id: string;
  tenantId: string;
  roleName: string;
  roleDescription: string;
  department: string;
  items: SuccessProfileSkillItem[];
  phaseConfigs: PhaseConfig[];
  elevatorPitchTopic: string;
  capstoneScenarioDescription: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingProgram = {
  id: string;
  tenantId: string;
  successProfileId: string;
  name: string;
  phaseContent: {
    phase: OnboardingPhase;
    assignedKbDocumentIds: string[];
    checkpointQuestions: {
      id: string;
      question: string;
      passingThreshold?: number;
    }[];
  }[];
  enforceCheckpointGating: boolean;
  createdAt: string;
};

export type OnboardingAssignment = {
  id: string;
  tenantId: string;
  programId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  currentPhase: OnboardingPhase;
  startedAt: string;
  phaseDeadlines: {
    phase: OnboardingPhase;
    dueDate: string;
  }[];
  phaseCompletedAt: Partial<Record<OnboardingPhase, string>>;
  status: "active" | "completed" | "paused";
};

export type NotebookEntryType = "observation" | "question" | "insight" | "key_learning";

export type NotebookEntry = {
  id: string;
  assignmentId: string;
  userId: string;
  phase: OnboardingPhase;
  entryType: NotebookEntryType;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CheckpointResponse = {
  id: string;
  assignmentId: string;
  programId: string;
  phase: OnboardingPhase;
  questionId: string;
  question: string;
  userResponse: string;
  agentScore: number;
  agentFeedback: string;
  evaluatedAt: string;
};

export type RolePlaySessionType = "elevator_pitch" | "capstone_prep";

export type RolePlaySession = {
  id: string;
  assignmentId: string;
  userId: string;
  sessionType: RolePlaySessionType;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  isComplete: boolean;
  overallScore?: number;
  rubricScores?: { rubricItemId: string; label: string; score: number; feedback: string }[];
  summaryFeedback?: string;
  startedAt: string;
  completedAt?: string;
};
