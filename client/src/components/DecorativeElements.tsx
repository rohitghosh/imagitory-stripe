import React from "react";

interface DecorativeElementsProps {
  className?: string;
}

export const DecorativeElements: React.FC<DecorativeElementsProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {/* Squiggles - clean teal */}
      <div className="absolute top-10 left-10 w-16 h-6">
        <div className="squiggle"></div>
      </div>
      <div className="absolute top-20 right-20 w-12 h-4">
        <div className="squiggle" style={{ transform: "rotate(45deg)" }}></div>
      </div>
      <div className="absolute bottom-20 left-1/4 w-14 h-5">
        <div className="squiggle" style={{ transform: "rotate(-30deg)" }}></div>
      </div>

      {/* S-like curly lines - red and blue - MUCH LONGER */}

      {/* Angled curve with twists */}
      <div
        className="absolute top-1/3 right-1/3 w-28 h-10"
        style={{ transform: "rotate(25deg)" }}
      >
        <svg viewBox="0 0 112 40" className="w-full h-full">
          <path
            d="M14,20 Q28,10 42,20 Q56,30 70,20 Q84,10 98,20"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Ribbon-like curve with multiple twists */}
      <div
        className="absolute bottom-1/4 left-1/3 w-30 h-11"
        style={{ transform: "rotate(-15deg)" }}
      >
        <svg viewBox="0 0 120 44" className="w-full h-full">
          <path
            d="M15,22 Q30,11 45,22 Q60,33 75,22 Q90,11 105,22"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Free-form curves - more organic - LONGER */}
      <div
        className="absolute top-1/2 right-1/4 w-24 h-8"
        style={{ transform: "rotate(35deg)" }}
      >
        <svg viewBox="0 0 96 32" className="w-full h-full">
          <path
            d="M12,16 Q24,8 36,16 Q48,24 60,16 Q72,8 84,16"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Ribbon with extra twists */}
      <div
        className="absolute bottom-1/3 right-1/4 w-20 h-7"
        style={{ transform: "rotate(-20deg)" }}
      >
        <svg viewBox="0 0 80 28" className="w-full h-full">
          <path
            d="M10,14 Q20,7 30,14 Q40,21 50,14 Q60,7 70,14"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* More organic S-curves - LONGER */}
      <div
        className="absolute top-1/6 left-1/2 w-26 h-9"
        style={{ transform: "rotate(40deg)" }}
      >
        <svg viewBox="0 0 104 36" className="w-full h-full">
          <path
            d="M13,18 Q26,9 39,18 Q52,27 65,18 Q78,9 91,18"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute bottom-1/6 right-1/2 w-24 h-8"
        style={{ transform: "rotate(-25deg)" }}
      >
        <svg viewBox="0 0 96 32" className="w-full h-full">
          <path
            d="M12,16 Q24,8 36,16 Q48,24 60,16 Q72,8 84,16"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* How It Works Section - Side Curves (Left Side) - MUCH LONGER */}
      <div
        className="absolute top-2/3 left-8 w-32 h-12"
        style={{ transform: "rotate(30deg)" }}
      >
        <svg viewBox="0 0 128 48" className="w-full h-full">
          <path
            d="M16,24 Q32,12 48,24 Q64,36 80,24 Q96,12 112,24"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-3/4 left-12 w-28 h-10"
        style={{ transform: "rotate(-35deg)" }}
      >
        <svg viewBox="0 0 112 40" className="w-full h-full">
          <path
            d="M14,20 Q28,10 42,20 Q56,30 70,20 Q84,10 98,20"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-5/6 left-6 w-30 h-11"
        style={{ transform: "rotate(45deg)" }}
      >
        <svg viewBox="0 0 120 44" className="w-full h-full">
          <path
            d="M15,22 Q30,11 45,22 Q60,33 75,22 Q90,11 105,22"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* How It Works Section - Side Curves (Right Side) - MUCH LONGER */}
      <div
        className="absolute top-2/3 right-8 w-32 h-12"
        style={{ transform: "rotate(-30deg)" }}
      >
        <svg viewBox="0 0 128 48" className="w-full h-full">
          <path
            d="M16,24 Q32,12 48,24 Q64,36 80,24 Q96,12 112,24"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-3/4 right-12 w-28 h-10"
        style={{ transform: "rotate(25deg)" }}
      >
        <svg viewBox="0 0 112 40" className="w-full h-full">
          <path
            d="M14,20 Q28,10 42,20 Q56,30 70,20 Q84,10 98,20"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-5/6 right-6 w-30 h-11"
        style={{ transform: "rotate(-40deg)" }}
      >
        <svg viewBox="0 0 120 44" className="w-full h-full">
          <path
            d="M15,22 Q30,11 45,22 Q60,33 75,22 Q90,11 105,22"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Additional curves around How It Works - scattered - LONGER */}
      <div
        className="absolute top-2/3 left-1/4 w-20 h-7"
        style={{ transform: "rotate(20deg)" }}
      >
        <svg viewBox="0 0 80 28" className="w-full h-full">
          <path
            d="M10,14 Q20,7 30,14 Q40,21 50,14 Q60,7 70,14"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-2/3 right-1/4 w-20 h-7"
        style={{ transform: "rotate(-15deg)" }}
      >
        <svg viewBox="0 0 80 28" className="w-full h-full">
          <path
            d="M10,14 Q20,7 30,14 Q40,21 50,14 Q60,7 70,14"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-3/4 left-1/3 w-16 h-6"
        style={{ transform: "rotate(35deg)" }}
      >
        <svg viewBox="0 0 64 24" className="w-full h-full">
          <path
            d="M8,12 Q16,6 24,12 Q32,18 40,12 Q48,6 56,12"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-3/4 right-1/3 w-16 h-6"
        style={{ transform: "rotate(-25deg)" }}
      >
        <svg viewBox="0 0 64 24" className="w-full h-full">
          <path
            d="M8,12 Q16,6 24,12 Q32,18 40,12 Q48,6 56,12"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Extra ribbon-like curves with more twists */}
      <div
        className="absolute top-1/4 right-1/6 w-24 h-8"
        style={{ transform: "rotate(50deg)" }}
      >
        <svg viewBox="0 0 96 32" className="w-full h-full">
          <path
            d="M12,16 Q24,8 36,16 Q48,24 60,16 Q72,8 84,16"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute bottom-1/4 right-1/6 w-22 h-7"
        style={{ transform: "rotate(-45deg)" }}
      >
        <svg viewBox="0 0 88 28" className="w-full h-full">
          <path
            d="M11,14 Q22,7 33,14 Q44,21 55,14 Q66,7 77,14"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute top-1/3 left-1/6 w-20 h-6"
        style={{ transform: "rotate(60deg)" }}
      >
        <svg viewBox="0 0 80 24" className="w-full h-full">
          <path
            d="M10,12 Q20,6 30,12 Q40,18 50,12 Q60,6 70,12"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="absolute bottom-1/3 left-1/6 w-18 h-5"
        style={{ transform: "rotate(-55deg)" }}
      >
        <svg viewBox="0 0 72 20" className="w-full h-full">
          <path
            d="M9,10 Q18,5 27,10 Q36,15 45,10 Q54,5 63,10"
            stroke="#4ECDC4"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Stars - clean yellow */}
      <div className="absolute top-1/4 right-10">
        <div className="star"></div>
      </div>
      <div className="absolute bottom-1/3 left-10">
        <div className="star"></div>
      </div>
      <div className="absolute top-1/2 left-1/2">
        <div className="star"></div>
      </div>

      {/* Dot clusters - clean teal */}
      <div className="absolute top-1/3 left-1/3">
        <div className="dot-cluster"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/4">
        <div className="dot-cluster"></div>
      </div>

      {/* Blobs - clean yellow */}
      <div className="absolute top-1/4 left-1/4 opacity-20">
        <div className="blob w-20 h-20"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/4 opacity-20">
        <div className="blob w-16 h-16"></div>
      </div>

      {/* Hand-drawn circles - minimal colors */}
      <div className="absolute top-10 right-1/3 w-8 h-8 border-2 border-imaginory-blue rounded-full opacity-60"></div>
      <div className="absolute bottom-10 left-1/3 w-6 h-6 border-2 border-imaginory-yellow rounded-full opacity-60"></div>

      {/* Abstract lines - clean colors */}
      <div className="absolute top-1/2 left-10 w-20 h-1 bg-imaginory-yellow rounded-full transform rotate-12"></div>
      <div className="absolute bottom-1/2 right-10 w-16 h-1 bg-imaginory-blue rounded-full transform -rotate-12"></div>

      {/* Floating elements - minimal */}
      <div className="absolute top-1/3 right-1/4 animate-float">
        <div className="w-4 h-4 bg-imaginory-yellow rounded-full opacity-70"></div>
      </div>
      <div
        className="absolute bottom-1/3 left-1/4 animate-float"
        style={{ animationDelay: "1s" }}
      >
        <div className="w-3 h-3 bg-imaginory-blue rounded-full opacity-70"></div>
      </div>

      {/* Wiggle elements - minimal */}
      <div className="absolute top-1/2 left-1/2 animate-wiggle">
        <div className="w-6 h-6 bg-imaginory-yellow rounded-full opacity-60"></div>
      </div>
    </div>
  );
};

export default DecorativeElements;
