import React from "react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  name: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  index < currentStep - 1
                    ? "bg-green-500 text-white"
                    : index === currentStep - 1
                      ? "bg-imaginory-yellow text-imaginory-black shadow-sm"
                      : "bg-gray-200 text-gray-500"
                )}
              >
                {step.id}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm font-medium transition-colors",
                  index === currentStep - 1
                    ? "text-imaginory-black"
                    : "text-gray-500"
                )}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 transition-colors",
                  index < currentStep - 1
                    ? "bg-green-500"
                    : "bg-gray-200"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
