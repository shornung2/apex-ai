import { useParams } from "react-router-dom";

export default function RolePlaySessionPage() {
  const { sessionType } = useParams<{ sessionType: string }>();
  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">
        Role-Play: {sessionType === "elevator_pitch" ? "Elevator Pitch" : "Capstone Prep"}
      </h1>
      <p className="text-sm text-muted-foreground">Practice and receive AI-scored feedback.</p>
    </div>
  );
}
