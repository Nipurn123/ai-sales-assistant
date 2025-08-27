import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient, SipClient } from 'livekit-server-sdk';

// Default sales agent system prompt
const DEFAULT_SYSTEM_PROMPT = `
You are a professional AI sales assistant. Your goal is to engage prospects in meaningful conversations, qualify leads, and schedule appointments.

Key Instructions:
1. Be professional, friendly, and conversational
2. Listen actively and ask relevant follow-up questions  
3. Keep responses concise and natural for voice conversations
4. Avoid using special characters, emojis, or markdown

Remember: This is a voice conversation, so speak naturally. Be helpful, not pushy.
`;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, contactName, systemPrompt } = await request.json();
    
    const livekit_url = process.env.LIVEKIT_URL;
    const api_key = process.env.LIVEKIT_API_KEY;
    const api_secret = process.env.LIVEKIT_API_SECRET;
    const sip_trunk_id = process.env.SIP_TRUNK_ID;
    
    if (!livekit_url || !api_key || !api_secret || !sip_trunk_id) {
      return NextResponse.json(
        { error: 'LiveKit configuration missing' },
        { status: 500 }
      );
    }

    // Create LiveKit service clients
    const roomService = new RoomServiceClient(livekit_url, api_key, api_secret);
    const sipService = new SipClient(livekit_url, api_key, api_secret);

    // Create unique room name
    const roomName = `sales-call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create room for the call with metadata
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: 300, // 5 minutes
      maxParticipants: 10,
      metadata: JSON.stringify({
        systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
        contactName,
        callType: 'outbound-sales',
        phoneNumber,
        agentInstructions: systemPrompt || DEFAULT_SYSTEM_PROMPT
      })
    });

    console.log('Created room:', room.name);

    // Prepare agent metadata with custom instructions
    const agentMetadata = {
      systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      contactName,
      callType: 'outbound-sales',
      phoneNumber,
      customInstructions: `
        You are speaking with ${contactName}. 
        ${systemPrompt || DEFAULT_SYSTEM_PROMPT}
        
        Additional context for this call:
        - Contact name: ${contactName}
        - Phone number: ${phoneNumber}
        - This is an outbound sales call
        
        Remember to be professional and respect their time.
      `
    };

    // Note: The Python telephony agent will automatically connect when a SIP participant joins
    // No need to dispatch here as the Python agent handles the connection itself
    console.log('🤖 Python telephony agent will connect automatically when call starts');

    // Create SIP participant (make the call)
    const sipParticipant = await sipService.createSipParticipant(
      sip_trunk_id,
      phoneNumber,
      roomName,
      {
        participantIdentity: `caller-${Date.now()}`,
        participantName: contactName || `Caller ${phoneNumber}`,
        participantMetadata: JSON.stringify({
          contactName,
          phoneNumber,
          callType: 'outbound',
          systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
          customInstructions: agentMetadata.customInstructions
        }),
        dtmf: '*', // Enable DTMF
        maxCallDuration: 600, // 10 minutes
        ringingTimeout: 30,
        playDialtone: true // Play dial tone while connecting
      }
    );

    const callData = {
      id: sipParticipant.sipCallId || Date.now().toString(),
      phoneNumber,
      contactName,
      systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      status: 'calling',
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
      roomName,
      participantId: sipParticipant.participantId,
      sipCallId: sipParticipant.sipCallId
    };

    console.log('✅ Call initiated successfully:', {
      phoneNumber,
      contactName,
      roomName,
      callId: sipParticipant.sipCallId,
      participantId: sipParticipant.participantId,
      pythonAgentReady: true
    });

    // Monitor the call status (optional)
    try {
      // You can set up webhooks or polling to monitor call status
      console.log('📞 Monitoring call status for:', sipParticipant.sipCallId);
      
      // Example: Get room info by listing rooms and finding our room
      const rooms = await roomService.listRooms([roomName]);
      if (rooms && rooms.length > 0) {
        const roomInfo = rooms[0];
        console.log('🏠 Room participants:', roomInfo.numParticipants);
        
        // Also list participants for more detailed info
        const participants = await roomService.listParticipants(roomName);
        console.log('👥 Participants in room:', participants.length);
      } else {
        console.log('🏠 Room not found in active rooms yet');
      }
      
    } catch (monitorError) {
      console.warn('⚠️ Call monitoring setup failed:', monitorError);
    }

    return NextResponse.json({ 
      success: true, 
      callId: callData.id,
      message: 'Call initiated successfully with Python telephony agent',
      roomName,
      pythonAgentReady: true,
      ...callData
    });

  } catch (error) {
    console.error('❌ Error making call:', error);
    return NextResponse.json(
      { 
        error: `Failed to initiate call: ${error.message}`,
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check call status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('room');
    const callId = searchParams.get('callId');

    if (!roomName && !callId) {
      return NextResponse.json(
        { error: 'Room name or call ID required' },
        { status: 400 }
      );
    }

    const livekit_url = process.env.LIVEKIT_URL;
    const api_key = process.env.LIVEKIT_API_KEY;
    const api_secret = process.env.LIVEKIT_API_SECRET;

    if (!livekit_url || !api_key || !api_secret) {
      return NextResponse.json(
        { error: 'LiveKit configuration missing' },
        { status: 500 }
      );
    }

    const roomService = new RoomServiceClient(livekit_url, api_key, api_secret);

    if (roomName) {
      try {
        const rooms = await roomService.listRooms([roomName]);
        const roomInfo = rooms.length > 0 ? rooms[0] : null;
        const participants = roomInfo ? await roomService.listParticipants(roomName) : [];

        if (roomInfo) {
          return NextResponse.json({
            success: true,
            room: {
              name: roomInfo.name,
              numParticipants: roomInfo.numParticipants,
              creationTime: roomInfo.creationTime.toString(),
              metadata: roomInfo.metadata ? JSON.parse(roomInfo.metadata) : null
            },
            participants: participants.map(p => ({
              identity: p.identity,
              name: p.name,
              joinedAt: p.joinedAt.toString(),
              metadata: p.metadata ? JSON.parse(p.metadata) : null
            }))
          });
        } else {
          return NextResponse.json({
            success: true,
            status: 'completed',
            message: 'Call has ended',
            participants: []
          });
        }
      } catch (roomError) {
        if (roomError.message.includes('not found')) {
          return NextResponse.json({
            success: true,
            status: 'completed',
            message: 'Call has ended'
          });
        }
        throw roomError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status check completed'
    });

  } catch (error) {
    console.error('Error checking call status:', error);
    return NextResponse.json(
      { error: `Failed to check call status: ${error.message}` },
      { status: 500 }
    );
  }
}