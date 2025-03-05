import { cn } from "@/lib/utils";

interface CharacterToggleProps {
  type: 'predefined' | 'custom';
  onToggle: (type: 'predefined' | 'custom') => void;
}

export function CharacterToggle({ type, onToggle }: CharacterToggleProps) {
  return (
    <div className="flex justify-center mb-10">
      <div className="bg-gray-50 p-1 rounded-md inline-flex border border-gray-200">
        <button 
          onClick={() => onToggle('predefined')}
          className={cn(
            "py-2 px-6 font-medium transition-all rounded-md",
            type === 'predefined' 
              ? "bg-white shadow-sm text-primary border border-gray-100" 
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Predefined Character
        </button>
        <button 
          onClick={() => onToggle('custom')}
          className={cn(
            "py-2 px-6 font-medium transition-all rounded-md",
            type === 'custom' 
              ? "bg-white shadow-sm text-primary border border-gray-100" 
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Custom Character
        </button>
      </div>
    </div>
  );
}
