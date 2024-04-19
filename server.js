// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

const app = express();
app.use(cors());
const port = 3000;

const createToken = async (roomName) => {
  console.log(roomName);
  const participantName = `quickstart-username-${Date.now()}`

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: participantName,
    // token to expire after 10 minutes
    ttl: '10m',
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return at.toJwt();
}

app.get('/getToken', async (req, res) => {
  if (!req.query.roomName) {
    return res.status(400).send('Room name is required');
  }
  try {
    const token = await createToken(req.query.roomName);
    res.send(token);
  } catch (error) {
    console.error('Failed to create token:', error);
    res.status(500).send('Failed to create token');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});