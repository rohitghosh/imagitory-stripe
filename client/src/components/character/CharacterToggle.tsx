import { cn } from "@/lib/utils";

interface CharacterToggleProps {
  type: 'predefined' | 'custom';
  onToggle: (type: 'predefined' | 'custom') => void;
}

export function CharacterToggle({ type, onToggle }: CharacterToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-gray-100 p-1 rounded-full inline-flex">
        <button 
          onClick={() => onToggle('predefined')}
          className={cn(
            "py-2 px-4 rounded-full font-medium transition-all",
            type === 'predefined' 
              ? "bg-white shadow-sm text-text-primary" 
              : "text-text-secondary"
          )}
        >
          Predefined Character
        </button>
        <button 
          onClick={() => onToggle('custom')}
          className={cn(
            "py-2 px-4 rounded-full font-medium transition-all",
            type === 'custom' 
              ? "bg-white shadow-sm text-text-primary" 
              : "text-text-secondary"
          )}
        >
          Custom Character
        </button>
      </div>
    </div>
  );
}
