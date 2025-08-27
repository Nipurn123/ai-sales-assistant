// Comprehensive cost calculator based on actual 2025 pricing for all services

export interface ServiceCosts {
  livekit: {
    connection: number; // per minute
    bandwidth: number; // per GB
    processing: number; // per minute for audio
  };
  deepgram: {
    nova2: number; // per minute
  };
  elevenlabs: {
    standard: number; // per character
    creditsToMinutes: number; // characters per minute of speech
  };
  groq: {
    input: number; // per token
    output: number; // per token
    averageTokensPerMinute: number; // estimated tokens per minute of conversation
  };
  twilio: {
    inbound: number; // per minute
    outbound: number; // per minute
  };
}

// Actual 2025 pricing based on web research
export const SERVICE_COSTS: ServiceCosts = {
  // LiveKit pricing (with volume discounts considered)
  livekit: {
    connection: 0.0005, // $0.0005 per minute connection fee
    bandwidth: 0.12, // $0.12 per GB (estimated 1MB per minute for audio)
    processing: 0.004, // $0.004 per minute for audio-only processing
  },
  
  // Deepgram Nova 2 pricing
  deepgram: {
    nova2: 0.0043, // $0.0043 per minute (based on Nova 3 pricing, Nova 2 likely similar)
  },
  
  // ElevenLabs pricing (credit-based system)
  elevenlabs: {
    standard: 0.00003, // ~$0.03 per 1000 characters (Creator plan estimate)
    creditsToMinutes: 1000, // ~1000 characters per minute of speech
  },
  
  // Groq Llama 3.3 70B pricing
  groq: {
    input: 0.00000059, // $0.59 per million tokens
    output: 0.00000079, // $0.79 per million tokens
    averageTokensPerMinute: 500, // Estimated 250 input + 250 output tokens per minute
  },
  
  // Twilio SIP pricing (estimated based on standard rates)
  twilio: {
    inbound: 0.0085, // $0.0085 per minute for inbound calls
    outbound: 0.013, // $0.013 per minute for outbound calls (US domestic)
  },
};

export interface CallCostBreakdown {
  livekit: {
    connection: number;
    bandwidth: number;
    processing: number;
    total: number;
  };
  deepgram: number;
  elevenlabs: number;
  groq: {
    input: number;
    output: number;
    total: number;
  };
  twilio: number;
  totalCost: number;
  costPerMinute: number;
}

export class CostCalculator {
  // Calculate comprehensive cost breakdown for a call
  static calculateCallCost(durationMinutes: number, isOutbound: boolean = true): CallCostBreakdown {
    const costs = SERVICE_COSTS;
    
    // LiveKit costs
    const livekitConnection = durationMinutes * costs.livekit.connection;
    const livekitBandwidth = durationMinutes * (1/1024) * costs.livekit.bandwidth; // ~1MB per minute
    const livekitProcessing = durationMinutes * costs.livekit.processing;
    const livekitTotal = livekitConnection + livekitBandwidth + livekitProcessing;
    
    // Deepgram STT cost
    const deepgramCost = durationMinutes * costs.deepgram.nova2;
    
    // ElevenLabs TTS cost (estimated characters per minute)
    const elevenlabsCost = durationMinutes * costs.elevenlabs.creditsToMinutes * costs.elevenlabs.standard;
    
    // Groq LLM costs
    const groqInputTokens = durationMinutes * (costs.groq.averageTokensPerMinute / 2); // Half input
    const groqOutputTokens = durationMinutes * (costs.groq.averageTokensPerMinute / 2); // Half output
    const groqInputCost = groqInputTokens * costs.groq.input;
    const groqOutputCost = groqOutputTokens * costs.groq.output;
    const groqTotal = groqInputCost + groqOutputCost;
    
    // Twilio SIP cost
    const twilioCost = durationMinutes * (isOutbound ? costs.twilio.outbound : costs.twilio.inbound);
    
    // Total cost
    const totalCost = livekitTotal + deepgramCost + elevenlabsCost + groqTotal + twilioCost;
    const costPerMinute = totalCost / Math.max(durationMinutes, 1);
    
    return {
      livekit: {
        connection: livekitConnection,
        bandwidth: livekitBandwidth,
        processing: livekitProcessing,
        total: livekitTotal,
      },
      deepgram: deepgramCost,
      elevenlabs: elevenlabsCost,
      groq: {
        input: groqInputCost,
        output: groqOutputCost,
        total: groqTotal,
      },
      twilio: twilioCost,
      totalCost,
      costPerMinute,
    };
  }
  
