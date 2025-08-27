import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// Initialize LiveKit Room Service Client
const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const { agentType = '100x-prompt-sales' } = await request.json();
    
    // Generate unique room ID
    const roomId = `voice-${agentType}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Create room
    const room = await roomService.createRoom({
      name: roomId,
      emptyTimeout: 300, // 5 minutes
      maxParticipants: 2, // User + AI Agent
      metadata: JSON.stringify({
        agentType,
        createdAt: new Date().toISOString(),
      }),
    });

    // Generate access token for the user
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: `user-${Date.now()}`,
        ttl: '2h',
      }
    );

    token.addGrant({
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const accessToken = await token.toJwt();

    console.log('Room created successfully:', roomId);
    console.log('Voice agent should connect automatically when room has participants');

    return NextResponse.json({
      success: true,
      roomId,
      token: accessToken,
      url: process.env.LIVEKIT_URL,
      agentType,
      message: `Room created for ${agentType} agent`,
    });

  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create voice room',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Voice room creation endpoint',
    usage: 'POST with agentType in body'
  });
}