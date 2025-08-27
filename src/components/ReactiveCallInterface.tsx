// Reactive Call Interface Component
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  DollarSign,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useCallState } from '../hooks/useCallState';
import CostDashboard from './CostDashboard';

export default function ReactiveCallInterface() {
  const { 
    activeCalls, 
    totalCost, 
    callHistory, 
    isAnyCallActive, 
    endCall, 
    endAllCalls 
  } = useCallState();

  const [costAlert, setCostAlert] = useState(false);
  const [costThreshold] = useState(1.00); // $1.00 threshold
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cost threshold monitoring
  useEffect(() => {
    if (totalCost > costThreshold && !costAlert) {
      setCostAlert(true);
      
      // Play sound if enabled
      if (soundEnabled && 'Audio' in window) {
        try {
          const audio = new Audio('/api/sounds/cost-alert.mp3');
          audio.play().catch(console.error);
        } catch (error) {
          console.error('Error playing cost alert sound:', error);
        }
      }
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Cost Alert', {
          body: `Total call costs have exceeded $${costThreshold.toFixed(2)}. Current: $${totalCost.toFixed(4)}`,
          icon: '/favicon.ico'
        });
      }
    } else if (totalCost <= costThreshold) {
      setCostAlert(false);
    }
  }, [totalCost, costThreshold, costAlert, soundEnabled]);

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format cost
  const formatCost = (cost: number) => {
    return cost < 0.01 ? '<$0.01' : `$${cost.toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Cost Dashboard */}
      <CostDashboard 
        totalCost={totalCost}
        activeCalls={activeCalls}
        callHistory={callHistory}
      />

      {/* Emergency Controls */}
      {isAnyCallActive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </motion.div>
              <div>
                <h3 className="text-white font-bold">Emergency Controls</h3>
                <p className="text-gray-300 text-sm">{activeCalls.length} active call{activeCalls.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <button
              onClick={endAllCalls}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End All Calls</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Active Calls */}
      <AnimatePresence>
        {activeCalls.map((call) => (
          <motion.div
            key={call.callId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded-full animate-pulse ${
                    call.status === 'active' ? 'bg-green-400' :
                    call.status === 'connecting' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}></div>
                  
                  <h4 className="text-xl font-bold text-white">{call.contactName}</h4>
                  
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    call.status === 'active' ? 'bg-green-600/20 text-green-400' :
                    call.status === 'connecting' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {call.status}
                  </span>
                </div>
                
                <p className="text-gray-400 mb-2">{call.phoneNumber}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <motion.p 
                      key={Date.now()}
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-white font-medium"
                    >
                      {formatDuration(Date.now() - call.startTime)}
                    </motion.p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Current Cost</p>
                    <motion.p 
                      key={call.cost}
                      initial={{ scale: 1.1, color: '#10B981' }}
                      animate={{ scale: 1, color: '#FFFFFF' }}
                      className="text-white font-medium"
                    >
                      {formatCost(call.cost)}
                    </motion.p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Rate</p>
                    <p className="text-white font-medium">${call.costPerMinute.toFixed(3)}/min</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Started</p>
                    <p className="text-white font-medium">
                      {new Date(call.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-3">
                <button
                  onClick={() => endCall(call.callId)}
                  className="bg-red-600 hover:bg-red-700 p-3 rounded-lg text-white"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
                
                {/* Real-time cost meter */}
                <div className="text-right">
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 to-red-400"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: `${Math.min((call.cost / costThreshold) * 100, 100)}%` 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Cost meter</p>
                </div>
              </div>
            </div>

            {/* Connection Status Indicator */}
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {call.status === 'active' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : call.status === 'connecting' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-gray-400">
                  {call.status === 'active' ? 'Connected & Tracking' :
                   call.status === 'connecting' ? 'Establishing Connection...' :
                   'Connection Failed'}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 text-gray-500">
                <span>Room: {call.roomName?.split('-').pop()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* No Active Calls State */}
      {!isAnyCallActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 rounded-xl p-8 text-center"
        >
          <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Active Calls</h3>
          <p className="text-gray-400">
            All calls have ended. Costs have been finalized and saved.
          </p>
          
          {callHistory.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Last call: {formatCost(callHistory[callHistory.length - 1]?.cost || 0)} • 
              Total today: {formatCost(callHistory.reduce((sum, call) => sum + call.cost, 0))}
            </div>
          )}
        </motion.div>
      )}

      {/* Cost Alert Notification */}
      <AnimatePresence>
        {costAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-bold">Cost Threshold Exceeded</p>
                <p className="text-sm">Current cost: {formatCost(totalCost)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}