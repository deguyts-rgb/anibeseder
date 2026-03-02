<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "ani-beseder-57800.firebaseapp.com",
  projectId: "ani-beseder-57800",
  storageBucket: "ani-beseder-57800.firebasestorage.app",
  messagingSenderId: "596709424854",
  appId: "__FIREBASE_APP_ID__",
  measurementId: "G-07PX1C42D5"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const VAPID_KEY = 'Oaylv1DxhiHzbzQc_lfkgMyxrJB0DuM7le3OcfAPuCE';

async function registerFCMToken() {
  if (!currentUser) return;
  try {
    // Lazy load FCM to avoid breaking other features
    const { getMessaging, getToken, onMessage } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js"
    );
    const messaging = getMessaging(fbApp);
    const sw = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });
    if (token) {
      await setDoc(doc(db, 'fcmTokens', currentUser.uid), {
        token, uid: currentUser.uid, updatedAt: serverTimestamp()
      });
      console.log('FCM token registered');
    }
    onMessage(messaging, payload => {
      const { title, body } = payload.notification || {};
      if (title && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192.png', dir: 'rtl' });
      }
    });
  } catch(e) { console.log('FCM token error:', e.message); }
}

async function sendPushToFollowers(type = 'ok', message = '') {
  if (!currentUser || !state.followers.length) return;
  const followerUids = state.followers.map(f => f.followerUid);
  try {
    await fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderUid: currentUser.uid,
        senderName: currentUser.displayName,
        followerUids,
        type,
        message
      })
    });
  } catch(e) { console.log('Push send error:', e); }
}

let currentUser = null;
let state = {
  freq:'daily', specificDays:[], intervalDays:1,
  isOk:false, lastConfirmed:null, okCount:0,
  followers:[], watching:[],
  mutualUids: new Set()
};
let statusListeners = [];

// Alert settings stored in localStorage
const defaultPersonalAlerts = [
  {id:'p2h', label:'2 שעות לפני', on:true},
  {id:'p1h', label:'שעה לפני', on:true},
  {id:'p30', label:'30 דקות לפני', on:true},
  {id:'p10', label:'10 דקות לפני', on:true},
  {id:'p1',  label:'דקה לפני', on:true},
];
const defaultFollowerAlerts = [
  {id:'f0',  label:'מיידית', on:true},
  {id:'f30', label:'30 דקות אחרי', on:true},
  {id:'f1h', label:'שעה אחרי', on:true},
  {id:'f2h', label:'שעתיים אחרי', on:true},
  {id:'f4h', label:'4 שעות אחרי', on:true},
  {id:'f12', label:'12 שעות אחרי', on:true},
  {id:'f24', label:'כל 24 שעות', on:true},
];

function getAlerts(key, defaults) {
  try { return JSON.parse(localStorage.getItem(key)) || defaults; } catch { return defaults; }
}
function saveAlerts(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }

let personalAlerts = getAlerts('personalAlerts', defaultPersonalAlerts);
let followerAlerts = getAlerts('followerAlerts', defaultFollowerAlerts);

function renderAlerts() {
  const pc = document.getElementById('personalAlertsCard');
  pc.innerHTML = personalAlerts.map((a,i) => `
    <div class="alert-row ${a.on?'blue-on':'blue-off'}" onclick="togglePersonalAlert(${i})">
      <span>${a.label}</span>
      ${a.on ? '<span class="alert-status-on">✓ פעיל</span>' : '<span class="alert-status-off">✕ לא פעיל</span>'}
    </div>`).join('');
  const fc = document.getElementById('followerAlertsCard');
  fc.innerHTML = followerAlerts.map((a,i) => `
    <div class="alert-row ${a.on?'orange-on':'orange-off'}" onclick="toggleFollowerAlert(${i})">
      <span>${a.label}</span>
      ${a.on ? '<span class="alert-status-on">✓ פעיל</span>' : '<span class="alert-status-off">✕ לא פעיל</span>'}
    </div>`).join('');
}

