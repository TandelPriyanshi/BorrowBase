import React from 'react';
import { motion } from 'framer-motion';

interface AnimationContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  type?: 'fade' | 'slide' | 'scale' | 'bounce';
}

const AnimationContainer: React.FC<AnimationContainerProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  type = 'fade'
}) => {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -30 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    },
    bounce: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 }
    }
  };

  const selectedVariant = variants[type];

  return (
    <motion.div
      className={className}
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{ 
        duration, 
        delay,
        type: type === 'bounce' ? 'spring' : 'tween',
        stiffness: type === 'bounce' ? 200 : undefined,
        damping: type === 'bounce' ? 20 : undefined
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimationContainer;
