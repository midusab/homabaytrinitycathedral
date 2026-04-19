import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_15px_rgba(100,180,255,0.4)]"
      >
        {/* Main Cathedral Shape */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          d="M50 10L20 40V90H80V40L50 10Z"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-accent-blue"
        />
        
        {/* Gothic Arches */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
          d="M35 90V65C35 56.7157 41.7157 50 50 50C58.2843 50 65 56.7157 65 65V90"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-white/40"
        />
        
        {/* Central Cross Detail */}
        <motion.path
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1.5, type: "spring" }}
          d="M50 25V35M45 30H55"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-accent-blue"
        />
        
        {/* Spires */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
          d="M20 40L10 30M80 40L90 30M50 10L50 2"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-white/20"
        />
        
        {/* Rose Window Circle */}
        <motion.circle
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: 1, r: 4 }}
          transition={{ duration: 1, delay: 1.2 }}
          cx="50"
          cy="38"
          r="4"
          stroke="currentColor"
          strokeWidth="1"
          className="text-accent-blue/60"
        />
      </svg>
    </motion.div>
  );
}