window.togglePersonalAlert = i => {
  personalAlerts[i].on = !personalAlerts[i].on;
  saveAlerts('personalAlerts', personalAlerts);
  renderAlerts();
};
window.toggleFollowerAlert = i => {
  followerAlerts[i].on = !followerAlerts[i].on;
  saveAlerts('followerAlerts', followerAlerts);
  renderAlerts();
};

// ── AUTH ──────────────────────────────────────────────────────
window.signInWithGoogle = async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch(e) { alert('שגיאה בכניסה: ' + e.message); }
};
window.doSignOut = async () => {
  if (confirm('להתנתק?')) { statusListeners.forEach(u=>u()); await signOut(auth); }
};

onAuthStateChanged(auth, async user => {
  document.getElementById('loading').style.display = 'none';
  if (user) {
    currentUser = user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    const av = document.getElementById('userAvatar');
    if (user.photoURL) av.innerHTML = `<img src="${user.photoURL}">`;
    else av.textContent = (user.displayName||'U')[0];
    document.getElementById('myShareLink').textContent = `https://anibeseder.netlify.app/?follow=${user.uid}`;
    await initUser();
    await checkFollowParam();
    checkNotifPermission();
    await loadWatching();
    renderAlerts();
    checkInstallPrompt();
    if (Notification.permission === 'granted') registerFCMToken();
  } else {
    currentUser = null;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});

// ── INIT USER ─────────────────────────────────────────────────
async function initUser() {
  const ref = doc(db,'users',currentUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    state.freq = d.freq||'daily';
    state.specificDays = d.specificDays||[];
    state.intervalDays = d.intervalDays||1;
    state.okCount = d.okCount||0;
    if (d.lastConfirmed) {
      state.lastConfirmed = d.lastConfirmed.toDate();
      state.isOk = (Date.now()-state.lastConfirmed)/3600000 < 24;
      if (!state.isOk) state.okCount = 0;
    }
  } else {
    await setDoc(ref,{name:currentUser.displayName,email:currentUser.email,freq:'daily',specificDays:[],intervalDays:1,okCount:0,createdAt:serverTimestamp()});
  }
  // Check localStorage backup
  const stored = localStorage.getItem('lastConfirmed_'+currentUser.uid);
  if (stored) {
    const t = new Date(stored);
    if ((Date.now()-t)/3600000 < 24 && !state.isOk) {
      state.isOk = true; state.lastConfirmed = t;
      state.okCount = parseInt(localStorage.getItem('okCount_'+currentUser.uid)||'1');
    }
  }
  await loadFollowers();
  syncFreqUI();
  updateMainUI();
}

// ── FOLLOWERS ─────────────────────────────────────────────────
async function loadFollowers() {
  const q = query(collection(db,'follows'),where('followingUid','==',currentUser.uid));
  const snaps = await getDocs(q);
  state.followers = [];
  snaps.forEach(d=>state.followers.push(d.data()));
  await buildMutualSet();
  renderFollowers();
  updateChips();
}

async function buildMutualSet() {
  // Get who I follow
  const q2 = query(collection(db,'follows'),where('followerUid','==',currentUser.uid));
  const snaps2 = await getDocs(q2);
  const iFollow = new Set();
  snaps2.forEach(d=>iFollow.add(d.data().followingUid));
  state.mutualUids = iFollow;
  // Update watching list state
  if (state.watching) state.watching.forEach(w=>w._iFollow=true);
}

function getFollowerStatus(followerUid) {
  // Read receipt simulation: check if they have a readAt record
  const readKey = `read_${currentUser.uid}_${followerUid}`;
  const readAt = localStorage.getItem(readKey);
  const lastOkTime = state.lastConfirmed;
  if (!state.isOk || !lastOkTime) return 'red'; // no report yet or late
  const hrs = (Date.now()-lastOkTime)/3600000;
  if (hrs >= 24) return 'red'; // overdue
  if (readAt && new Date(readAt) > lastOkTime) return 'green'; // read after last OK
  if (state.isOk) return 'yellow'; // sent but not read yet
  return 'unknown';
}

function renderFollowers() {
  const el = document.getElementById('followersList');
  document.getElementById('followersTitle').textContent = `👥 עוקבים שלי (${state.followers.length})`;
  if (!state.followers.length) {
    el.innerHTML = '<p style="font-size:13px;color:rgba(200,230,255,0.3);text-align:center;padding:8px 0">עדיין אין עוקבים – שתף את הלינק!</p>';
    return;
  }
  el.innerHTML = state.followers.map(f => {
    const status = getFollowerStatus(f.followerUid);
    let circleClass='sc-unknown', circleText='–';
    if (status==='green') { circleClass='sc-green'; circleText='✓'; }
    else if (status==='yellow') { circleClass='sc-yellow'; circleText='✓'; }
    else if (status==='red') { circleClass='sc-red'; circleText='✕'; }
    const isMutual = state.mutualUids.has(f.followerUid);
    const badgeHtml = isMutual
      ? `<span class="follow-badge fb-mutual">עוקבים אחד אחרי השני</span>`
      : `<span class="follow-badge fb-followback" onclick="followBack('${f.followerUid}','${(f.followerName||'').replace(/'/g,"\\'")}')">עקוב אחריו בחזרה ＋</span>`;
    const timeText = state.lastConfirmed ? state.lastConfirmed.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'}) : '';
    return `<div class="person-row" id="frow-${f.followerUid}">
      <div class="person-row-top">
        <div class="person-info">
          <div class="person-name">${f.followerName||'משתמש'}</div>
          <div class="person-email">${f.followerEmail||''}</div>
          ${timeText ? `<div class="person-time">עדכון אחרון: ${timeText}</div>` : ''}
        </div>
        <div class="status-circle ${circleClass}">${circleText}</div>
        <button class="trash-btn" onclick="confirmRemoveFollower('${f.followerUid}','${(f.followerName||'משתמש').replace(/'/g,"\\'")}')">🗑️<span class="trash-label">הסר עוקב</span></button>
      </div>
      <div class="person-row-bottom">${badgeHtml}</div>
    </div>`;
  }).join('');
}

// ── WATCHING ─────────────────────────────────────────────────
async function loadWatching() {
  const q = query(collection(db,'follows'),where('followerUid','==',currentUser.uid));
  const snaps = await getDocs(q);
  state.watching = [];
  snaps.forEach(d=>state.watching.push({...d.data(), _iFollow:true}));
  statusListeners.forEach(u=>u());
  statusListeners = [];
  document.getElementById('watchingTitle').textContent = `👁️ אתם בסדר? (${state.watching.length})`;
  if (!state.watching.length) { renderWatchingList([]); updateChips(); return; }
  const statuses = {};
  state.watching.forEach(w=>statuses[w.followingUid]=null);
  state.watching.forEach(w=>{
    const unsub = onSnapshot(doc(db,'status',w.followingUid),snap=>{
      if (snap.exists()) {
        const d=snap.data();
        statuses[w.followingUid]={isOk:d.isOk,timestamp:d.timestamp?.toDate(),name:d.name};
        const ts=d.timestamp?.toDate();
        if (ts&&(Date.now()-ts)/60000<2&&Notification.permission==='granted') {
          new Notification(`${d.name} בסדר! 🤝`,{body:`${d.name} עדכן עכשיו שהכל בסדר`,icon:'/icon-192.png'});
        }
        // Mark as read
        const readKey=`read_${d.uid}_${currentUser.uid}`;
        localStorage.setItem(readKey, new Date().toISOString());
        // Also re-render followers so green shows
        renderFollowers();
      }
      renderWatchingWithStatuses(state.watching,statuses);
    });
    statusListeners.push(unsub);
  });
  updateChips();
}

function renderWatchingList(watching) { renderWatchingWithStatuses(watching,{}); }

function renderWatchingWithStatuses(watching, statuses) {
  const el = document.getElementById('watchingList');
  document.getElementById('watchingTitle').textContent = `👁️ אתם בסדר? (${watching.length})`;
  if (!watching.length) {
    el.innerHTML='<p style="font-size:13px;color:rgba(200,230,255,0.3);text-align:center;padding:16px 0">עדיין אינך עוקב אחרי אף אחד.</p>';
    return;
  }
  const followerUids = new Set(state.followers.map(f=>f.followerUid));
  el.innerHTML = watching.map(w=>{
    const s=statuses[w.followingUid];
    let circleClass='sc-unknown',circleText='?',timeText='טרם עדכן';
    if (s) {
      const hrs=s.timestamp?(Date.now()-s.timestamp)/3600000:999;
      if (s.isOk&&hrs<24) {
        circleClass='sc-green';circleText='✓';
        timeText='עדכן: '+s.timestamp.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
      } else if (hrs>=24) { circleClass='sc-late';circleText='לא\nבסדר'; timeText='לא עדכן מ-24+ שעות'; }
    }
    const isMutual = followerUids.has(w.followingUid);
    const badgeHtml = isMutual
      ? `<span class="follow-badge fb-mutual">עוקבים אחד אחרי השני</span>`
      : `<span class="follow-badge fb-following">עוקב אחריו</span>`;
    return `<div class="person-row" id="wrow-${w.followingUid}">
      <div class="person-row-top">
        <div class="person-info">
          <div class="person-name">${w.followingName||'משתמש'}</div>
          <div class="person-time">${timeText}</div>
        </div>
        <div class="status-circle ${circleClass}" style="white-space:pre-line;text-align:center;line-height:1.2">${circleText}</div>
        <button class="nudge-btn" onclick="sendNudge('${w.followingUid}','${(w.followingName||'').replace(/'/g,"\\'")}')">👋<span class="nudge-label">נדנד</span></button>
        <button class="trash-btn" onclick="confirmUnfollow('${w.followingUid}','${(w.followingName||'משתמש').replace(/'/g,"\\'")}')">🗑️<span class="trash-label">הסר מעקב</span></button>
      </div>
      <div class="person-row-bottom">${badgeHtml}</div>
    </div>`;
  }).join('');
}

// ── FOLLOW BACK ───────────────────────────────────────────────
window.followBack = async (uid, name) => {
  const followId = `${currentUser.uid}_${uid}`;
  await setDoc(doc(db,'follows',followId),{
    followerUid:currentUser.uid,followerName:currentUser.displayName,
    followerEmail:currentUser.email,followingUid:uid,followingName:name,createdAt:serverTimestamp()
  });
  state.mutualUids.add(uid);
  await loadWatching();
  renderFollowers();
  updateChips();
};

// ── NUDGE ─────────────────────────────────────────────────────
window.sendNudge = async (uid, name) => {
  await setDoc(doc(db,'nudges',`${currentUser.uid}_${uid}_${Date.now()}`),{
    fromUid:currentUser.uid,fromName:currentUser.displayName,
    toUid:uid,message:'אתה בסדר? 👋',timestamp:serverTimestamp()
  });
  if (Notification.permission==='granted') {
    new Notification('נדנוד נשלח ✅',{body:`שלחת נדנוד ל-${name}`});
  }
  // Send push to that person
  try {
    await fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderUid: currentUser.uid, senderName: currentUser.displayName,
        followerUids: [uid], type: 'nudge'
      })
    });
  } catch(e) {}
  alert(`נדנוד נשלח ל-${name}! 👋`);
};

