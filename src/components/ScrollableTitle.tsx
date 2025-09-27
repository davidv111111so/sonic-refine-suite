import React from 'react';

interface ScrollableTitleProps {
  title: string;
  className?: string;
  maxLength?: number;
}

export const ScrollableTitle: React.FC<ScrollableTitleProps> = ({ 
  title, 
  className = "",
  maxLength = 25 
}) => {
  const shouldScroll = title.length > maxLength;

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div 
        className={`whitespace-nowrap overflow-hidden ${shouldScroll ? 'hover:animate-pulse' : ''}`}
        style={{
          animation: shouldScroll ? `scroll-text ${Math.max(10, title.length * 0.5)}s linear infinite` : 'none'
        }}
        title={title}
      >
        {title}
      </div>
    </div>
  );
};