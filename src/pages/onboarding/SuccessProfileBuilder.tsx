import { useParams } from "react-router-dom";

export default function SuccessProfileBuilder() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">
        {id ? "Edit Success Profile" : "New Success Profile"}
      </h1>
      <p className="text-sm text-muted-foreground">Build a role-readiness success profile.</p>
    </div>
  );
}
