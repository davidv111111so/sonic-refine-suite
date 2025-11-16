import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import React, { useRef } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: gsap.TweenVars;
  animationTo?: gsap.TweenVars;
  onAnimationComplete?: () => void;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 0,
  animationFrom = {
    opacity: 0,
    y: 20,
    rotateX: -90,
    transformOrigin: "top center",
  },
  animationTo = {
    opacity: 1,
    y: 0,
    rotateX: 0,
    duration: 0.6,
    ease: "power2.out",
  },
  onAnimationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(" ");

  useGSAP(() => {
    if (!containerRef.current) return;

    const chars = containerRef.current.querySelectorAll(".char");

    gsap.fromTo(chars, animationFrom, {
      ...animationTo,
      delay: delay,
      stagger: 0.02,
      onComplete: onAnimationComplete,
    });
  }, [text, delay, animationFrom, animationTo, onAnimationComplete]);

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-2">
          {word.split("").map((char, charIndex) => (
            <span
              key={`${wordIndex}-${charIndex}`}
              className="char inline-block"
              style={{ display: "inline-block" }}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
};

export default SplitText;
