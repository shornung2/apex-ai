import { useParams } from "react-router-dom";

export default function CheckpointSession() {
  const { phase } = useParams<{ phase: string }>();
  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Checkpoint: {phase}</h1>
      <p className="text-sm text-muted-foreground">Demonstrate your knowledge for this phase.</p>
    </div>
  );
}