// ── REMOVE FOLLOWER ───────────────────────────────────────────
let pendingAction = null;
window.confirmRemoveFollower = (uid, name) => {
  document.getElementById('confirmTitle').textContent = 'הסר עוקב';
  document.getElementById('confirmText').textContent = `האם אתה בטוח שברצונך להסיר את ${name} מהעוקבים שלך? הוא לא יקבל יותר עדכונים ממך.`;
  document.getElementById('confirmOkBtn').textContent = 'כן, הסר';
  pendingAction = async () => {
    const followId = `${uid}_${currentUser.uid}`;
    await deleteDoc(doc(db,'follows',followId));
    state.followers = state.followers.filter(f=>f.followerUid!==uid);
    renderFollowers(); updateChips();
  };
  document.getElementById('confirmModal').classList.add('show');
};

window.confirmUnfollow = (uid, name) => {
  document.getElementById('confirmTitle').textContent = 'הסר מעקב';
  document.getElementById('confirmText').textContent = `האם אתה בטוח שברצונך להפסיק לעקוב אחרי ${name}?`;
  document.getElementById('confirmOkBtn').textContent = 'כן, הסר';
  pendingAction = async () => {
    const followId = `${currentUser.uid}_${uid}`;
    await deleteDoc(doc(db,'follows',followId));
    state.watching = state.watching.filter(w=>w.followingUid!==uid);
    state.mutualUids.delete(uid);
    renderWatchingWithStatuses(state.watching,{});
    renderFollowers(); updateChips();
    document.getElementById('watchingTitle').textContent=`👁️ אתם בסדר? (${state.watching.length})`;
  };
  document.getElementById('confirmModal').classList.add('show');
};

