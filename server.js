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
  credential: admin.credential.cert(firebasePrivateKey),
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

app.post('/webhook/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const { action, pull_request } = req.body;

  if (['opened', 'reopened', 'closed', 'merged'].includes(action)) {
    const userLogin = pull_request.user.login;
    const prData = {
      baseBranch:pull_request.base.ref,
      headBranch:pull_request.head.ref,
      repo:pull_request.base.repo.name,
      avatar_url: pull_request.user.avatar_url,
      action: action,
      id: pull_request.id,
      title: pull_request.title,
      createdAt: pull_request.created_at,
      user: userLogin,
      state: pull_request.state,
      url: pull_request.html_url,
      description: pull_request.body || '',
      abc:"Line one\nLine two\nLine three"
    };console.log(pull_request.body)

    const docRef = db
      .collection('rooms')
      .doc(roomId)
      .collection('pullRequests')
      .doc(userLogin);

    try {
      const doc = await docRef.get();
      if (!doc.exists) {
        await docRef.set({ prs: [prData] });
      } else {
        let existingPrs = doc.data().prs;
        const prIndex = existingPrs.findIndex((pr) => pr.id === prData.id);

        if (prIndex === -1) {
          existingPrs.push(prData);
        } else {
          existingPrs[prIndex] = prData;
        }

        await docRef.update({ prs: existingPrs });
      }
      res.status(200).send('PR data updated in Firebase');
    } catch (error) {
      console.error('Firebase error:', error);
      res.status(500).send('Failed to update PR data');
    }
  } else {
    res.status(200).send('Event is not related to PR updates');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
