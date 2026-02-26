const { initializeApp, cert } = require(‘firebase-admin/app’);
const { getFirestore } = require(‘firebase-admin/firestore’);
const { getMessaging } = require(‘firebase-admin/messaging’);

// Initialize Firebase Admin (uses environment variable)
let adminApp;
function getAdminApp() {
if (!adminApp) {
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
adminApp = initializeApp({
credential: cert(serviceAccount)
});
}
return adminApp;
}

exports.handler = async (event) => {
const headers = {
‘Access-Control-Allow-Origin’: ‘https://anibeseder.netlify.app’,
‘Access-Control-Allow-Headers’: ‘Content-Type’,
‘Content-Type’: ‘application/json’
};

if (event.httpMethod === ‘OPTIONS’) {
return { statusCode: 200, headers, body: ‘’ };
}

if (event.httpMethod !== ‘POST’) {
return { statusCode: 405, headers, body: JSON.stringify({ error: ‘Method not allowed’ }) };
}

try {
const { senderUid, senderName, followerUids, type, message } = JSON.parse(event.body);

```
if (!senderUid || !followerUids || !followerUids.length) {
  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
}

const app = getAdminApp();
const db = getFirestore(app);
const messaging = getMessaging(app);

// Get FCM tokens for all followers
const tokenDocs = await Promise.all(
  followerUids.map(uid => db.collection('fcmTokens').doc(uid).get())
);

const tokens = [];
tokenDocs.forEach(doc => {
  if (doc.exists && doc.data().token) {
    tokens.push(doc.data().token);
  }
});

if (!tokens.length) {
  return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, message: 'No tokens found' }) };
}

// Build notification based on type
let title, body, icon = '/icon-192.png';
if (type === 'ok') {
  title = `${senderName} בסדר! 🤝`;
  body = `${senderName} עדכן עכשיו שהכל בסדר`;
} else if (type === 'late') {
  title = `${senderName} לא דיווח ⚠️`;
  body = message || `${senderName} לא דיווח שהוא בסדר`;
} else if (type === 'nudge') {
  title = `נדנוד מ-${senderName} 👋`;
  body = `${senderName} שואל: אתה בסדר?`;
} else {
  title = `הודעה מ-${senderName}`;
  body = message || '';
}

// Send to all tokens
const results = await Promise.allSettled(
  tokens.map(token =>
    messaging.send({
      token,
      notification: { title, body },
      webpush: {
        notification: { title, body, icon, badge: '/icon-192.png', dir: 'rtl', lang: 'he', requireInteraction: true },
        fcmOptions: { link: 'https://anibeseder.netlify.app' }
      }
    })
  )
);

const sent = results.filter(r => r.status === 'fulfilled').length;
const failed = results.filter(r => r.status === 'rejected').length;

return {
  statusCode: 200,
  headers,
  body: JSON.stringify({ sent, failed, total: tokens.length })
};
```

} catch (err) {
console.error(‘Push error:’, err);
return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
}
};
