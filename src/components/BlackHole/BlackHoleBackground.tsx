'use client';

import React from 'react';
import BlackHole from '.';

interface BlackHoleBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

const BlackHoleBackground: React.FC<BlackHoleBackgroundProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Black Hole Background - Fixed positioned to cover entire viewport */}
      <div className="fixed inset-0 z-0">
        <BlackHole 
          className="w-full h-full"
          quality="medium"
          enableAccretionDisk={true}
          enableObserverMotion={true}
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default BlackHoleBackground;