  // Get real-time cost per minute for active calls
  static getRealTimeCostPerMinute(isOutbound: boolean = true): number {
    const breakdown = this.calculateCallCost(1, isOutbound);
    return breakdown.costPerMinute;
  }
  
  // Calculate cost for a specific duration in seconds
  static calculateCostForDuration(durationSeconds: number, isOutbound: boolean = true): number {
    const durationMinutes = durationSeconds / 60;
    const breakdown = this.calculateCallCost(durationMinutes, isOutbound);
    return breakdown.totalCost;
  }
  
  // Get cost breakdown as formatted string
  static formatCostBreakdown(breakdown: CallCostBreakdown): string {
    return `
Cost Breakdown:
├── LiveKit: $${breakdown.livekit.total.toFixed(6)}
│   ├── Connection: $${breakdown.livekit.connection.toFixed(6)}
│   ├── Bandwidth: $${breakdown.livekit.bandwidth.toFixed(6)}
│   └── Processing: $${breakdown.livekit.processing.toFixed(6)}
├── Deepgram STT: $${breakdown.deepgram.toFixed(6)}
├── ElevenLabs TTS: $${breakdown.elevenlabs.toFixed(6)}
├── Groq LLM: $${breakdown.groq.total.toFixed(6)}
│   ├── Input tokens: $${breakdown.groq.input.toFixed(6)}
│   └── Output tokens: $${breakdown.groq.output.toFixed(6)}
├── Twilio SIP: $${breakdown.twilio.toFixed(6)}
└── Total: $${breakdown.totalCost.toFixed(6)} (${breakdown.costPerMinute.toFixed(6)}/min)
    `.trim();
  }
  
  // Estimate monthly costs based on usage patterns
  static estimateMonthlyCosts(params: {
    averageCallsPerDay: number;
    averageCallDurationMinutes: number;
    outboundPercentage: number; // 0-1, percentage of outbound calls
    workingDaysPerMonth: number;
  }): {
    dailyCost: number;
    monthlyCost: number;
    breakdown: CallCostBreakdown;
  } {
    const { averageCallsPerDay, averageCallDurationMinutes, outboundPercentage, workingDaysPerMonth } = params;
    
    // Calculate weighted cost per minute (mix of inbound/outbound)
    const outboundCost = this.calculateCallCost(averageCallDurationMinutes, true);
    const inboundCost = this.calculateCallCost(averageCallDurationMinutes, false);
    
    const weightedCostPerCall = 
      (outboundCost.totalCost * outboundPercentage) + 
      (inboundCost.totalCost * (1 - outboundPercentage));
    
    const dailyCost = averageCallsPerDay * weightedCostPerCall;
    const monthlyCost = dailyCost * workingDaysPerMonth;
    
    // Create a representative breakdown (using outbound as default)
    const breakdown = outboundCost;
    
    return {
      dailyCost,
      monthlyCost,
      breakdown,
    };
  }
  
  // Get cost thresholds for alerts
  static getCostThresholds() {
    return {
      low: 0.50,    // $0.50 - Yellow alert
      medium: 1.00, // $1.00 - Orange alert  
      high: 2.00,   // $2.00 - Red alert
      critical: 5.00, // $5.00 - Critical alert
    };
  }
}