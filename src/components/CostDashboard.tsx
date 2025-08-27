// Cost Dashboard with detailed service breakdown
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Info,
  BarChart3,
  PieChart,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { CostCalculator, CallCostBreakdown } from '../lib/costCalculator';

interface CostDashboardProps {
  totalCost: number;
  activeCalls: any[];
  callHistory: any[];
}

export default function CostDashboard({ totalCost, activeCalls, callHistory }: CostDashboardProps) {
  const [costBreakdown, setCostBreakdown] = useState<CallCostBreakdown | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [monthlyEstimate, setMonthlyEstimate] = useState<any>(null);

  // Calculate cost breakdown for current active calls
  useEffect(() => {
    if (activeCalls.length > 0) {
      const totalMinutes = activeCalls.reduce((sum, call) => {
        const elapsed = (Date.now() - call.startTime) / (1000 * 60);
        return sum + elapsed;
      }, 0);
      
      if (totalMinutes > 0) {
        const breakdown = CostCalculator.calculateCallCost(totalMinutes, true);
        setCostBreakdown(breakdown);
      }
    } else {
      setCostBreakdown(null);
    }
  }, [activeCalls, totalCost]);

  // Calculate monthly estimate
  useEffect(() => {
    if (callHistory.length > 0) {
      const avgCallDuration = callHistory.reduce((sum, call) => sum + (call.duration || 0), 0) / callHistory.length;
      const avgCallsPerDay = Math.max(1, callHistory.length / 30); // Rough estimate
      
      const estimate = CostCalculator.estimateMonthlyCosts({
        averageCallsPerDay: avgCallsPerDay,
        averageCallDurationMinutes: avgCallDuration / (1000 * 60),
        outboundPercentage: 0.8, // Assume 80% outbound
        workingDaysPerMonth: 22,
      });
      
      setMonthlyEstimate(estimate);
    }
  }, [callHistory]);

  const thresholds = CostCalculator.getCostThresholds();
  const getCurrentThreshold = () => {
    if (totalCost >= thresholds.critical) return { level: 'critical', color: 'red-500', bg: 'red-500/20' };
    if (totalCost >= thresholds.high) return { level: 'high', color: 'orange-500', bg: 'orange-500/20' };
    if (totalCost >= thresholds.medium) return { level: 'medium', color: 'yellow-500', bg: 'yellow-500/20' };
    if (totalCost >= thresholds.low) return { level: 'low', color: 'blue-500', bg: 'blue-500/20' };
    return { level: 'safe', color: 'green-500', bg: 'green-500/20' };
  };

  const threshold = getCurrentThreshold();

  return (
    <div className="space-y-6">
      {/* Main Cost Overview */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-${threshold.color}/30 rounded-xl p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg bg-${threshold.bg}`}>
              <DollarSign className={`w-6 h-6 text-${threshold.color}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Live Cost Tracking</h3>
              <p className="text-gray-400 text-sm">Real-time service cost breakdown</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Current Total</p>
            <motion.p
              key={totalCost}
              initial={{ scale: 1.1, color: `rgb(34 197 94)` }}
              animate={{ scale: 1, color: 'rgb(255 255 255)' }}
              className={`text-2xl font-bold text-${threshold.color}`}
            >
              ${totalCost.toFixed(6)}
            </motion.p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">Per Minute</p>
            <p className="text-2xl font-bold text-white">
              ${CostCalculator.getRealTimeCostPerMinute().toFixed(6)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">Active Calls</p>
            <p className="text-2xl font-bold text-white">{activeCalls.length}</p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">Today's Total</p>
            <p className="text-2xl font-bold text-white">
              ${(callHistory.reduce((sum, call) => sum + call.cost, 0) + totalCost).toFixed(4)}
            </p>
          </div>
        </div>

        {/* Cost Threshold Indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Cost Level: {threshold.level.toUpperCase()}</span>
            <span className="text-gray-400">
              Next alert: ${Object.values(thresholds).find(t => t > totalCost)?.toFixed(2) || 'MAX'}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 bg-${threshold.color} rounded-full`}
              initial={{ width: '0%' }}
              animate={{ 
                width: `${Math.min((totalCost / thresholds.critical) * 100, 100)}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Detailed Breakdown */}
      {showBreakdown && costBreakdown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-bold text-white">Service Cost Breakdown</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Service Costs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">LiveKit (Infrastructure)</p>
                  <p className="text-gray-400 text-sm">Connection, bandwidth, processing</p>
                </div>
                <p className="text-white font-bold">${costBreakdown.livekit.total.toFixed(6)}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Deepgram (STT)</p>
                  <p className="text-gray-400 text-sm">Nova 2 speech-to-text</p>
                </div>
                <p className="text-white font-bold">${costBreakdown.deepgram.toFixed(6)}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">ElevenLabs (TTS)</p>
                  <p className="text-gray-400 text-sm">Voice synthesis</p>
                </div>
                <p className="text-white font-bold">${costBreakdown.elevenlabs.toFixed(6)}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Groq (LLM)</p>
                  <p className="text-gray-400 text-sm">Llama 3.3 70B inference</p>
                </div>
                <p className="text-white font-bold">${costBreakdown.groq.total.toFixed(6)}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Twilio (SIP)</p>
                  <p className="text-gray-400 text-sm">Telephony gateway</p>
                </div>
                <p className="text-white font-bold">${costBreakdown.twilio.toFixed(6)}</p>
              </div>
            </div>

            {/* Right Column - Statistics */}
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-600/30">
                <h5 className="text-white font-bold mb-2">Cost Distribution</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Infrastructure:</span>
                    <span className="text-white">
                      {((costBreakdown.livekit.total / costBreakdown.totalCost) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">AI Services:</span>
                    <span className="text-white">
                      {(((costBreakdown.deepgram + costBreakdown.elevenlabs + costBreakdown.groq.total) / costBreakdown.totalCost) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Telephony:</span>
                    <span className="text-white">
                      {((costBreakdown.twilio / costBreakdown.totalCost) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {monthlyEstimate && (
                <div className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg border border-green-600/30">
                  <h5 className="text-white font-bold mb-2">Monthly Estimate</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Daily avg:</span>
                      <span className="text-white">${monthlyEstimate.dailyCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Monthly proj:</span>
                      <span className="text-white">${monthlyEstimate.monthlyCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Tips */}
          <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <h5 className="text-yellow-400 font-bold">Cost Optimization Tips</h5>
            </div>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• Monitor call duration - costs scale linearly with time</li>
              <li>• Most cost comes from AI services (STT, TTS, LLM)</li>
              <li>• Set call time limits to prevent runaway costs</li>
              <li>• Consider batching operations for volume discounts</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}