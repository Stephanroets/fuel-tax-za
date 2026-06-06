"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TripLogForm } from "@/components/forms/trip-log-form";

export default function NewTripPage() {
  const router = useRouter();

  const handleSubmit = async (data: Parameters<typeof TripLogForm>[0] extends { onSubmit?: (data: infer T) => unknown } ? T : never) => {
    // TODO: call the trips API endpoint
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Redirect back to logbook
    router.push("/dashboard/logbook");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Log Trip</h1>
              <p className="text-sm text-muted-foreground">SARS Compliant Entry</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <TripLogForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
