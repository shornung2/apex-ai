import { useParams } from "react-router-dom";

export default function ProgramBuilder() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {id ? "Edit Program" : "New Program"}
      </h1>
      <p className="text-sm text-muted-foreground">Configure onboarding program phases and checkpoints.</p>
    </div>
  );
}
