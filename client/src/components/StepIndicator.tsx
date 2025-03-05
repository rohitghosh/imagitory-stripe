import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  steps: { id: number; name: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <ol className="flex items-center w-full max-w-3xl">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "rounded-full font-bold h-10 w-10 flex items-center justify-center",
                    step.id < currentStep
                      ? "bg-success text-white"
                      : step.id === currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-300 text-white"
                  )}
                >
                  {step.id}
                </div>
                <span className="text-sm font-medium mt-2">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="h-1 w-12 md:w-24 bg-gray-200 mx-2"></div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
