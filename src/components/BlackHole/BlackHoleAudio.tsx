'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface BlackHoleAudioProps {
  autoPlay?: boolean;
  volume?: number;
}

const BlackHoleAudio: React.FC<BlackHoleAudioProps> = ({ 
  autoPlay = true, 
  volume = 0.3 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Static animation values to avoid hydration mismatch
  const visualizerBars = [
    { height: 'h-3', duration: '0.8s', delay: '0s' },
    { height: 'h-4', duration: '0.6s', delay: '0.1s' },
    { height: 'h-2', duration: '0.9s', delay: '0.2s' },
    { height: 'h-5', duration: '0.7s', delay: '0.3s' },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // NASA Black Hole audio (public domain)
  const audioSources = [
    '/audio/black-hole-perseus.mp3',  // Perseus Galaxy Cluster black hole
    '/audio/black-hole-m87.mp3',      // M87 black hole sonification
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setIsLoaded(true);
      if (autoPlay) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.log('Autoplay prevented:', err);
        });
      }
    };

    const handleEnded = () => {
      // Loop the audio seamlessly
      audio.currentTime = 0;
      if (isPlaying) {
        audio.play();
      }
    };

    const handleError = (e: Event) => {
      console.log('Audio error:', e);
      // Try fallback source
      const currentIndex = audioSources.findIndex(src => src === audio.src);
      if (currentIndex < audioSources.length - 1) {
        audio.src = audioSources[currentIndex + 1];
      }
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.volume = currentVolume;
    audio.loop = true;

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [autoPlay, currentVolume, audioSources]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log('Play error:', err);
      });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = currentVolume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentVolume(newVolume);
    if (!isMuted) {
      audio.volume = newVolume;
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 group">
      <audio
        ref={audioRef}
        src={audioSources[0]}
        preload="auto"
        className="hidden"
      />
      
      {/* Audio Control Panel */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 opacity-60 group-hover:opacity-100 transition-all duration-300 shadow-2xl">
        <div className="flex items-center space-x-4">
          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-blue-400" />
            )}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={currentVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${currentVolume * 100}%, rgba(255,255,255,0.2) ${currentVolume * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>

          {/* Audio Visualizer */}
          <div className="flex items-center space-x-1">
            {isMounted && visualizerBars.map((bar, i) => (
              <div
                key={i}
                className={`w-1 bg-blue-400 rounded-full transition-all duration-300 ${
                  isPlaying && !isMuted
                    ? `${bar.height} animate-pulse`
                    : 'h-1 opacity-30'
                }`}
                style={{
                  animationDelay: bar.delay,
                  animationDuration: bar.duration
                }}
              />
            ))}
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            disabled={!isLoaded}
            className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all shadow-lg disabled:opacity-50"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-1 h-3 bg-black mr-0.5 rounded"></div>
                <div className="w-1 h-3 bg-black ml-0.5 rounded"></div>
              </div>
            ) : (
              <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
            )}
          </button>
        </div>

        {/* Audio Description */}
        <div className="mt-2 text-xs text-gray-400 text-center">
          Black Hole Sonification
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default BlackHoleAudio;