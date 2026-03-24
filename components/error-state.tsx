'use client';

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  onBack
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{message}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              Try Again
            </Button>
          )}
          {onBack && (
            <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
