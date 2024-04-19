// server.js
import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

const createToken = async (roomName) => {
  // if this room doesn't exist, it'll be automatically created when the first
  // client joins

  // identifier to be used for participant.
  // it's available as LocalParticipant.identity with livekit-client SDK
  const participantName = `quickstart-username-${Date.now()}`

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: participantName,
    // token to expire after 10 minutes
    ttl: '10m',
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
}

const app = express();
app.use(cors());
const port = 3000;

app.get('/getToken', async (req, res) => {
  res.send(await createToken(roomName));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})