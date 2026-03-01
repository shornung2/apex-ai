import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { onSubmit: (data: any) => void };

export function ConciergeForm({ onSubmit }: Props) {
  const { register, handleSubmit } = useForm({
    defaultValues: { query: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>What do you need?</Label>
        <Textarea
          {...register("query", { required: true })}
          placeholder="Ask anything — Alex will route your request to the right agent. Example: 'What do we know about DataVault Inc?' or 'Prep me for tomorrow's call with CloudSync.'"
          className="bg-muted/50 border-border/50 min-h-[120px]"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Alex will analyze your request and dispatch the most appropriate agent(s) automatically.
      </p>
      <Button type="submit" className="w-full">Ask Alex</Button>
    </form>
  );
}
