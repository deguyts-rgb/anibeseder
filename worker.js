export default {
async fetch(request, env) {
const url = new URL(request.url);

```
// ── GET /share → HTML עם OG tags + redirect לפרופיל היפה ──
if (url.pathname === '/share') {
  try {
    return await handleSharePage(url);
  } catch(e) {
    return new Response("שגיאה: " + e.message, { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

const headers = {
  'Access-Control-Allow-Origin': 'https://anibeseder.com',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

if (request.method === 'OPTIONS') return new Response('', { status: 200, headers });
if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

try {
  const { senderUid, senderName, followerUids, type, message } = await request.json();
  if (!senderUid || !senderName || !followerUids || !followerUids.length) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
  }

  const accessToken = await getFirebaseAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
  const projectId = 'ani-beseder-57800';

  const tokenDocs = await Promise.all(followerUids.map(uid =>
    fetch('https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/fcmTokens/' + uid,
      { headers: { 'Authorization': 'Bearer ' + accessToken } }).then(r => r.json())
  ));

  const tokens = [];
  tokenDocs.forEach(doc => {
    if (doc.fields && doc.fields.token) tokens.push(doc.fields.token.stringValue);
  });

  if (!tokens.length) return new Response(JSON.stringify({ sent: 0, message: 'No tokens found' }), { status: 200, headers });

  let title, body;
  if (type === 'ok')          { title = senderName + ' בסדר ✅'; body = senderName + ' דיווח שהוא בסדר'; }
  else if (type === 'late')   { title = senderName + ' לא דיווח ⚠️'; body = message || (senderName + ' לא דיווח בזמן'); }
  else if (type === 'nudge')  { title = 'נדנוד מ' + senderName + ' 👋'; body = senderName + ' שולח לך תזכורת'; }
  else if (type === 'followRequest') { title = 'בקשת חברות 🤝'; body = message || (senderName + ' מבקש להיות חבר'); }
  else if (type === 'adminNudge') { title = 'אני בסדר 👋'; body = message || ''; }
  else { title = 'עדכון מ' + senderName; body = message || ''; }

  const results = await Promise.allSettled(tokens.map(token =>
    fetch('https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          webpush: {
            notification: {
              title, body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              dir: 'rtl',
              lang: 'he',
              requireInteraction: true
            },
            fcmOptions: { link: 'https://anibeseder.com' }
          }
        }
      })
    })
  ));

  return new Response(JSON.stringify({
    sent: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    total: tokens.length
  }), { status: 200, headers });

} catch (err) {
  return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
}
```

}
};

