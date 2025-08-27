'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: React.ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.3);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate synthetic black hole audio using Web Audio API
  const generateBlackHoleAudio = async () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * 30, ctx.sampleRate); // 30 seconds
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < channelData.length; i++) {
        const time = i / ctx.sampleRate;
        
        // Low frequency rumble (10-50 Hz)
        const rumble = Math.sin(2 * Math.PI * 25 * time) * 0.3;
        
        // Mid frequency warping effect (50-200 Hz)
        const warp = Math.sin(2 * Math.PI * 100 * time * (1 + 0.1 * Math.sin(0.5 * time))) * 0.2;
        
        // High frequency crackling (white noise filtered)
        const noise = (Math.random() - 0.5) * 0.1 * Math.sin(2 * Math.PI * 0.1 * time);
        
        // Doppler shift effect
        const doppler = Math.sin(2 * Math.PI * 75 * time * (1 + 0.05 * Math.sin(0.2 * time))) * 0.15;
        
        // Combine all frequencies with envelope
        const envelope = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.05 * time);
        channelData[i] = (rumble + warp + noise + doppler) * envelope * 0.5;
      }
    }
    
    return buffer;
  };

  const initializeAudio = async () => {
    if (isInitialized) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      
      // Create gain node for volume control
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
      gainNodeRef.current.gain.value = volume;
      
      // Try to load external audio first
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.loop = true;
      
      // Try multiple NASA black hole sources
      const sources = [
        '/audio/black-hole-perseus.mp3',  // Perseus Galaxy Cluster
        '/audio/black-hole-m87.mp3',      // M87 black hole
      ];
      
      let loaded = false;
      for (const src of sources) {
        try {
          audioRef.current.src = src;
          await new Promise((resolve, reject) => {
            audioRef.current!.addEventListener('loadeddata', resolve, { once: true });
            audioRef.current!.addEventListener('error', reject, { once: true });
          });
          loaded = true;
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (loaded && audioRef.current) {
        // Connect external audio to Web Audio API
        sourceRef.current = ctx.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(gainNodeRef.current);
      } else {
        // Fallback: Generate synthetic audio
        const buffer = await generateBlackHoleAudio();
        if (buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.connect(gainNodeRef.current);
          
          // Store reference for playback control
          (audioRef as any).current = {
            play: () => {
              if (ctx.state === 'suspended') {
                ctx.resume();
              }
              source.start(0);
              return Promise.resolve();
            },
            pause: () => {
              source.stop();
            }
          };
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const play = async () => {
    if (!isInitialized) {
      await initializeAudio();
    }
    
    if (audioRef.current && audioContextRef.current) {
      try {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (gainNodeRef.current) {
      const newMutedState = !isMuted;
      gainNodeRef.current.gain.value = newMutedState ? 0 : volume;
      setIsMuted(newMutedState);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (gainNodeRef.current && !isMuted) {
      gainNodeRef.current.gain.setValueAtTime(newVolume, audioContextRef.current?.currentTime || 0);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    // Initialize audio on first user interaction
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const contextValue: AudioContextType = {
    isPlaying,
    isMuted,
    volume,
    play,
    pause,
    toggleMute,
    setVolume,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};