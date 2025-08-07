import { cn } from "@/lib/utils";

interface StoryToggleProps {
  type: "predefined" | "custom";
  onToggle: (type: "predefined" | "custom") => void;
}

export function StoryToggle({ type, onToggle }: StoryToggleProps) {
  return (
    <div className="flex justify-center mb-10">
      <div className="bg-gray-50 p-1 rounded-md inline-flex border border-gray-200">
        <button
          onClick={() => onToggle("predefined")}
          className={cn(
            "py-2 px-6 font-medium transition-all rounded-md",
            type === "predefined"
              ? "bg-imaginory-yellow shadow-sm text-imaginory-black border border-gray-100"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Predefined Story
        </button>
        <button
          onClick={() => onToggle("custom")}
          className={cn(
            "py-2 px-6 font-medium transition-all rounded-md",
            type === "custom"
              ? "bg-imaginory-yellow shadow-sm text-imaginory-black border border-gray-100"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Custom Story
        </button>
      </div>
    </div>
  );
}
