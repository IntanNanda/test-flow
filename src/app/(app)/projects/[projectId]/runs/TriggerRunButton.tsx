"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Play } from "lucide-react";
import { toast } from "sonner";

export function TriggerRunButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          environment: "production",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? "Failed to trigger run");
        return;
      }

      toast.success("Test run triggered!");
      router.push(`/projects/${projectId}/runs/${data.run.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      loading={loading}
      leftIcon={<Play className="h-4 w-4" />}
    >
      Trigger run
    </Button>
  );
}
