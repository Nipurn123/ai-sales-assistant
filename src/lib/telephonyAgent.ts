// Enhanced JavaScript Telephony Agent using LiveKit Client SDK patterns
import { EventEmitter } from 'events';
import { 
  Room, 
  RoomEvent, 
  LocalAudioTrack, 
  RemoteAudioTrack, 
  Track, 
  createAudioAnalyser, 
  RpcError,
  ParticipantEvent,
  TrackEvent,
  ConnectionQuality,
  DisconnectReason,
  MediaDeviceFailure,
} from 'livekit-client';

interface AgentConfig {
  roomUrl: string;
  roomToken: string;
  instructions?: string;
  contactName?: string;
  systemPrompt?: string;
  customInstructions?: string;
  voiceSettings?: {
    voice?: string;
    language?: string;
    model?: string;
  };
  aiProviders?: {
    stt?: 'deepgram' | 'openai';
    llm?: 'groq' | 'openai' | 'anthropic';
    tts?: 'elevenlabs' | 'openai';
  };
}

interface FunctionTool {
  name: string;
  description: string;
  parameters?: any;
  execute: (args: any, context: AgentContext) => Promise<string>;
}

interface AgentContext {
  room: Room;
  participant?: any;
  callId?: string;
  metadata?: any;
}

