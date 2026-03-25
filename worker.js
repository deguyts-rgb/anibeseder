export default {
async fetch(request, env) {
const headers = {
‘Access-Control-Allow-Origin’: ‘https://anibeseder.com’,
‘Access-Control-Allow-Headers’: ‘Content-Type’,
‘Content-Type’: ‘application/json’
};
const url = new URL(request.url);
if (url.pathname === ‘/share’) {
return handleSharePage(url.searchParams.get(‘u’), request);
}
if (request.method === ‘OPTIONS’) return new Response(’’, { status: 200, headers });
if (request.method !== ‘POST’) return new Response(JSON.stringify({ error: ‘Method not allowed’ }), { status: 405, headers });
try {
const { senderUid, senderName, followerUids, type, message } = await request.json();
if (!senderUid || !senderName || !followerUids || !followerUids.length) {
return new Response(JSON.stringify({ error: ‘Missing required fields’ }), { status: 400, headers });
}
const accessToken = await getFirebaseAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
const projectId = ‘ani-beseder-57800’;
const tokenDocs = await Promise.all(followerUids.map(uid =>
fetch(‘https://firestore.googleapis.com/v1/projects/’ + projectId + ‘/databases/(default)/documents/fcmTokens/’ + uid,
{ headers: { ‘Authorization’: ‘Bearer ’ + accessToken } }).then(r => r.json())
));
const tokens = [];
tokenDocs.forEach(doc => { if (doc.fields && doc.fields.token) tokens.push(doc.fields.token.stringValue); });
if (!tokens.length) return new Response(JSON.stringify({ sent: 0, message: ‘No tokens found’ }), { status: 200, headers });
let title, body;
if (type === ‘ok’) { title = senderName + ’ OK’; body = senderName + ’ reported OK’; }
else if (type === ‘late’) { title = senderName + ’ late’; body = message || (senderName + ’ did not report’); }
else if (type === ‘nudge’) { title = ‘Nudge from ’ + senderName; body = senderName + ’ sends a reminder’; }
else { title = ’Update from ’ + senderName; body = message || ‘’; }
const results = await Promise.allSettled(tokens.map(token =>
fetch(‘https://fcm.googleapis.com/v1/projects/’ + projectId + ‘/messages:send’, {
method: ‘POST’,
headers: { ‘Authorization’: ’Bearer ’ + accessToken, ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({ message: { token, notification: { title, body }, webpush: { notification: { title, body, icon: ‘/icon-192.png’, badge: ‘/icon-192.png’, dir: ‘rtl’, lang: ‘he’, requireInteraction: true }, fcmOptions: { link: ‘https://anibeseder.com’ } } } })
})
));
return new Response(JSON.stringify({
sent: results.filter(r => r.status === ‘fulfilled’).length,
failed: results.filter(r => r.status === ‘rejected’).length,
total: tokens.length
}), { status: 200, headers });
} catch (err) {
return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
}
}
};

async function handleSharePage(uid, request) {
if (!uid) return Response.redirect(‘https://anibeseder.com’, 302);
var name = ‘User’;
var emoji = ‘’;
var timeStr = ‘’;
var ogImage = ‘https://anibeseder.com/og-card.png’;
try {
var r = await fetch(‘https://firestore.googleapis.com/v1/projects/ani-beseder-57800/databases/(default)/documents/status/’ + uid);
if (r.ok) {
var data = await r.json();
var f = data.fields || {};
if (f.name && f.name.stringValue) name = f.name.stringValue;
if (f.moodEmoji && f.moodEmoji.stringValue) emoji = f.moodEmoji.stringValue;
if (f.ogCardUrl && f.ogCardUrl.stringValue) ogImage = f.ogCardUrl.stringValue;
if (f.timestamp && f.timestamp.timestampValue) {
var dt = new Date(f.timestamp.timestampValue);
timeStr = String(dt.getHours()).padStart(2,‘0’) + ‘:’ + String(dt.getMinutes()).padStart(2,‘0’);
}
}
} catch(e) {}
var safeName = name.replace(/&/g,’&’).replace(/</g,’<’).replace(/>/g,’>’).replace(/”/g,’"’);
var title = safeName + ’ ’ + emoji + ’ - OK’;
var desc = timeStr ? (timeStr + ’ - tap to reply’) : ‘tap to reply’;
var followUrl = ‘https://anibeseder.com/profile.html?u=’ + uid;
var shareUrl = ‘https://send-push.deguyts.workers.dev/share?u=’ + uid;
var html = ‘<!DOCTYPE html><html><head>’
+ ‘<meta charset="UTF-8">’
+ ‘<meta property="og:type" content="website">’
+ ‘<meta property="og:title" content="' + title + '">’
+ ‘<meta property="og:description" content="' + desc + '">’
+ ‘<meta property="og:image" content="' + ogImage + '">’
+ ‘<meta property="og:image:width" content="900">’
+ ‘<meta property="og:image:height" content="1260">’
+ ‘<meta property="og:url" content="' + shareUrl + '">’
+ ‘<meta name="twitter:card" content="summary_large_image">’
+ ‘<meta name="twitter:image" content="' + ogImage + '">’
+ ‘<title>’ + title + ‘</title>’
+ ‘<script>if(!/WhatsApp|facebookexternalhit|Googlebot/i.test(navigator.userAgent))location.replace(”’ + followUrl + ‘”);<’ + ‘/script>’
+ ‘</head><body style="background:#060c14;color:#fff;font-family:Arial;text-align:center;padding:60px 24px">’
+ ‘<p style="font-size:64px">’ + emoji + ‘</p>’
+ ‘<h1>’ + safeName + ‘</h1>’
+ ‘<p>’ + desc + ‘</p>’
+ ‘<a href="' + followUrl + '" style="background:#22c55e;color:#fff;padding:14px 28px;border-radius:14px;text-decoration:none;font-weight:700;display:inline-block;margin-top:16px">Join App</a>’
+ ‘</body></html>’;
return new Response(html, {
headers: { ‘Content-Type’: ‘text/html; charset=utf-8’, ‘Cache-Control’: ‘public, max-age=60’ }
});
}


async function getFirebaseAccessToken(serviceAccountJson) {
const sa = JSON.parse(serviceAccountJson);
const now = Math.floor(Date.now() / 1000);
const payload = { iss: sa.client_email, sub: sa.client_email, aud: ‘https://oauth2.googleapis.com/token’, iat: now, exp: now + 3600, scope: ‘https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.messaging’ };
const b64 = s => btoa(JSON.stringify(s)).replace(/=/g,’’).replace(/+/g,’-’).replace(///g,’*’);
const header64 = b64({“alg”:“RS256”,“typ”:“JWT”});
const payload64 = b64(payload);
const signingInput = header64 + ‘.’ + payload64;
const key = await crypto.subtle.importKey(‘pkcs8’, pemToArrayBuffer(sa.private_key), { name: ‘RSASSA-PKCS1-v1_5’, hash: ‘SHA-256’ }, false, [‘sign’]);
const sig = await crypto.subtle.sign(‘RSASSA-PKCS1-v1_5’, key, new TextEncoder().encode(signingInput));
const sig64 = btoa(String.fromCharCode(…new Uint8Array(sig))).replace(/=/g,’’).replace(/+/g,’-’).replace(///g,’*’);
const jwt = signingInput + ‘.’ + sig64;
const res = await fetch(‘https://oauth2.googleapis.com/token’, { method: ‘POST’, headers: { ‘Content-Type’: ‘application/x-www-form-urlencoded’ }, body: ‘grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=’ + jwt });
return (await res.json()).access_token;
}

function pemToArrayBuffer(pem) {
const b = atob(pem.replace(/—–BEGIN PRIVATE KEY—–|—–END PRIVATE KEY—–|\n/g,’’));
const buf = new ArrayBuffer(b.length);
const bytes = new Uint8Array(buf);
for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
return buf;
}
