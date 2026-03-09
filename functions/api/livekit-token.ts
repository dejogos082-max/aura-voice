import { AccessToken } from 'livekit-server-sdk';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const { roomName, participantName } = await request.json();

    if (!roomName || !participantName) {
      return new Response(JSON.stringify({ error: 'roomName and participantName are required' }), { status: 400 });
    }

    const apiKey = env.LIVEKIT_API_KEY || 'APIYWfxWuT2CR4H';
    const apiSecret = env.LIVEKIT_API_SECRET || 'b1DBoowxheL6RWkkIruQFx9fpQOFZNfLtbBqAKbHYrtA';

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'LiveKit credentials not configured' }), { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    return new Response(JSON.stringify({ token }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
