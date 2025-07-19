// components/story/CharacterChip.tsx
import React from "react";

export function CharacterChip({
  src,
  selected,
  onSelect,
}: {
  src: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={`
        relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0
        transition ring-2 focus:outline-none focus:ring-primary/60
        ${selected ? "ring-green-500" : "ring-gray-300 hover:ring-gray-400"}
      `}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
      {selected && (
        <span className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-0.5">
          ✓
        </span>
      )}
    </button>
  );
}
