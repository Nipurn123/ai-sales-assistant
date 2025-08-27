'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  
  const aiRoles = [
    'Sales Agent',
    'Co-pilot',
    'Sales Companion',
    'Revenue Assistant',
    'Deal Closer',
    'Lead Qualifier',
    'Sales Accelerator'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % aiRoles.length);
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, [aiRoles.length]);
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.h1 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center flex-wrap gap-4">
            <span className="text-white drop-shadow-2xl">
              AI
            </span>
            <div className="relative inline-block min-w-[200px] sm:min-w-[300px] md:min-w-[400px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentRoleIndex}
                  className="block bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl text-center"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  {aiRoles[currentRoleIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          <div className="text-white drop-shadow-2xl mt-2">
            for Revenue Acceleration
          </div>
        </motion.h1>
        
        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-normal leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Handling complex sales conversations, boosting conversion rates, and streamlining 
          outbound calls, so your business scales faster with precision
        </motion.p>
        
        <motion.div 
          className="flex justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link href="/setup" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-2xl text-white font-semibold text-lg transition-all shadow-lg hover:scale-105 transform">
            Talk to our team
          </Link>
        </motion.div>

      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white/40 text-lg font-light tracking-widest z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <motion.div
          animate={{ 
            y: [0, 8, 0],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex flex-col items-center"
        >
          <div className="mb-2">↓</div>
          <div>DISCOVER MORE</div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;