window.closeConfirm = () => document.getElementById('confirmModal').classList.remove('show');
document.getElementById('confirmOkBtn').addEventListener('click', async () => {
  if (pendingAction) { await pendingAction(); pendingAction=null; }
  closeConfirm();
});

// ── FOLLOW PARAM ──────────────────────────────────────────────
async function checkFollowParam() {
  const params = new URLSearchParams(window.location.search);
  const followUid = params.get('follow');
  if (!followUid||followUid===currentUser.uid) return;
  const followId=`${currentUser.uid}_${followUid}`;
  const snap=await getDoc(doc(db,'follows',followId));
  const userSnap=await getDoc(doc(db,'users',followUid));
  const followedName=userSnap.exists()?(userSnap.data().name||'המשתמש'):'המשתמש';
  if (!snap.exists()) {
    await setDoc(doc(db,'follows',followId),{followerUid:currentUser.uid,followerName:currentUser.displayName,followerEmail:currentUser.email,followingUid:followUid,followingName:followedName,createdAt:serverTimestamp()});
    document.getElementById('followBannerTitle').textContent=`✅ עכשיו אתה עוקב אחרי ${followedName}`;
    document.getElementById('followBannerText').textContent=`תקבל התראה כשהכל בסדר עם ${followedName}.`;
    document.getElementById('followBanner').classList.add('show');
    setTimeout(()=>document.getElementById('followBanner').classList.remove('show'),6000);
  }
  window.history.replaceState({},'',' /');
}

