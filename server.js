import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';
import admin from 'firebase-admin';

const app = express();
app.use(cors());
app.use(express.json()); 

const port = 3000;


const firebasePrivateKey = JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(firebasePrivateKey)
});
const db = admin.firestore();


const createToken = async (roomId, charName) => {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: charName,
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


app.post('/webhook', async (req, res) => {
  const payload = req.body;


  if (payload.action === 'opened') {
    const prData = {
      id: payload.pull_request.id,
      title: payload.pull_request.title,
      createdAt: payload.pull_request.created_at,
      user: payload.pull_request.user.login,
      state: payload.pull_request.state,
      url: payload.pull_request.html_url
    };

    try {
      await db.collection('pull_requests').doc(prData.id.toString()).set(prData);
      res.status(200).send('PR data saved to Firebase');
    } catch (error) {
      console.error('Firebase error:', error);
      res.status(500).send('Failed to save PR data');
    }
  } else {
    res.status(200).send('Not a PR opened event');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
