// components/ui/chip.tsx
import React, { ReactNode } from "react";

export function ChipGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-2 overflow-x-auto scrollbar-none py-2">
      {children}
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`
        flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition
        ${
          selected
            ? "bg-imaginory-yellow text-imaginory-black ring-2 ring-imaginory-yellow/60"
            : "bg-gray-100 text-slate-700 hover:bg-gray-200"
        }
      `}
    >
      {children}
    </button>
  );
}