// ══════════════════════════════════════════════════════════
// handleSharePage
// מקבל נתונים מה-URL params (n, e, t, img) שנשלחו מהאפליקציה.
// מחזיר HTML עם OG tags (לווטסאפ) + redirect מיידי לפרופיל.
// ══════════════════════════════════════════════════════════
async function handleSharePage(url) {
const uid = url.searchParams.get(‘u’);
if (!uid) return Response.redirect(‘https://anibeseder.com’, 302);

// נתונים מהפרמטרים — נשלחו מהאפליקציה ישירות, ללא צורך ב-Firestore
let name    = url.searchParams.get(‘n’) || ‘’;
let emoji   = url.searchParams.get(‘e’) || ‘✅’;
let timeStr = url.searchParams.get(‘t’) || ‘’;
let imgUrl  = url.searchParams.get(‘img’) || ‘’;

// גיבוי: אם אין שם — נסה Firestore (public read)
if (!name) {
try {
const r = await fetch(
‘https://firestore.googleapis.com/v1/projects/ani-beseder-57800/databases/(default)/documents/status/’ + uid,
{ headers: { ‘Accept’: ‘application/json’ } }
);
if (r.ok) {
const data = await r.json();
const f = data.fields || {};
if (f.name && f.name.stringValue)           name    = f.name.stringValue;
if (f.moodEmoji && f.moodEmoji.stringValue) emoji   = f.moodEmoji.stringValue;
if (!imgUrl && f.ogCardUrl && f.ogCardUrl.stringValue) imgUrl = f.ogCardUrl.stringValue;
if (f.timestamp && f.timestamp.timestampValue) {
const dt = new Date(f.timestamp.timestampValue);
timeStr = String(dt.getHours()).padStart(2,‘0’) + ‘:’ + String(dt.getMinutes()).padStart(2,‘0’);
}
}
} catch(e) {}
}

if (!name) name = ‘מישהו’;

// תמונה: מה-Storage אם יש, אחרת icon-512
const ogImage = imgUrl || ‘https://anibeseder.com/icon-512.png’;

// escape HTML
const esc = s => String(s).replace(/&/g,’&’).replace(/</g,’<’).replace(/>/g,’>’).replace(/”/g,’"’);
const safeName  = esc(name);
const safeEmoji = esc(emoji);

const ogTitle = `${safeName} ${safeEmoji} – אני בסדר 🟢`;
const ogDesc  = timeStr
? `${safeName} דיווח בסדר בשעה ${esc(timeStr)} ✔️ — לחץ להגיב`
: `${safeName} דיווח שהוא בסדר ✔️ — לחץ להגיב`;

// URL לדף הפרופיל היפה
const profileUrl = ‘https://anibeseder.com/profile.html’
+ ‘?u=’ + encodeURIComponent(uid)
+ ‘&n=’ + encodeURIComponent(name)
+ ‘&e=’ + encodeURIComponent(emoji)
+ ‘&t=’ + encodeURIComponent(timeStr)
+ (imgUrl ? ‘&img=’ + encodeURIComponent(imgUrl) : ‘’);

const shareUrl = ‘https://send-push.deguyts.workers.dev/share?u=’ + uid;

const html = `<!DOCTYPE html>

<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="אני בסדר"/>
<meta property="og:title" content="${esc(ogTitle)}"/>
<meta property="og:description" content="${esc(ogDesc)}"/>
<meta property="og:image" content="${esc(ogImage)}"/>
<meta property="og:image:width" content="900"/>
<meta property="og:image:height" content="1260"/>
<meta property="og:url" content="${esc(shareUrl)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(ogTitle)}"/>
<meta name="twitter:description" content="${esc(ogDesc)}"/>
<meta name="twitter:image" content="${esc(ogImage)}"/>
<title>${esc(ogTitle)}</title>
<script>window.location.replace(${JSON.stringify(profileUrl)});</script>
</head>
<body style="background:#060c14;color:#fff;font-family:Arial;text-align:center;padding:40px 24px;direction:rtl;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">
<p style="font-size:52px">${safeEmoji}</p>
<p style="font-size:20px;font-weight:700;margin:0">${safeName} בסדר!</p>
<a href="${esc(profileUrl)}" style="color:#4ade80;font-size:15px">לחץ להמשך →</a>
</body>
</html>`;

return new Response(html, {
headers: {
‘Content-Type’: ‘text/html; charset=utf-8’,
‘Cache-Control’: ‘public, max-age=30’
}
});
}

// ══════════════════════════════════════════════════════════
// Firebase JWT Auth (ללא שינוי מהגרסה המקורית)
// ══════════════════════════════════════════════════════════
async function getFirebaseAccessToken(serviceAccountJson) {
const sa = JSON.parse(serviceAccountJson);
const now = Math.floor(Date.now() / 1000);
const payload = {
iss: sa.client_email,
sub: sa.client_email,
aud: ‘https://oauth2.googleapis.com/token’,
iat: now,
exp: now + 3600,
scope: ‘https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.messaging’
};
const b64 = s => btoa(JSON.stringify(s)).replace(/=/g,’’).replace(/+/g,’-’).replace(///g,’*’);
const header64  = b64({“alg”:“RS256”,“typ”:“JWT”});
const payload64 = b64(payload);
const signingInput = header64 + ‘.’ + payload64;
const key = await crypto.subtle.importKey(
‘pkcs8’,
pemToArrayBuffer(sa.private_key),
{ name: ‘RSASSA-PKCS1-v1_5’, hash: ‘SHA-256’ },
false,
[‘sign’]
);
const sig = await crypto.subtle.sign(‘RSASSA-PKCS1-v1_5’, key, new TextEncoder().encode(signingInput));
const sig64 = btoa(String.fromCharCode(…new Uint8Array(sig))).replace(/=/g,’’).replace(/+/g,’-’).replace(///g,’*’);
const jwt = signingInput + ‘.’ + sig64;
const res = await fetch(‘https://oauth2.googleapis.com/token’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/x-www-form-urlencoded’ },
body: ‘grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=’ + jwt
});
return (await res.json()).access_token;
}

function pemToArrayBuffer(pem) {
const b = atob(pem.replace(/—–BEGIN PRIVATE KEY—–|—–END PRIVATE KEY—–|\n/g, ‘’));
const buf = new ArrayBuffer(b.length);
const bytes = new Uint8Array(buf);
for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
return buf;
}
