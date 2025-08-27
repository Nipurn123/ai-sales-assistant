// React hook for reactive call state management
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { callManager, CallState, CallEvent } from '../lib/callManager';

export interface UseCallStateReturn {
  activeCalls: CallState[];
  totalCost: number;
  callHistory: CallState[];
  isAnyCallActive: boolean;
  startCall: (callData: {
    phoneNumber: string;
    contactName: string;
    systemPrompt?: string;
  }) => Promise<void>;
  endCall: (callId: string) => void;
  endAllCalls: () => void;
}

export function useCallState(): UseCallStateReturn {
  const [activeCalls, setActiveCalls] = useState<CallState[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [callHistory, setCallHistory] = useState<CallState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const eventListenersRef = useRef<Map<string, (event: CallEvent) => void>>(new Map());

  // Load call history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('callHistory');
    if (savedHistory) {
      try {
        setCallHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading call history:', error);
      }
    }
  }, []);

  // Save call history to localStorage
  const saveCallHistory = useCallback((history: CallState[]) => {
    try {
      localStorage.setItem('callHistory', JSON.stringify(history.slice(-100))); // Keep last 100 calls
    } catch (error) {
      console.error('Error saving call history:', error);
    }
  }, []);

  // Update active calls and total cost
  const updateState = useCallback(() => {
    const currentActiveCalls = callManager.getActiveCalls();
    const currentTotalCost = callManager.getTotalActiveCost();
    
    setActiveCalls(currentActiveCalls);
    setTotalCost(currentTotalCost);
  }, []);

  // Handle call events
  useEffect(() => {
    const handleCallStarted = (event: CallEvent) => {
      console.log('🚀 Call started:', event.callId);
      updateState();
    };

    const handleCallEnded = (event: CallEvent) => {
      console.log('📞 Call ended:', event.callId, event.data);
      updateState();
      
      // Add to history
      if (event.data) {
        setCallHistory(prev => {
          const newHistory = [...prev, event.data as CallState];
          saveCallHistory(newHistory);
          return newHistory;
        });
      }
    };

    const handleCallFailed = (event: CallEvent) => {
      console.log('❌ Call failed:', event.callId, event.data);
      updateState();
      
      // Add to history
      if (event.data) {
        setCallHistory(prev => {
          const newHistory = [...prev, event.data as CallState];
          saveCallHistory(newHistory);
          return newHistory;
        });
      }
    };

    const handleCostUpdated = (event: CallEvent) => {
      updateState();
    };

    const handleParticipantDisconnected = (event: CallEvent) => {
      console.log('🔌 Participant disconnected, ending call immediately:', event.callId);
      
      // Show notification to user
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Call Disconnected', {
          body: 'Call ended due to participant disconnection. Costs stopped immediately.',
          icon: '/favicon.ico'
        });
      }
      
      updateState();
    };

    // Store event listeners in ref for cleanup
    eventListenersRef.current.set('call_started', handleCallStarted);
    eventListenersRef.current.set('call_ended', handleCallEnded);
    eventListenersRef.current.set('call_failed', handleCallFailed);
    eventListenersRef.current.set('cost_updated', handleCostUpdated);
    eventListenersRef.current.set('participant_disconnected', handleParticipantDisconnected);

    // Register event listeners
    callManager.on('call_started', handleCallStarted);
    callManager.on('call_ended', handleCallEnded);
    callManager.on('call_failed', handleCallFailed);
    callManager.on('cost_updated', handleCostUpdated);
    callManager.on('participant_disconnected', handleParticipantDisconnected);

    // Initial state update
    updateState();

    return () => {
      // Cleanup event listeners
      eventListenersRef.current.forEach((handler, event) => {
        callManager.off(event, handler);
      });
      eventListenersRef.current.clear();
    };
  }, [updateState, saveCallHistory]);

  // Start a new call
  const startCall = useCallback(async (callData: {
    phoneNumber: string;
    contactName: string;
    systemPrompt?: string;
  }) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Starting call to:', callData.phoneNumber);
      
      // Call the API to initiate the call
      const response = await fetch('/api/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Register call with call manager
        const callState = callManager.startCall({
          callId: result.callId,
          phoneNumber: callData.phoneNumber,
          contactName: callData.contactName,
          roomName: result.roomName,
          participantId: result.participantId,
          sipCallId: result.sipCallId,
        });

        // Update call status to active after successful API call
        setTimeout(() => {
          callManager.updateCallStatus(result.callId, 'active');
        }, 2000); // 2 second delay to simulate connection time

        console.log('✅ Call initiated successfully:', callState);
      } else {
        throw new Error(result.error || 'Failed to start call');
      }
    } catch (error) {
      console.error('❌ Error starting call:', error);
      
      // Show error notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Call Failed', {
          body: `Failed to start call to ${callData.contactName}: ${error.message}`,
          icon: '/favicon.ico'
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // End a specific call
  const endCall = useCallback((callId: string) => {
    console.log('📞 Ending call:', callId);
    callManager.endCall(callId, 'ended');
  }, []);

  // End all active calls
  const endAllCalls = useCallback(() => {
    console.log('📞 Ending all active calls');
    callManager.disconnectAllCalls();
  }, []);

  // Request notification permission on first use
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    activeCalls,
    totalCost,
    callHistory,
    isAnyCallActive: activeCalls.length > 0,
    startCall,
    endCall,
    endAllCalls,
  };
}