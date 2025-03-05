import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  steps: { id: number; name: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center">
        <ol className="flex items-center w-full max-w-3xl">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "rounded-md font-medium h-12 w-12 flex items-center justify-center transition-all",
                    step.id < currentStep
                      ? "bg-green-50 text-green-600 border border-green-200"
                      : step.id === currentStep
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-50 text-gray-400 border border-gray-200"
                  )}
                >
                  {step.id}
                </div>
                <span className={cn(
                  "text-sm mt-2 font-medium",
                  step.id === currentStep ? "text-primary" : "text-gray-500"
                )}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-[2px] w-16 md:w-28 mx-2",
                  step.id < currentStep 
                    ? "bg-primary" 
                    : "bg-gray-200"
                )}></div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
