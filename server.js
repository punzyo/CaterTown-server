import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

const app = express();
app.use(cors());
const port = 3000;

const createToken = async (roomId, charName) => {
  console.log(roomId);
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: charName,
      // token to expire after 10 minutes
      ttl: '10m',
    }
  );
  at.addGrant({ roomJoin: true, room: roomId });

  return at.toJwt();
};

app.get('/getToken', async (req, res) => {
  if (!req.query.roomId) {
    return res.status(400).send('Room id is required');
  }
  if (!req.query.charName) {
    return res.status(400).send('Character name is required');
  }
  try {
    const token = await createToken(req.query.roomId, req.query.charName);
    res.send(token);
  } catch (error) {
    console.error('Failed to create token:', error);
    res.status(500).send('Failed to create token');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