// ── OK BUTTON ─────────────────────────────────────────────────
window.handleOkPress = async () => {
  if (!currentUser) return;
  if (state.okCount >= 6) return;
  const btn = document.getElementById('bigBtn');
  btn.classList.add('pulse');
  setTimeout(()=>btn.classList.remove('pulse'),300);
  state.isOk = true;
  state.lastConfirmed = new Date();
  state.okCount = (state.okCount||0) + 1;
  localStorage.setItem('lastConfirmed_'+currentUser.uid, state.lastConfirmed.toISOString());
  localStorage.setItem('okCount_'+currentUser.uid, state.okCount);
  await setDoc(doc(db,'users',currentUser.uid),{lastConfirmed:serverTimestamp(),okCount:state.okCount},{merge:true});
  await setDoc(doc(db,'status',currentUser.uid),{uid:currentUser.uid,name:currentUser.displayName,isOk:true,timestamp:serverTimestamp()});
  updateMainUI();
  renderFollowers();
  document.getElementById('sentBadge').classList.add('show');
  setTimeout(()=>document.getElementById('sentBadge').classList.remove('show'),3500);
  // Send push notification to followers
  sendPushToFollowers('ok');
};

// ── SHARE ─────────────────────────────────────────────────────
window.doShare = () => {
  const link=`https://anibeseder.netlify.app/?follow=${currentUser.uid}`;
  const text=`היי! ${currentUser.displayName||'אני'} מזמין אותך לעקוב ב״אני בסדר״.\nתקבל התראה כשאני בסדר:\n${link}`;
  if (navigator.share) navigator.share({title:'אני בסדר',text,url:link});
  else navigator.clipboard.writeText(text).then(()=>alert('✅ הועתק! הדבק בוואטסאפ.')).catch(()=>alert('העתק:\n'+link));
};

