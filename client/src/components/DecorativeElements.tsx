import React from 'react';

interface DecorativeElementsProps {
  className?: string;
}

export const DecorativeElements: React.FC<DecorativeElementsProps> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Squiggles - scattered across entire page */}
      <div className="absolute top-10 left-10 w-16 h-6">
        <div className="squiggle"></div>
      </div>
      <div className="absolute top-20 right-20 w-12 h-4">
        <div className="squiggle" style={{ transform: 'rotate(45deg)' }}></div>
      </div>
      <div className="absolute bottom-20 left-1/4 w-14 h-5">
        <div className="squiggle" style={{ transform: 'rotate(-30deg)' }}></div>
      </div>
      <div className="absolute top-1/3 left-1/2 w-10 h-3">
        <div className="squiggle" style={{ transform: 'rotate(15deg)' }}></div>
      </div>
      <div className="absolute bottom-1/3 right-1/3 w-8 h-4">
        <div className="squiggle" style={{ transform: 'rotate(-60deg)' }}></div>
      </div>

      {/* Stars - scattered across entire page */}
      <div className="absolute top-1/4 right-10">
        <div className="star"></div>
      </div>
      <div className="absolute bottom-1/3 left-10">
        <div className="star"></div>
      </div>
      <div className="absolute top-1/2 left-1/2">
        <div className="star"></div>
      </div>
      <div className="absolute top-1/6 right-1/4">
        <div className="star"></div>
      </div>
      <div className="absolute bottom-1/6 left-1/6">
        <div className="star"></div>
      </div>

      {/* Dot clusters - scattered across entire page */}
      <div className="absolute top-1/3 left-1/3">
        <div className="dot-cluster"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/4">
        <div className="dot-cluster"></div>
      </div>
      <div className="absolute top-2/3 right-1/6">
        <div className="dot-cluster"></div>
      </div>

      {/* Blobs - scattered across entire page */}
      <div className="absolute top-1/4 left-1/4 opacity-20">
        <div className="blob w-20 h-20"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/4 opacity-20">
        <div className="blob w-16 h-16"></div>
      </div>
      <div className="absolute top-3/4 left-1/6 opacity-15">
        <div className="blob w-12 h-12"></div>
      </div>

      {/* Hand-drawn circles - scattered across entire page */}
      <div className="absolute top-10 right-1/3 w-8 h-8 border-2 border-imaginory-blue rounded-full opacity-60"></div>
      <div className="absolute bottom-10 left-1/3 w-6 h-6 border-2 border-imaginory-yellow rounded-full opacity-60"></div>
      <div className="absolute top-1/3 right-1/6 w-4 h-4 border border-imaginory-blue rounded-full opacity-50"></div>
      <div className="absolute bottom-1/3 right-1/2 w-5 h-5 border border-imaginory-yellow rounded-full opacity-50"></div>

      {/* Abstract lines - scattered across entire page */}
      <div className="absolute top-1/2 left-10 w-20 h-1 bg-imaginory-yellow rounded-full transform rotate-12"></div>
      <div className="absolute bottom-1/2 right-10 w-16 h-1 bg-imaginory-blue rounded-full transform -rotate-12"></div>
      <div className="absolute top-1/4 left-1/6 w-12 h-1 bg-imaginory-blue rounded-full transform rotate-30"></div>
      <div className="absolute bottom-1/4 left-1/2 w-14 h-1 bg-imaginory-yellow rounded-full transform -rotate-20"></div>

      {/* Floating elements - scattered across entire page */}
      <div className="absolute top-1/3 right-1/4 animate-float">
        <div className="w-4 h-4 bg-imaginory-yellow rounded-full opacity-70"></div>
      </div>
      <div className="absolute bottom-1/3 left-1/4 animate-float" style={{ animationDelay: '1s' }}>
        <div className="w-3 h-3 bg-imaginory-blue rounded-full opacity-70"></div>
      </div>
      <div className="absolute top-2/3 right-1/3 animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-2 h-2 bg-imaginory-yellow rounded-full opacity-60"></div>
      </div>
      <div className="absolute bottom-2/3 left-1/6 animate-float" style={{ animationDelay: '0.5s' }}>
        <div className="w-3 h-3 bg-imaginory-blue rounded-full opacity-60"></div>
      </div>

      {/* Wiggle elements - scattered across entire page */}
      <div className="absolute top-1/2 left-1/2 animate-wiggle">
        <div className="w-6 h-6 bg-imaginory-yellow rounded-full opacity-60"></div>
      </div>
      <div className="absolute top-1/6 right-1/6 animate-wiggle" style={{ animationDelay: '1s' }}>
        <div className="w-4 h-4 bg-imaginory-blue rounded-full opacity-50"></div>
      </div>
      <div className="absolute bottom-1/6 left-1/4 animate-wiggle" style={{ animationDelay: '0.5s' }}>
        <div className="w-5 h-5 bg-imaginory-yellow rounded-full opacity-50"></div>
      </div>
    </div>
  );
};

export default DecorativeElements; 