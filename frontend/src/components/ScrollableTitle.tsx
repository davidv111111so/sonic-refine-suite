import React from "react";

interface ScrollableTitleProps {
  title: string;
  className?: string;
  maxLength?: number;
}

export const ScrollableTitle: React.FC<ScrollableTitleProps> = ({
  title,
  className = "",
  maxLength = 25,
}) => {
  const shouldScroll = title.length > maxLength;

  return (
    <div className={`flex-1 min-w-0 overflow-hidden ${className}`}>
      <div
        className={`whitespace-nowrap ${shouldScroll ? "inline-block" : ""}`}
        style={{
          animation: shouldScroll
            ? `scroll-text ${Math.max(10, title.length * 0.5)}s linear infinite`
            : "none",
          maxWidth: shouldScroll ? "none" : "100%",
          overflow: "hidden",
          textOverflow: shouldScroll ? "clip" : "ellipsis",
        }}
        title={title}
      >
        {shouldScroll ? `${title} • ${title}` : title}
      </div>
    </div>
  );
};
