import { useEffect, useState } from 'react';
import { ShaderAnimation } from '@/components/ui/shader-animation';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <ShaderAnimation />
      <div className="absolute pointer-events-none z-10 text-center">
        <h1 className="text-7xl leading-none font-semibold tracking-tighter text-white">
          SPECTRUM
        </h1>
        <p className="text-xl text-white/80 mt-4">Audio Mastering Studio</p>
      </div>
    </div>
  );
};