export class TelephonyAgent extends EventEmitter {
  private room: Room;
  private config: AgentConfig;
  private isConnected = false;
  private isProcessingAudio = false;
  private audioAnalyzer?: { calculateVolume: () => number; cleanup: () => void };
  private functionTools: Map<string, FunctionTool> = new Map();
  private sttBuffer: ArrayBuffer[] = [];
  private lastSpeechTime = 0;
  private silenceThreshold = 1000; // 1 second of silence
  private context: AgentContext;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.context = { room: null as any };
    this.setupRoom();
    this.registerDefaultTools();
  }

  private setupRoom() {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        dtx: true, // Discontinuous Transmission for voice
        red: true, // Redundancy encoding
        audioPreset: {
          maxBitrate: 32000, // Optimized for voice
          priority: 'high',
        },
      },
    });

    this.context.room = this.room;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Connection events
    this.room
      .on(RoomEvent.Connected, () => {
        console.log('🤖 Agent connected to room:', this.room.name);
        this.isConnected = true;
        this.emit('connected');
        this.setupLocalAudio();
      })
      .on(RoomEvent.Disconnected, (reason) => {
        console.log('🔌 Agent disconnected:', reason);
        this.isConnected = false;
        this.emit('disconnected', reason);
        
        if (reason === DisconnectReason.SERVER_SHUTDOWN) {
          this.attemptReconnection();
        }
      })
      .on(RoomEvent.Reconnecting, () => {
        console.log('🔄 Agent reconnecting...');
        this.pauseAudioProcessing();
      })
      .on(RoomEvent.Reconnected, () => {
        console.log('✅ Agent reconnected');
        this.resumeAudioProcessing();
      });

    // Participant events
    this.room
      .on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant joined:', participant.identity);
        this.emit('participantJoined', participant);
        this.handleParticipantJoined(participant);
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('👋 Participant left:', participant.identity);
        this.emit('participantLeft', participant);
      })
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        speakers.forEach((speaker) => {
          if (speaker.isSpeaking && speaker !== this.room.localParticipant) {
            this.handleSpeechDetected(speaker);
          }
        });
      });

    // Audio events
    this.room
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          this.handleRemoteAudioTrack(track as RemoteAudioTrack, participant);
        }
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        if (quality === ConnectionQuality.Poor) {
          console.log('⚠️ Poor connection detected');
          this.handlePoorConnection(participant);
        }
      });

    // Data channel for STT/LLM communication
    this.room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
      this.handleDataMessage(payload, participant, topic);
    });
  }

  private async setupLocalAudio() {
    try {
      // Enable microphone with optimized settings for voice
      await this.room.localParticipant.setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // Standard for speech recognition
        channelCount: 1, // Mono for voice
      });

      // Get local audio track for analysis
      const audioTrack = this.room.localParticipant.getTrackBySource(Track.Source.Microphone);
      if (audioTrack?.track instanceof LocalAudioTrack) {
        this.setupAudioAnalysis(audioTrack.track);
      }

      // Register RPC methods for AI service integration
      await this.registerRpcMethods();

      console.log('🎤 Local audio setup complete');
      this.emit('audioReady');

    } catch (error) {
      console.error('❌ Failed to setup local audio:', error);
      this.emit('audioError', error);
    }
  }

  private setupAudioAnalysis(audioTrack: LocalAudioTrack) {
    this.audioAnalyzer = createAudioAnalyser(audioTrack, {
      cloneTrack: true,
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
    });

    // Monitor for voice activity
    const monitorInterval = setInterval(() => {
      if (!this.audioAnalyzer) return;

      const volume = this.audioAnalyzer.calculateVolume();
      
      if (volume > 0.01) { // Voice detected
        this.lastSpeechTime = Date.now();
        if (!this.isProcessingAudio) {
          this.startAudioProcessing();
        }
      } else if (this.isProcessingAudio && 
                 Date.now() - this.lastSpeechTime > this.silenceThreshold) {
        // Silence detected - process accumulated audio
        this.processAccumulatedAudio();
      }
    }, 100);

    // Cleanup on track end
    audioTrack.on(TrackEvent.Ended, () => {
      clearInterval(monitorInterval);
      this.audioAnalyzer?.cleanup();
    });
  }

  private async registerRpcMethods() {
    // STT processing
    await this.room.localParticipant.registerRpcMethod(
      'processSTT',
      async ({ payload, responseTimeout }) => {
        try {
          const audioData = JSON.parse(payload);
          const transcription = await this.processSTT(audioData.audio);
          
          if (transcription.isFinal) {
            // Send to LLM for processing
            const response = await this.processWithLLM(transcription.text);
            
            // Generate TTS response
            if (response) {
              await this.generateTTSResponse(response);
            }
          }
          
          return JSON.stringify({ 
            transcription: transcription.text,
            isFinal: transcription.isFinal 
          });
        } catch (error) {
          throw new RpcError(1500, `STT processing failed: ${error.message}`);
        }
      }
    );

    // LLM function calls
    await this.room.localParticipant.registerRpcMethod(
      'callFunction',
      async ({ payload }) => {
        try {
          const { functionName, arguments: args } = JSON.parse(payload);
          const tool = this.functionTools.get(functionName);
          
          if (!tool) {
            throw new Error(`Function ${functionName} not found`);
          }
          
          const result = await tool.execute(args, this.context);
          return JSON.stringify({ result });
        } catch (error) {
          throw new RpcError(1500, `Function call failed: ${error.message}`);
        }
      }
    );

    // TTS playback
    await this.room.localParticipant.registerRpcMethod(
      'speak',
      async ({ payload }) => {
        try {
          const { text, voice, model } = JSON.parse(payload);
          await this.generateTTSResponse(text, { voice, model });
          return JSON.stringify({ status: 'completed' });
        } catch (error) {
          throw new RpcError(1500, `TTS failed: ${error.message}`);
        }
      }
    );
  }

  private handleRemoteAudioTrack(track: RemoteAudioTrack, participant: any) {
    // Attach remote audio for playback
    const audioElement = track.attach();
    audioElement.autoplay = true;

    // Analyze incoming audio for speech detection
    const analyzer = createAudioAnalyser(track);
    
    const monitorRemoteAudio = setInterval(() => {
      const volume = analyzer.calculateVolume();
      if (volume > 0.01) {
        this.handleSpeechDetected(participant, volume);
      }
    }, 100);

    track.on(TrackEvent.Ended, () => {
      clearInterval(monitorRemoteAudio);
      analyzer.cleanup();
    });
  }

  private async handleParticipantJoined(participant: any) {
    this.context.participant = participant;
    
    // Parse room metadata for custom instructions
    if (this.room.metadata) {
      try {
        const metadata = JSON.parse(this.room.metadata);
        this.updateInstructions(metadata);
        this.context.metadata = metadata;
      } catch (error) {
        console.error('Failed to parse room metadata:', error);
      }
    }

    // Send greeting message
    await this.sendGreeting(participant);
  }

  private updateInstructions(metadata: any) {
    const contactName = metadata.contactName || 'caller';
    const systemPrompt = metadata.systemPrompt || '';
    const customInstructions = metadata.customInstructions || '';

    if (systemPrompt || customInstructions) {
      const updatedInstructions = `
        ${systemPrompt}
        ${customInstructions}
        
        You are speaking with ${contactName}. Keep responses conversational and concise for voice interaction.
        Be friendly, helpful, and engaging. Avoid special characters, emojis, or markdown.
      `.trim();

      this.config.instructions = updatedInstructions;
      console.log(`📝 Updated instructions for call with ${contactName}`);
    }
  }

  private async sendGreeting(participant: any) {
    const greeting = "Hello! I'm your AI assistant. How can I help you today?";
    
    // Send via data channel for immediate processing
    this.room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({
        type: 'greeting',
        text: greeting,
        timestamp: Date.now(),
      })),
      { reliable: true, topic: 'agent-message' }
    );

    // Also generate TTS response
    await this.generateTTSResponse(greeting);
  }

  private startAudioProcessing() {
    this.isProcessingAudio = true;
    console.log('🎙️ Started audio processing');
  }

  private pauseAudioProcessing() {
    this.isProcessingAudio = false;
    console.log('⏸️ Paused audio processing');
  }

  private resumeAudioProcessing() {
    this.isProcessingAudio = true;
    console.log('▶️ Resumed audio processing');
  }

  private async processAccumulatedAudio() {
    if (this.sttBuffer.length === 0) return;

    try {
      // Combine audio chunks
      const audioBlob = new Blob(this.sttBuffer);
      
      // Process with STT
      const transcription = await this.processSTT(audioBlob);
      
      if (transcription.isFinal && transcription.text.trim()) {
        console.log('📝 Transcription:', transcription.text);
        
        // Process with LLM
        const response = await this.processWithLLM(transcription.text);
        
        if (response) {
          // Generate and play TTS response
          await this.generateTTSResponse(response);
        }
      }
    } catch (error) {
      console.error('❌ Audio processing failed:', error);
    } finally {
      this.sttBuffer = [];
      this.isProcessingAudio = false;
    }
  }

  private async processSTT(audioData: any): Promise<{ text: string; isFinal: boolean }> {
    // Mock STT - replace with actual Deepgram integration
    try {
      const response = await fetch('/api/stt/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audio: audioData,
          model: 'nova-2',
          language: 'en' 
        }),
      });
      
      const result = await response.json();
      return {
        text: result.transcript || '',
        isFinal: result.is_final || false,
      };
    } catch (error) {
      console.error('STT processing failed:', error);
      return { text: '', isFinal: false };
    }
  }

  private async processWithLLM(text: string): Promise<string> {
    try {
      const response = await fetch('/api/llm/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          instructions: this.config.instructions,
          context: this.context.metadata,
          tools: Array.from(this.functionTools.keys()),
        }),
      });

      const result = await response.json();
      
      // Handle function calls
      if (result.functionCall) {
        const tool = this.functionTools.get(result.functionCall.name);
        if (tool) {
          const functionResult = await tool.execute(result.functionCall.arguments, this.context);
          
          // Get LLM response with function result
          const followupResponse = await fetch('/api/llm/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Function result: ${functionResult}`,
              context: this.context.metadata,
            }),
          });
          
          const followup = await followupResponse.json();
          return followup.response;
        }
      }
      
      return result.response;
    } catch (error) {
      console.error('LLM processing failed:', error);
      return "I'm sorry, I didn't understand that. Could you please repeat?";
    }
  }

  private async generateTTSResponse(text: string, options?: { voice?: string; model?: string }) {
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options?.voice || this.config.voiceSettings?.voice,
          model: options?.model || this.config.voiceSettings?.model,
        }),
      });

      const audioBlob = await response.blob();
      
      // Play audio through local track
      await this.playAudioBlob(audioBlob);
      
      console.log('🔊 TTS response played');
      this.emit('responsePlayed', text);
      
    } catch (error) {
      console.error('TTS generation failed:', error);
      this.emit('ttsError', error);
    }
  }

  private async playAudioBlob(audioBlob: Blob) {
    // Create audio element and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  }

  private handleSpeechDetected(participant: any, volume?: number) {
    this.emit('speechDetected', { participant, volume });
    
    // Add audio to processing buffer if needed
    if (this.isProcessingAudio) {
      // This would capture audio data in a real implementation
      console.log(`🎤 Speech detected from ${participant.identity}, volume: ${volume}`);
    }
  }

  private handlePoorConnection(participant: any) {
    // Adjust quality settings for poor connections
    console.log('📶 Adjusting quality for poor connection');
    // Implementation would adjust audio bitrate, etc.
  }

  private handleDataMessage(payload: Uint8Array, participant: any, topic?: string) {
    try {
      const data = JSON.parse(new TextDecoder().decode(payload));
      
      switch (data.type) {
        case 'stt-result':
          this.emit('transcriptionReceived', data);
          break;
        case 'function-call':
          this.handleFunctionCall(data);
          break;
        default:
          console.log('Unknown data message:', data);
      }
    } catch (error) {
      console.error('Failed to parse data message:', error);
    }
  }

  private async handleFunctionCall(data: any) {
    const tool = this.functionTools.get(data.functionName);
    if (tool) {
      try {
        const result = await tool.execute(data.arguments, this.context);
        
        // Send result back
        this.room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify({
            type: 'function-result',
            callId: data.callId,
            result,
          })),
          { reliable: true, topic: 'function-results' }
        );
      } catch (error) {
        console.error(`Function call failed: ${data.functionName}`, error);
      }
    }
  }

  private async attemptReconnection() {
    try {
      console.log('🔄 Attempting to reconnect...');
      await this.room.connect(this.config.roomUrl, this.config.roomToken);
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      setTimeout(() => this.attemptReconnection(), 5000);
    }
  }

  // Public API methods

  async connect(): Promise<void> {
    try {
      await this.room.connect(this.config.roomUrl, this.config.roomToken, {
        autoSubscribe: true,
      });
    } catch (error) {
      console.error('❌ Failed to connect agent:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.audioAnalyzer?.cleanup();
    await this.room.disconnect();
  }

  registerFunctionTool(tool: FunctionTool): void {
    this.functionTools.set(tool.name, tool);
    console.log(`🔧 Registered function tool: ${tool.name}`);
  }

  private registerDefaultTools() {
    // Weather tool
    this.registerFunctionTool({
      name: 'get_weather',
      description: 'Get weather information for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' }
        }
      },
      execute: async (args) => {
        const location = args.location || 'San Francisco';
        console.log(`🌤️ Getting weather for ${location}`);
        return `The weather in ${location} is sunny with a temperature of 72°F.`;
      }
    });

    // Time tool
    this.registerFunctionTool({
      name: 'get_time',
      description: 'Get the current time',
      execute: async () => {
        const now = new Date();
        const time = now.toLocaleTimeString();
        return `The current time is ${time}.`;
      }
    });

    // Hangup tool
    this.registerFunctionTool({
      name: 'hangup_call',
      description: 'End the current phone call',
      execute: async (args, context) => {
        try {
          await context.room.disconnect();
          return 'Call ended successfully.';
        } catch (error) {
          console.error('Error hanging up call:', error);
          return "I'm having trouble ending the call. Please hang up manually.";
        }
      }
    });
  }

  // Getters
  get isActive(): boolean {
    return this.isConnected;
  }

  get roomName(): string {
    return this.room.name || '';
  }

  get participantCount(): number {
    return this.room.numParticipants;
  }
}