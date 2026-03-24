import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
