// Call Manager with real-time state management and cost tracking
import { EventEmitter } from 'events';
import { CostCalculator } from './costCalculator';

export interface CallState {
  callId: string;
  phoneNumber: string;
  contactName: string;
  status: 'connecting' | 'active' | 'ended' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  cost: number;
  costPerMinute: number;
  roomName: string;
  participantId?: string;
  sipCallId?: string;
}

export interface CallEvent {
  type: 'call_started' | 'call_ended' | 'call_failed' | 'cost_updated' | 'participant_disconnected';
  callId: string;
  data?: any;
  timestamp: number;
}

class CallManager extends EventEmitter {
  private activeCalls = new Map<string, CallState>();
  private costUpdateInterval?: NodeJS.Timeout;
  private disconnectionWatchers = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
    this.startCostTracking();
  }

  // Start a new call with immediate cost tracking
  startCall(callData: {
    callId: string;
    phoneNumber: string;
    contactName: string;
    roomName: string;
    participantId?: string;
    sipCallId?: string;
    costPerMinute?: number;
  }): CallState {
    // Get real-time cost per minute using accurate calculations
    const realCostPerMinute = CostCalculator.getRealTimeCostPerMinute(true); // Assume outbound
    
    const call: CallState = {
      ...callData,
      status: 'connecting',
      startTime: Date.now(),
      cost: 0,
      costPerMinute: realCostPerMinute,
    };

    this.activeCalls.set(callData.callId, call);
    
    // Start monitoring for disconnection
    this.startDisconnectionWatcher(callData.callId);
    
    this.emit('call_started', {
      type: 'call_started',
      callId: callData.callId,
      data: call,
      timestamp: Date.now(),
    } as CallEvent);

    return call;
  }

  // Update call status (connecting -> active -> ended)
  updateCallStatus(callId: string, status: CallState['status'], data?: any): void {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const oldStatus = call.status;
    call.status = status;

    // Handle status transitions
    if (status === 'active' && oldStatus === 'connecting') {
      // Call successfully connected
      console.log(`✅ Call ${callId} connected successfully`);
    } else if (status === 'ended' || status === 'failed') {
      this.endCall(callId, status === 'failed' ? 'failed' : 'ended');
    }

    this.emit('status_changed', {
      type: status === 'ended' ? 'call_ended' : status === 'failed' ? 'call_failed' : 'status_changed',
      callId,
      data: { ...call, oldStatus },
      timestamp: Date.now(),
    } as CallEvent);
  }

  // End call and finalize costs immediately
  endCall(callId: string, reason: 'ended' | 'failed' | 'disconnected' = 'ended'): CallState | null {
    const call = this.activeCalls.get(callId);
    if (!call) return null;

    const endTime = Date.now();
    const duration = endTime - call.startTime;
    const finalCost = this.calculateFinalCost(duration);

    // Update call with final values
    call.endTime = endTime;
    call.duration = duration;
    call.cost = finalCost;
    call.status = reason === 'failed' ? 'failed' : 'ended';

    // Stop monitoring
    this.stopDisconnectionWatcher(callId);

    // Remove from active calls
    this.activeCalls.delete(callId);

    // Emit final event
    this.emit('call_ended', {
      type: 'call_ended',
      callId,
      data: { ...call, reason },
      timestamp: Date.now(),
    } as CallEvent);

    console.log(`📞 Call ${callId} ended. Duration: ${Math.round(duration / 1000)}s, Cost: $${finalCost.toFixed(4)}`);

    return call;
  }

  // Real-time disconnection detection
  private startDisconnectionWatcher(callId: string): void {
    const checkInterval = 5000; // Check every 5 seconds
    
    const watcher = setInterval(async () => {
      const call = this.activeCalls.get(callId);
      if (!call) {
        clearInterval(watcher);
        return;
      }

      try {
        // Check if participant is still connected via LiveKit API
        const isConnected = await this.checkParticipantConnection(call);
        
        if (!isConnected && call.status === 'active') {
          console.log(`🔌 Participant disconnected for call ${callId}`);
          this.handleDisconnection(callId);
        }
      } catch (error) {
        console.error(`❌ Error checking connection for call ${callId}:`, error);
      }
    }, checkInterval);

    this.disconnectionWatchers.set(callId, watcher);
  }

  private stopDisconnectionWatcher(callId: string): void {
    const watcher = this.disconnectionWatchers.get(callId);
    if (watcher) {
      clearInterval(watcher);
      this.disconnectionWatchers.delete(callId);
    }
  }

  // Handle immediate disconnection
  private handleDisconnection(callId: string): void {
    this.emit('participant_disconnected', {
      type: 'participant_disconnected',
      callId,
      timestamp: Date.now(),
    } as CallEvent);

    // Immediately end the call and stop cost accrual
    this.endCall(callId, 'disconnected');
  }

  // Check participant connection via LiveKit API
  private async checkParticipantConnection(call: CallState): Promise<boolean> {
    if (!call.roomName) return false;

    try {
      const response = await fetch(`/api/make-call?room=${encodeURIComponent(call.roomName)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return data.participants && data.participants.length > 0;
      }
    } catch (error) {
      console.error('Error checking participant connection:', error);
    }

    return false;
  }

  // Real-time cost calculation using accurate service costs
  private calculateRealTimeCost(startTime: number): number {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    return CostCalculator.calculateCostForDuration(elapsedSeconds, true);
  }

  private calculateFinalCost(durationMs: number): number {
    const durationSeconds = durationMs / 1000;
    const actualCost = CostCalculator.calculateCostForDuration(durationSeconds, true);
    return Math.max(actualCost, 0.001); // Minimum $0.001 charge
  }

  // Start real-time cost tracking for all active calls
  private startCostTracking(): void {
    this.costUpdateInterval = setInterval(() => {
      this.activeCalls.forEach((call, callId) => {
        if (call.status === 'active') {
          const currentCost = this.calculateRealTimeCost(call.startTime);
          if (Math.abs(currentCost - call.cost) > 0.001) { // Update if cost changed significantly
            call.cost = currentCost;
            
            this.emit('cost_updated', {
              type: 'cost_updated',
              callId,
              data: { ...call },
              timestamp: Date.now(),
            } as CallEvent);
          }
        }
      });
    }, 1000); // Update every second
  }

  // Get current call state
  getCall(callId: string): CallState | undefined {
    return this.activeCalls.get(callId);
  }

  // Get all active calls
  getActiveCalls(): CallState[] {
    return Array.from(this.activeCalls.values());
  }

  // Get total current cost across all active calls
  getTotalActiveCost(): number {
    return Array.from(this.activeCalls.values())
      .filter(call => call.status === 'active')
      .reduce((total, call) => total + this.calculateRealTimeCost(call.startTime), 0);
  }

  // Force disconnect all calls (emergency stop)
  disconnectAllCalls(): void {
    const activeCalls = Array.from(this.activeCalls.keys());
    activeCalls.forEach(callId => {
      this.endCall(callId, 'disconnected');
    });
  }

  // Cleanup
  destroy(): void {
    if (this.costUpdateInterval) {
      clearInterval(this.costUpdateInterval);
    }
    
    this.disconnectionWatchers.forEach((watcher) => {
      clearInterval(watcher);
    });
    this.disconnectionWatchers.clear();
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const callManager = new CallManager();
export default CallManager;