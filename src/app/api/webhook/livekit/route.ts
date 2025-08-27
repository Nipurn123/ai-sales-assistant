import { NextRequest, NextResponse } from 'next/server';
import { callManager } from '@/lib/callManager';

export async function POST(request: NextRequest) {
  try {
    const webhook = await request.json();
    
    console.log('📞 LiveKit Webhook received:', webhook.event, webhook);

    // Handle room started events (when SIP calls connect)
    if (webhook.event === 'room_started' && webhook.room) {
      const roomName = webhook.room.name;
      
      // Check if this is a sales call room
      if (roomName.includes('sales-call-')) {
        console.log(`🤖 Starting agent for sales call room: ${roomName}`);
        
        // Note: Python telephony agent should already be running and will
        // automatically connect to rooms when SIP participants join
        console.log(`🐍 Python telephony agent should connect to room: ${roomName}`);

        console.log(`✅ Room ready for Python agent: ${roomName}`);
      }
    }

    // Handle room finished events (cleanup)
    if (webhook.event === 'room_finished' && webhook.room) {
      const roomName = webhook.room.name;
      console.log(`🔚 Room finished: ${roomName}`);
      
      // Any cleanup logic can go here
    }

    // Handle SIP participant events
    if (webhook.event === 'participant_joined' && webhook.participant) {
      const participant = webhook.participant;
      const roomName = webhook.room?.name;
      
      // Check if this is a SIP participant
      if (participant.identity.includes('sip-') || participant.kind === 'sip') {
        console.log(`📱 SIP participant joined: ${participant.identity} in room ${roomName}`);
        
        // Find the call by room name and update status to active
        const activeCalls = callManager.getActiveCalls();
        const matchingCall = activeCalls.find((call: { roomName: string; callId: string }) => call.roomName === roomName);
        
        if (matchingCall) {
          callManager.updateCallStatus(matchingCall.callId, 'active');
          console.log(`✅ Updated call ${matchingCall.callId} status to active`);
        }
      }
    }

    // Handle participant disconnected events
    if (webhook.event === 'participant_disconnected' && webhook.participant) {
      const participant = webhook.participant;
      const roomName = webhook.room?.name;
      
      // Check if this is a SIP participant disconnecting
      if (participant.identity.includes('sip-') || participant.kind === 'sip') {
        console.log(`📱 SIP participant disconnected: ${participant.identity} from room ${roomName}`);
        
        // Find the call by room name and end it immediately
        const activeCalls = callManager.getActiveCalls();
        const matchingCall = activeCalls.find((call: { roomName: string; callId: string }) => call.roomName === roomName);
        
        if (matchingCall) {
          console.log(`🔌 Ending call ${matchingCall.callId} due to participant disconnection`);
          callManager.endCall(matchingCall.callId, 'disconnected');
        }
      }
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}