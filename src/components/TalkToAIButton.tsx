import React, { useState } from 'react';
import { Phone, PhoneCall, X } from 'lucide-react';

interface TalkToAIButtonProps {
  className?: string;
}

const TalkToAIButton: React.FC<TalkToAIButtonProps> = ({ className = '' }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleStartCall = async () => {
    try {
      setIsConnecting(true);
      
      // Create LiveKit room
      const response = await fetch('/api/create-voice-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentType: '100x-prompt-sales'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      setRoomId(data.roomId);
      setIsConnected(true);
      
      // Open the voice interface in a new window or modal
      window.open(`/voice-chat?room=${data.roomId}&token=${data.token}`, '_blank', 'width=400,height=600');
      
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to start call. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEndCall = () => {
    setIsConnected(false);
    setRoomId(null);
  };

  if (isConnected) {
    return (
      <div className={`fixed bottom-6 left-6 z-50 ${className}`}>
        <div className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-all duration-200">
          <PhoneCall className="w-5 h-5" />
          <span className="text-sm font-medium">Connected to AI Agent</span>
          <button
            onClick={handleEndCall}
            className="ml-2 p-1 hover:bg-red-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 ${className}`}>
      <button
        onClick={handleStartCall}
        disabled={isConnecting}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Phone className="w-5 h-5" />
        <span className="text-sm font-medium">
          {isConnecting ? 'Connecting...' : 'Talk to AI Assistant'}
        </span>
      </button>
    </div>
  );
};

export default TalkToAIButton;