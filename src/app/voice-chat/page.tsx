'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PhoneOff } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import VoiceVisualizer from '../../components/VoiceVisualizer';
import BlackHole from '../../components/BlackHole/BlackHole';

interface VoiceChatPageProps {}

const VoiceChatPage: React.FC<VoiceChatPageProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [audioLevel, setAudioLevel] = useState(0);
  const [aiAudioLevel, setAiAudioLevel] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const roomId = searchParams.get('room');
  const token = searchParams.get('token');
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://nipurn-6g1kin9e.livekit.cloud';
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId || !token) {
      setConnectionStatus('Invalid room parameters');
      return;
    }

    initializeConnection();
    return () => {
      cleanup();
    };
  }, [roomId, token]);

  const initializeConnection = async () => {
    try {
      // First check microphone permissions
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        return; // Wait for user to grant permission
      }
      
      setConnectionStatus('Connecting to LiveKit room...');
      
      // Dynamically import LiveKit client to avoid SSR issues
      const { Room, RoomEvent, Track } = await import('livekit-client');
      
      // Create and connect to LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720,
          },
        },
      });
      
      console.log('LiveKit Room created:', room);

      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room');
        setIsConnected(true);
        setConnectionStatus('Connected to 100X Prompt Sales Agent');
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
      });

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity !== room.localParticipant.identity) {
          console.log('Audio track subscribed from:', participant.identity);
          const audioElement = track.attach();
          audioElement.autoplay = true;
          document.body.appendChild(audioElement);
          
          // Monitor AI audio activity
          startAudioActivityMonitoring(track, true);
        }
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('Disconnected from room:', reason);
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      });

      // Connect to the room
      if (!token) {
        throw new Error('No access token provided');
      }
      await room.connect(livekitUrl, token);
      
      // Enable microphone
      await enableMicrophone();
      
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('Connection failed. Please try again.');
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      // First check if microphone permission is already granted
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permission.state === 'denied') {
        setMicPermissionDenied(true);
        setShowMicPermissionModal(true);
        setConnectionStatus('Microphone access denied');
        return false;
      } else if (permission.state === 'prompt') {
        setShowMicPermissionModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('Permission API not supported, will try direct access');
      return true;
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      setShowMicPermissionModal(false);
      setConnectionStatus('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      console.log('Microphone permission granted');
      setMicPermissionDenied(false);
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Now proceed with connection initialization
      await initializeConnection();
      return true;
      
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermissionDenied(true);
      setShowMicPermissionModal(true);
      setConnectionStatus('Microphone access denied');
      return false;
    }
  };

  const enableMicrophone = async () => {
    try {
      if (roomRef.current) {
        console.log('Attempting to enable microphone...');
        const audioTrack = await roomRef.current.localParticipant.setMicrophoneEnabled(true);
        localAudioTrackRef.current = audioTrack;
        console.log('LiveKit microphone enabled:', audioTrack);
        console.log('AudioTrack keys:', audioTrack ? Object.keys(audioTrack) : 'null');
        console.log('AudioTrack type:', typeof audioTrack);
        
        // Try direct media stream approach first (more reliable)
        try {
          console.log('Getting direct user media stream...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          console.log('Direct user media stream obtained:', stream);
          console.log('Audio tracks in stream:', stream.getAudioTracks());
          
          if (stream.getAudioTracks().length > 0) {
            startAudioActivityMonitoring({ mediaStream: stream }, false);
            console.log('Started audio monitoring with direct stream');
          }
        } catch (mediaError) {
          console.log('Could not get direct media stream:', mediaError);
          setMicPermissionDenied(true);
          setShowMicPermissionModal(true);
        }
        
        // Also try LiveKit track if it exists and has content
        if (audioTrack && typeof audioTrack === 'object' && Object.keys(audioTrack).length > 0) {
          console.log('Attempting LiveKit track monitoring...');
          startAudioActivityMonitoring(audioTrack, false);
        }
      }
    } catch (error) {
      console.error('Failed to enable microphone:', error);
      setMicPermissionDenied(true);
      setShowMicPermissionModal(true);
    }
  };

  const startAudioActivityMonitoring = async (track: any, isAI: boolean) => {
    try {
      console.log(`Starting audio monitoring for ${isAI ? 'AI' : 'User'}:`, track);
      
      // Check if track is empty or invalid
      if (!track || (typeof track === 'object' && Object.keys(track).length === 0)) {
        console.log(`Skipping audio monitoring - empty or invalid track for ${isAI ? 'AI' : 'User'}`);
        return;
      }
      
      let mediaStream;
      
      // Handle different track types from LiveKit
      if (track.mediaStream) {
        mediaStream = track.mediaStream;
        console.log('Using track.mediaStream');
      } else if (track.mediaStreamTrack) {
        // LiveKit audio track has mediaStreamTrack property
        mediaStream = new MediaStream([track.mediaStreamTrack]);
        console.log('Using track.mediaStreamTrack');
      } else if (track instanceof MediaStreamTrack) {
        mediaStream = new MediaStream([track]);
        console.log('Using direct MediaStreamTrack');
      } else if (track.track && track.track instanceof MediaStreamTrack) {
        mediaStream = new MediaStream([track.track]);
        console.log('Using track.track');
      } else {
        console.log('Track structure analysis:');
        console.log('- Keys:', Object.keys(track));
        console.log('- Type:', typeof track);
        console.log('- Constructor:', track.constructor?.name);
        console.log('- Has audioTrack:', !!track.audioTrack);
        console.log('- Has localTrack:', !!track.localTrack);
        console.log('- Has _track:', !!track._track);
        
        // Try to find the actual MediaStreamTrack in the object
        const possibleTrack = track.audioTrack || track.localTrack || track._track;
        if (possibleTrack instanceof MediaStreamTrack) {
          mediaStream = new MediaStream([possibleTrack]);
          console.log('Using fallback track property');
        } else {
          console.warn(`No valid MediaStreamTrack found for ${isAI ? 'AI' : 'User'} - audio visualization will not work`);
          return;
        }
      }

      console.log('MediaStream created:', mediaStream, 'Audio tracks:', mediaStream.getAudioTracks());
      
      if (!mediaStream || mediaStream.getAudioTracks().length === 0) {
        console.warn('No audio tracks in MediaStream - audio visualization will not work');
        return;
      }
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let frameCount = 0;
      const updateAudioLevel = () => {
        frameCount++;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS (Root Mean Square) for better voice detection
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Less sensitive normalization - requires louder sound to trigger
        const normalizedLevel = Math.min(rms / 80, 1); // Increased from 50 to 80
        
        // Debug logging every 60 frames (about every 1s)
        if (frameCount % 60 === 0) {
          console.log(`${isAI ? 'AI' : 'User'} audio level:`, normalizedLevel.toFixed(3), 'RMS:', rms.toFixed(1));
        }
        
        if (isAI) {
          setAiAudioLevel(normalizedLevel);
          setAiSpeaking(normalizedLevel > 0.2); // Increased threshold from 0.1 to 0.2
        } else {
          setAudioLevel(normalizedLevel);
          setIsSpeaking(normalizedLevel > 0.2); // Increased threshold from 0.1 to 0.2
        }
        
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      console.log(`✅ Audio monitoring started successfully for ${isAI ? 'AI' : 'User'}`);
    } catch (error) {
      console.error(`❌ Failed to start audio monitoring for ${isAI ? 'AI' : 'User'}:`, error);
    }
  };

  const cleanup = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
  };

  const handleEndCall = () => {
    setIsConnected(false);
    setConnectionStatus('Call Ended');
    setAiSpeaking(false);
    setIsSpeaking(false);
    setAudioLevel(0);
    setAiAudioLevel(0);
    cleanup();
    
    // Navigate back to home page after a brief delay to show the status change
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };



  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Black Hole Background - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <BlackHole 
          quality="high"
          enableAccretionDisk={true}
          enableObserverMotion={isConnected || isSpeaking || aiSpeaking}
          className="opacity-60"
        />
      </div>
      
      {/* Subtle cosmic particles */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Connection Status */}
      <div className="absolute top-8 left-8 z-30">
        <div className={`flex items-center space-x-3 backdrop-blur-xl rounded-full px-6 py-3 border transition-all duration-500 ${
          isConnected 
            ? 'bg-black/20 border-white/10' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
            isConnected 
              ? 'bg-green-400 animate-pulse' 
              : 'bg-red-400 animate-ping'
          }`}/>
          <span className={`text-sm font-medium transition-all duration-500 ${
            isConnected 
              ? 'text-white/90' 
              : 'text-red-300'
          }`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Room ID Badge */}
      <div className="absolute top-8 right-8 z-30">
        <div className="bg-black/20 backdrop-blur-xl rounded-full px-4 py-2 border border-purple-500/20">
          <span className="text-xs font-mono text-purple-300">{roomId?.slice(-8)}</span>
        </div>
      </div>

      {/* Ethereal Voice Interface */}
      <div className="flex-1 flex items-center justify-center relative z-20">
        <div className="flex items-center space-x-32">
          {/* User Orbit */}
          <div className="relative">
            {/* Floating ethereal container */}
            <div className="relative bg-black/10 backdrop-blur-2xl rounded-full p-8 border border-green-400/20 shadow-2xl">
              <VoiceVisualizer 
                isActive={isSpeaking || audioLevel > 0.2} 
                audioLevel={audioLevel} 
                isAI={false} 
                size="large"
              />
              
              {/* Orbital rings */}
              <div className="absolute inset-0 rounded-full border border-green-400/20 animate-spin" style={{animationDuration: '20s'}} />
              <div className="absolute inset-2 rounded-full border border-green-300/10 animate-spin" style={{animationDuration: '15s', animationDirection: 'reverse'}} />
              
              {/* Status indicator */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-500 ${
                  isSpeaking || audioLevel > 0.2
                    ? 'bg-green-400/20 text-green-300 border border-green-400/40 shadow-lg shadow-green-400/20' 
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}>
                  You
                </div>
              </div>
            </div>
          </div>

          {/* Central Gravity Well */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500/20 via-transparent to-blue-500/20 border-2 border-white/30 flex items-center justify-center backdrop-blur-xl shadow-2xl">
              <div className="text-white/90 font-bold text-lg">✦</div>
            </div>
            
            {/* Energy rings */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{animationDuration: '3s'}} />
            <div className="absolute inset-2 rounded-full border border-blue-400/20 animate-ping" style={{animationDuration: '4s', animationDelay: '1s'}} />
            
            {/* Connection lines when active */}
            {(isSpeaking || audioLevel > 0.2 || aiSpeaking || aiAudioLevel > 0.2) && (
              <>
                <div className="absolute top-1/2 -left-32 w-32 h-px bg-gradient-to-r from-transparent to-green-400/50 animate-pulse" />
                <div className="absolute top-1/2 -right-32 w-32 h-px bg-gradient-to-l from-transparent to-purple-400/50 animate-pulse" />
              </>
            )}
          </div>

          {/* AI Orbit */}
          <div className="relative">
            {/* Floating ethereal container */}
            <div className="relative bg-black/10 backdrop-blur-2xl rounded-full p-8 border border-purple-400/20 shadow-2xl">
              <VoiceVisualizer 
                isActive={aiSpeaking || aiAudioLevel > 0.05} 
                audioLevel={Math.max(aiAudioLevel, aiSpeaking ? 0.7 : 0)} 
                isAI={true} 
                size="large"
              />
              
              {/* Orbital rings */}
              <div className="absolute inset-0 rounded-full border border-purple-400/20 animate-spin" style={{animationDuration: '25s'}} />
              <div className="absolute inset-2 rounded-full border border-blue-300/10 animate-spin" style={{animationDuration: '18s', animationDirection: 'reverse'}} />
              
              {/* Status indicator */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className={`px-6 py-1.5 rounded-full text-xs font-medium transition-all duration-500 whitespace-nowrap ${
                  aiSpeaking || aiAudioLevel > 0.2
                    ? 'bg-purple-400/20 text-purple-300 border border-purple-400/40 shadow-lg shadow-purple-400/20' 
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}>
                  100X Prompt
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <button
          type="button"
          onClick={handleEndCall}
          className="p-5 rounded-full bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-all duration-300 transform hover:scale-110 shadow-xl shadow-red-500/20 text-red-300 backdrop-blur-xl"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      <audio ref={audioRef} autoPlay />

      {/* Microphone Permission Modal */}
      {showMicPermissionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              {/* Microphone Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {micPermissionDenied ? 'Microphone Access Required' : 'Enable Microphone'}
              </h3>
              
              <p className="text-gray-300 mb-8 leading-relaxed">
                {micPermissionDenied 
                  ? 'We need access to your microphone to start the voice conversation with our AI sales agent. Please enable microphone permissions in your browser settings.'
                  : 'To have a voice conversation with our 100X Prompt AI sales agent, we need access to your microphone.'
                }
              </p>
              
              <div className="flex flex-col space-y-4">
                {!micPermissionDenied ? (
                  <>
                    <button
                      onClick={requestMicrophoneAccess}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Enable Microphone
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full py-3 text-gray-400 hover:text-white transition-colors duration-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Refresh & Try Again
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full py-3 text-gray-400 hover:text-white transition-colors duration-300"
                    >
                      Go Back
                    </button>
                  </>
                )}
              </div>
              
              {micPermissionDenied && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-yellow-300 text-sm">
                    💡 <strong>Tip:</strong> Look for the microphone icon in your browser's address bar and click "Allow"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChatPage;