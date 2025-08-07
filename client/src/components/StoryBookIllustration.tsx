import React from "react";

interface StoryBookIllustrationProps {
  className?: string;
}

export const StoryBookIllustration: React.FC<StoryBookIllustrationProps> = ({
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main book */}
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        className="w-full h-full"
      >
        {/* Book cover background */}
        <rect
          x="50"
          y="80"
          width="200"
          height="140"
          rx="10"
          fill="#95E1D3"
          stroke="#4ECDC4"
          strokeWidth="3"
        />

        {/* Book pages */}
        <rect
          x="60"
          y="90"
          width="180"
          height="120"
          rx="5"
          fill="#FFFFFF"
          stroke="#E9ECEF"
          strokeWidth="2"
        />

        {/* Book spine */}
        <rect
          x="45"
          y="80"
          width="10"
          height="140"
          fill="#4ECDC4"
          stroke="#2C3E50"
          strokeWidth="1"
        />

        {/* Title on book */}
        <text
          x="150"
          y="120"
          textAnchor="middle"
          fill="#2C3E50"
          fontSize="14"
          fontFamily="Fredoka, sans-serif"
          fontWeight="bold"
        >
          My Adventure
        </text>

        {/* Simple illustration on book */}
        <circle cx="130" cy="150" r="15" fill="#FFD93D" />
        <circle cx="170" cy="150" r="15" fill="#FF6B6B" />
        <circle cx="150" cy="170" r="10" fill="#4ECDC4" />

        {/* Children reading */}
        <g transform="translate(100, 200)">
          {/* Girl */}
          <circle cx="20" cy="15" r="12" fill="#FFB6C1" />
          <rect x="15" y="25" width="10" height="20" fill="#FFA07A" />
          <rect x="12" y="35" width="16" height="8" fill="#4ECDC4" />
        </g>

        <g transform="translate(160, 200)">
          {/* Boy */}
          <circle cx="20" cy="15" r="12" fill="#87CEEB" />
          <rect x="15" y="25" width="10" height="20" fill="#FFA07A" />
          <rect x="12" y="35" width="16" height="8" fill="#FFD93D" />
        </g>

        {/* Stars around the book */}
        <g fill="#FFD93D">
          <path d="M30 60 L32 65 L37 65 L33 68 L35 73 L30 70 L25 73 L27 68 L23 65 L28 65 Z" />
          <path d="M270 100 L272 105 L277 105 L273 108 L275 113 L270 110 L265 113 L267 108 L263 105 L268 105 Z" />
          <path d="M40 180 L42 185 L47 185 L43 188 L45 193 L40 190 L35 193 L37 188 L33 185 L38 185 Z" />
        </g>

        {/* Decorative squiggles */}
        <path
          d="M20 40 Q30 35 40 40 Q50 45 60 40"
          stroke="#FF6B6B"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M240 60 Q250 55 260 60 Q270 65 280 60"
          stroke="#4ECDC4"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M10 220 Q20 215 30 220 Q40 225 50 220"
          stroke="#FFD93D"
          strokeWidth="2"
          fill="none"
        />
      </svg>

      {/* Floating decorative elements */}
      <div className="absolute top-4 right-4 animate-float">
        <div className="w-4 h-4 bg-imaginory-yellow rounded-full opacity-70"></div>
      </div>
      <div
        className="absolute bottom-4 left-4 animate-float"
        style={{ animationDelay: "1s" }}
      >
        <div className="w-3 h-3 bg-imaginory-pink rounded-full opacity-70"></div>
      </div>
      <div className="absolute top-1/2 left-4 animate-bounce-gentle">
        <div className="w-2 h-2 bg-imaginory-blue rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default StoryBookIllustration;