// ── FREQUENCY ─────────────────────────────────────────────────
window.setFreq = async mode => {
  state.freq=mode; syncFreqUI(); updateChips();
  await setDoc(doc(db,'users',currentUser.uid),{freq:mode},{merge:true});
};
window.toggleDay = async d => {
  const i=state.specificDays.indexOf(d);
  if(i>-1)state.specificDays.splice(i,1);else state.specificDays.push(d);
  document.querySelectorAll('.day-cell').forEach((el,j)=>el.classList.toggle('active',state.specificDays.includes(j)));
  await setDoc(doc(db,'users',currentUser.uid),{specificDays:state.specificDays},{merge:true});
};
window.setIntervalDays = async n => {
  state.intervalDays=n;
  document.querySelectorAll('.interval-cell').forEach((el,i)=>el.classList.toggle('active',i+1===n));
  updateChips();
  await setDoc(doc(db,'users',currentUser.uid),{intervalDays:n},{merge:true});
};
function syncFreqUI(){
  document.querySelectorAll('.freq-option').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('freq-'+state.freq);
  if(el)el.classList.add('active');
  document.getElementById('specificDaysCard').style.display=state.freq==='specific'?'block':'none';
  document.getElementById('intervalCard').style.display=state.freq==='interval'?'block':'none';
  state.specificDays.forEach(d=>{const c=document.getElementById('day-'+d);if(c)c.classList.add('active');});
  document.querySelectorAll('.interval-cell').forEach((el,i)=>el.classList.toggle('active',i+1===state.intervalDays));
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function checkNotifPermission(){
  if('Notification'in window&&Notification.permission==='default')
    document.getElementById('notifBar').classList.add('show');
}
window.askNotifications = async()=>{
  const p=await Notification.requestPermission();
  document.getElementById('notifBar').classList.remove('show');
  if(p==='granted'){
    new Notification('אני בסדר 🤝',{body:'מעולה! תקבל התראות עדכונים.'});
    registerFCMToken();
  }
};

// ── POLICY ────────────────────────────────────────────────────
window.openPolicyModal=()=>document.getElementById('policyModal').classList.add('show');
window.closePolicyModal=(e)=>{
  if(!e||e.target===document.getElementById('policyModal')||e.currentTarget?.tagName==='BUTTON')
    document.getElementById('policyModal').classList.remove('show');
};

// ── MAIN UI ───────────────────────────────────────────────────
function updateMainUI(){
  const btn=document.getElementById('bigBtn');
  const btnText=document.getElementById('btnText');
  const btnEmoji=document.getElementById('btnEmoji');
  const btnMarks=document.getElementById('btnMarks');
  const st=document.getElementById('statusText');
  const hrs=state.lastConfirmed?(Date.now()-state.lastConfirmed)/3600000:999;
  if(state.isOk&&hrs<24){
    btn.classList.add('ok');btn.classList.remove('late');
    btnEmoji.textContent='';
    btnText.innerHTML='אני<br>בסדר';
    const vCount=Math.min(state.okCount,6);
    btnMarks.textContent='✓'.repeat(vCount);
    btnMarks.style.color='rgba(255,255,255,0.9)';
    st.textContent=state.okCount>=6?'✅ עדכנת 6 פעמים היום!':'✅ העוקבים שלך קיבלו התראה';
    if(state.okCount>=6){btn.style.cursor='not-allowed';}else{btn.style.cursor='pointer';}
  } else if(hrs>=24&&state.lastConfirmed){
    btn.classList.remove('ok');btn.classList.add('late');
    btnEmoji.textContent='';
    const xCount=Math.min(Math.floor(hrs/24),6);
    btnText.innerHTML='לא<br>בסדר';
    btnMarks.textContent='✕'.repeat(xCount);
    btnMarks.style.color='rgba(255,220,200,0.9)';
    st.textContent='⚠️ לא דיווחת בזמן! לחץ לעדכן';
    btn.style.cursor='pointer';
    state.isOk=false;state.okCount=0;
  } else {
    btn.classList.remove('ok','late');
    btnEmoji.textContent='👋';
    btnText.innerHTML='אני<br>בסדר';
    btnMarks.textContent='';
    st.textContent='לחץ לעדכן שהכל בסדר';
    btn.style.cursor='pointer';
  }
  document.getElementById('lastTime').textContent=state.lastConfirmed?'עודכן: '+state.lastConfirmed.toLocaleTimeString('he-IL'):'';
  updateChips();
}

function updateChips(){
  document.getElementById('followersChip').textContent=`👥 ${state.followers.length} עוקבים`;
  document.getElementById('watchingChip').textContent=`אתם בסדר? (${state.watching.length})`;
  const labels={daily:'כל יום',odd:'ימים אי-זוגיים',even:'ימים זוגיים',specific:'ימים ספציפיים',interval:`כל ${state.intervalDays} ימים`};
  document.getElementById('freqChip').textContent='🔄 '+(labels[state.freq]||'כל יום');
}

window.showScreen=name=>{
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  const nav=document.getElementById('nav-'+name);
  if(nav)nav.classList.add('active');
};

// ── PWA INSTALL ───────────────────────────────────────────────
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});
function checkInstallPrompt(){
  if(window.matchMedia('(display-mode: standalone)').matches)return;
  if(window.navigator.standalone)return;
  if(localStorage.getItem('installDismissed'))return;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  setTimeout(()=>{
    if(deferredInstallPrompt)document.getElementById('installBanner').style.display='block';
    else if(isIOS)document.getElementById('iosInstallBanner').style.display='block';
  },2500);
}
window.doInstall=async()=>{
  if(!deferredInstallPrompt)return;
  document.getElementById('installBanner').style.display='none';
  deferredInstallPrompt.prompt();
  deferredInstallPrompt=null;
};
window.dismissInstall=()=>{document.getElementById('installBanner').style.display='none';localStorage.setItem('installDismissed','1');};
window.dismissIosInstall=()=>{document.getElementById('iosInstallBanner').style.display='none';localStorage.setItem('installDismissed','1');};

if('serviceWorker'in navigator){
  var blob=new Blob([`var CACHE_NAME='ani-beseder-v5';
self.addEventListener('install',function(e){e.waitUntil(self.skipWaiting());});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));});
self.addEventListener('push',function(e){if(!e.data)return;var d;try{d=e.data.json();}catch(err){d={notification:{title:'Ani Beseder',body:e.data.text()}};}var n=d.notification||{};e.waitUntil(self.registration.showNotification(n.title||'Ani Beseder',{body:n.body||'',icon:'/icon-192.png',dir:'rtl',requireInteraction:true,data:{url:'https://anibeseder.netlify.app'}}));});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if(l[i].url.includes('anibeseder')&&'focus'in l[i])return l[i].focus();}return clients.openWindow('https://anibeseder.netlify.app');}));});`],{type:'text/javascript'});
  var url=URL.createObjectURL(blob);
  navigator.serviceWorker.register(url,{scope:'/'}).catch(function(){});
}
</script>
