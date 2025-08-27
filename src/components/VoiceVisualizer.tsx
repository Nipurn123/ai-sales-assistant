import React, { useState, useEffect } from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
  audioLevel: number;
  isAI?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isActive, 
  audioLevel, 
  isAI = false, 
  size = 'medium' 
}) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const generateBars = () => {
    if (!mounted) return [];
    
    const barCount = size === 'large' ? 12 : size === 'medium' ? 8 : 6;
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      const baseHeight = 20;
      
      let height;
      if (isActive && audioLevel > 0) {
        // Dynamic height when speaking with real audio data
        const centerEffect = Math.abs(i - barCount / 2) / (barCount / 2);
        const variation = Math.sin((i * 0.5) + (Date.now() * 0.01)) * 0.3 + 0.7;
        height = baseHeight + (audioLevel * 60 * variation * (1 - centerEffect * 0.4));
      } else {
        // Static height when not speaking - no random fluctuations
        height = baseHeight;
      }
      
      bars.push(
        <div
          key={i}
          className={`w-1.5 transition-all duration-300 rounded-full shadow-lg ${
            isAI 
              ? isActive 
                ? 'bg-gradient-to-t from-purple-600 via-purple-400 to-blue-300 shadow-purple-500/50' 
                : 'bg-gradient-to-t from-gray-700 to-gray-500'
              : isActive 
                ? 'bg-gradient-to-t from-green-600 via-green-400 to-emerald-300 shadow-green-500/50' 
                : 'bg-gradient-to-t from-gray-700 to-gray-500'
          }`}
          style={{ 
            height: `${height}px`,
            opacity: isActive ? 0.9 : 0.6,
          }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center gap-0.5 relative`}>
      {/* Multiple pulsing backgrounds for depth */}
      {isActive && (
        <>
          <div 
            className={`absolute inset-0 rounded-full animate-pulse ${
              isAI 
                ? 'bg-purple-500/30 shadow-xl shadow-purple-500/40' 
                : 'bg-green-500/30 shadow-xl shadow-green-500/40'
            }`}
            style={{
              transform: `scale(${1.2 + audioLevel * 0.4})`,
              transition: 'transform 0.15s ease-out'
            }}
          />
          <div 
            className={`absolute inset-0 rounded-full animate-pulse ${
              isAI 
                ? 'bg-purple-400/20 shadow-lg shadow-purple-400/30' 
                : 'bg-green-400/20 shadow-lg shadow-green-400/30'
            }`}
            style={{
              transform: `scale(${1 + audioLevel * 0.6})`,
              transition: 'transform 0.1s ease-out',
              animationDelay: '0.1s'
            }}
          />
        </>
      )}
      
      {/* Audio bars with enhanced spacing */}
      <div className="flex items-end gap-0.5 z-10 relative">
        {generateBars()}
      </div>
      
      {/* Multiple outer glow rings when active */}
      {isActive && (
        <>
          <div 
            className={`absolute inset-0 rounded-full ${
              isAI 
                ? 'border-2 border-purple-300/60' 
                : 'border-2 border-green-300/60'
            } animate-ping`}
            style={{ animationDuration: '2s' }}
          />
          <div 
            className={`absolute inset-0 rounded-full ${
              isAI 
                ? 'border border-blue-300/40' 
                : 'border border-emerald-300/40'
            } animate-ping`}
            style={{ animationDuration: '3s', animationDelay: '0.5s' }}
          />
        </>
      )}
      
      {/* Center dot indicator */}
      <div className={`absolute w-2 h-2 rounded-full z-20 transition-all duration-300 ${
        isActive 
          ? isAI 
            ? 'bg-blue-300 shadow-lg shadow-blue-300/50' 
            : 'bg-emerald-300 shadow-lg shadow-emerald-300/50'
          : 'bg-gray-500'
      }`} />
    </div>
  );
};

export default VoiceVisualizer;