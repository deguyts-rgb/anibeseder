# anibeseder
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#0f1923" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="אני בסדר" />
  <title>אני בסדר</title>
  <link rel="manifest" href="manifest.json" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      min-height: 100vh;
      background: linear-gradient(160deg, #0f1923 0%, #1a2a3a 60%, #0d1f2d 100%);
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl; color: #e8f4f8;
      display: flex; flex-direction: column; align-items: center; overflow-x: hidden;
    }
    #loading {
      position: fixed; inset: 0;
      background: linear-gradient(160deg, #0f1923 0%, #1a2a3a 60%, #0d1f2d 100%);
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 16px; z-index: 999;
    }
    .spinner { width: 48px; height: 48px; border: 3px solid rgba(126,207,255,0.2); border-top-color: #7ecfff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #login-screen { display: none; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 40px 24px; width: 100%; max-width: 480px; }
    .login-logo { font-size: 72px; margin-bottom: 16px; }
    .login-title { font-size: 36px; font-weight: 900; color: #7ecfff; margin-bottom: 10px; }
    .login-sub { font-size: 16px; color: rgba(200,230,255,0.55); margin-bottom: 48px; text-align: center; line-height: 1.7; }
    .google-btn { display: flex; align-items: center; gap: 12px; background: #fff; color: #1a1a1a; border: none; border-radius: 16px; padding: 15px 28px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; justify-content: center; box-shadow: 0 4px 24px rgba(0,0,0,0.35); font-family: inherit; transition: transform 0.15s; }
    .google-btn:active { transform: scale(0.97); }
    .login-policy { margin-top: 32px; font-size: 12px; color: rgba(200,230,255,0.28); text-align: center; line-height: 1.8; }
    #app { display: none; flex-direction: column; align-items: center; width: 100%; min-height: 100vh; }
    .header { width: 100%; max-width: 480px; padding: 20px 24px 0; display: flex; align-items: center; justify-content: space-between; }
    .logo { font-size: 20px; font-weight: 800; color: #7ecfff; }
    .user-row { display: flex; align-items: center; gap: 8px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(126,207,255,0.15); border: 1px solid rgba(126,207,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; overflow: hidden; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .logout-btn { background: none; border: 1px solid rgba(126,207,255,0.18); border-radius: 8px; color: rgba(200,230,255,0.45); font-size: 11px; padding: 4px 10px; cursor: pointer; font-family: inherit; }
    .screen { display: none; flex-direction: column; width: 100%; max-width: 480px; flex: 1; }
    .screen.active { display: flex; }
    #screen-main { align-items: center; justify-content: center; padding: 20px 24px; }
    .status-text { font-size: 14px; color: rgba(200,230,255,0.55); margin-bottom: 16px; text-align: center; min-height: 20px; }
    .big-btn { width: 220px; height: 220px; border-radius: 50%; border: none; cursor: pointer; font-weight: 900; color: #fff; background: radial-gradient(circle at 40% 35%, #ff5a5a, #c0152a); box-shadow: 0 0 60px rgba(220,40,40,0.45), 0 8px 32px rgba(0,0,0,0.4); transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1); display: flex; align-items: center; justify-content: center; flex-direction: column; user-select: none; -webkit-user-select: none; }
    .big-btn.ok { background: radial-gradient(circle at 40% 35%, #4cde80, #1a9e50); box-shadow: 0 0 60px rgba(40,200,100,0.45), 0 8px 32px rgba(0,0,0,0.4); cursor: default; }
    .big-btn.pulse { transform: scale(0.93); }
    .btn-emoji { font-size: 48px; line-height: 1; }
    .btn-text { font-size: 24px; font-weight: 800; text-align: center; line-height: 1.3; margin-top: 6px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .sent-badge { margin-top: 20px; background: rgba(40,200,100,0.15); border: 1px solid rgba(40,200,100,0.4); border-radius: 20px; padding: 8px 20px; font-size: 14px; color: #4cde80; opacity: 0; transform: translateY(8px); transition: all 0.4s ease; text-align: center; }
    .sent-badge.show { opacity: 1; transform: translateY(0); }
    .last-time { margin-top: 12px; font-size: 13px; color: rgba(200,230,255,0.4); text-align: center; min-height: 20px; }
    .sub-info { margin-top: 24px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .chip { background: rgba(126,207,255,0.08); border: 1px solid rgba(126,207,255,0.18); border-radius: 14px; padding: 5px 14px; font-size: 12px; color: rgba(200,230,255,0.65); cursor: pointer; }
    .follow-banner { width: 100%; max-width: 480px; margin: 10px 0; background: rgba(40,200,100,0.1); border: 1px solid rgba(40,200,100,0.3); border-radius: 14px; padding: 14px 18px; display: none; }
    .follow-banner.show { display: block; }
    #screen-contacts, #screen-frequency, #screen-alerts, #screen-policy { padding: 24px; overflow-y: auto; }
    .section-title { font-size: 20px; font-weight: 800; color: #7ecfff; margin-bottom: 20px; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(126,207,255,0.12); border-radius: 16px; padding: 16px 20px; margin-bottom: 12px; }
    .card-hint { font-size: 13px; color: rgba(200,230,255,0.5); margin-bottom: 12px; line-height: 1.6; }
    .share-box { background: rgba(40,200,100,0.07); border: 1px solid rgba(40,200,100,0.2); border-radius: 16px; padding: 18px; margin-bottom: 12px; }
    .share-link { background: rgba(0,0,0,0.25); border-radius: 10px; padding: 10px 14px; font-size: 12px; color: #7ecfff; word-break: break-all; margin: 10px 0; font-family: monospace; line-height: 1.5; border: 1px solid rgba(126,207,255,0.15); }
    .share-btn { background: linear-gradient(135deg, #1a9e50, #0d7a3a); border: none; border-radius: 12px; color: #fff; padding: 12px 24px; font-size: 14px; font-weight: 700; cursor: pointer; width: 100%; font-family: inherit; }
    .follower-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(126,207,255,0.05); border: 1px solid rgba(126,207,255,0.1); border-radius: 10px; margin-bottom: 6px; }
    .follower-name { font-size: 14px; font-weight: 600; }
    .follower-email { font-size: 12px; color: rgba(200,230,255,0.4); margin-top: 2px; }
    .freq-option { background: rgba(255,255,255,0.04); border: 1px solid rgba(126,207,255,0.12); border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; cursor: pointer; color: rgba(200,230,255,0.7); transition: all 0.2s; font-size: 15px; }
    .freq-option.active { background: rgba(126,207,255,0.15); border-color: #7ecfff; color: #7ecfff; font-weight: 700; }
    .day-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 6px; margin-top: 12px; }
    .day-cell { background: rgba(255,255,255,0.05); color: rgba(200,230,255,0.6); border-radius: 8px; padding: 8px 0; text-align: center; font-size: 11px; cursor: pointer; border: 1px solid rgba(126,207,255,0.15); transition: all 0.2s; }
    .day-cell.active { background: #7ecfff; color: #0f1923; font-weight: 700; }
    .interval-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 12px; }
    .interval-cell { background: rgba(255,255,255,0.05); color: rgba(200,230,255,0.6); border-radius: 8px; padding: 14px 0; text-align: center; font-size: 18px; font-weight: 700; cursor: pointer; border: 1px solid rgba(126,207,255,0.15); transition: all 0.2s; }
    .interval-cell.active { background: #7ecfff; color: #0f1923; }
    .alert-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: rgba(126,207,255,0.06); border: 1px solid rgba(126,207,255,0.15); border-radius: 10px; margin-bottom: 6px; font-size: 14px; color: rgba(200,230,255,0.8); }
    .alert-row.orange { background: rgba(255,150,80,0.06); border-color: rgba(255,150,80,0.2); color: rgba(255,200,160,0.85); }
    .alert-check { color: #4cde80; font-size: 13px; }
    .alert-check.orange { color: #ff9b60; }
    .card-subtitle { font-weight: 700; margin-bottom: 8px; font-size: 15px; }
    .policy-box { background: rgba(255,200,50,0.06); border: 1px solid rgba(255,200,50,0.2); border-radius: 16px; padding: 20px; font-size: 13px; line-height: 1.9; color: rgba(255,230,150,0.85); }
    .policy-title { font-weight: 800; font-size: 15px; margin-bottom: 14px; color: #ffd97d; }
    .policy-box p { margin-bottom: 10px; }
    .nav { width: 100%; max-width: 480px; display: flex; border-top: 1px solid rgba(126,207,255,0.1); background: rgba(15,25,35,0.97); position: sticky; bottom: 0; z-index: 10; }
    .nav-item { flex: 1; padding: 12px 0; text-align: center; font-size: 10px; color: rgba(200,230,255,0.35); cursor: pointer; border-top: 2px solid transparent; transition: all 0.2s; line-height: 1.4; }
    .nav-item.active { color: #7ecfff; border-top-color: #7ecfff; font-weight: 700; }
    .nav-icon { font-size: 20px; display: block; margin-bottom: 2px; }
    .notif-bar { width: 100%; max-width: 480px; background: rgba(255,200,50,0.09); border-bottom: 1px solid rgba(255,200,50,0.2); padding: 10px 18px; font-size: 13px; color: rgba(255,230,150,0.85); text-align: center; display: none; }
    .notif-bar.show { display: block; }
    .notif-bar button { background: rgba(255,200,50,0.2); border: 1px solid rgba(255,200,50,0.35); border-radius: 8px; color: #ffd97d; padding: 4px 14px; cursor: pointer; font-size: 12px; margin-top: 6px; font-family: inherit; font-weight: 700; }
    @media (max-height: 700px) { .big-btn { width: 180px; height: 180px; } .btn-emoji { font-size: 36px; } .btn-text { font-size: 20px; } }
  </style>
</head>
<body>

<div id="loading">
  <div style="font-size:56px">🤝</div>
  <div class="spinner"></div>
  <p style="color:rgba(200,230,255,0.4);font-size:14px;margin-top:4px;">טוען...</p>
</div>

<div id="login-screen">
  <div class="login-logo">🤝</div>
  <h1 class="login-title">אני בסדר</h1>
  <p class="login-sub">עדכן את האנשים החשובים לך<br>שאתה בסדר – בלחיצת כפתור אחת</p>
  <button class="google-btn" onclick="signInWithGoogle()">
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    כניסה עם Google
  </button>
  <p class="login-policy">בכניסה אתה מסכים למדיניות הפרטיות.<br>האפליקציה אינה תחליף לשירותי חירום.<br>חירום: מד"א 101 | משטרה 100</p>
</div>

<div id="app">
  <div class="header">
    <span class="logo">🤝 אני בסדר</span>
    <div class="user-row">
      <div class="avatar" id="userAvatar">👤</div>
      <button class="logout-btn" onclick="doSignOut()">יציאה</button>
    </div>
  </div>
  <div class="notif-bar" id="notifBar">
    🔔 הפעל התראות כדי שנזכיר לך לדווח בזמן
    <br><button onclick="askNotifications()">הפעל התראות</button>
  </div>
  <div class="follow-banner" id="followBanner">
    <div style="font-weight:700;color:#4cde80;margin-bottom:6px;" id="followBannerTitle"></div>
    <div style="font-size:13px;color:rgba(200,230,255,0.65);" id="followBannerText"></div>
  </div>

  <div class="screen active" id="screen-main">
    <p class="status-text" id="statusText">לחץ לעדכן שהכל בסדר</p>
    <button class="big-btn" id="bigBtn" onclick="handleOkPress()">
      <span class="btn-emoji">👋</span>
      <span class="btn-text">אני<br>בסדר</span>
    </button>
    <div class="sent-badge" id="sentBadge">✅ כל העוקבים שלך קיבלו התראה!</div>
    <p class="last-time" id="lastTime"></p>
    <div class="sub-info">
      <span class="chip" onclick="showScreen('contacts')" id="contactsChip">👥 0 עוקבים</span>
      <span class="chip" onclick="showScreen('frequency')" id="freqChip">🔄 כל יום</span>
    </div>
  </div>

  <div class="screen" id="screen-contacts">
    <p class="section-title">👥 עוקבים</p>
    <div class="share-box">
      <p style="font-weight:700;color:#4cde80;margin-bottom:6px;font-size:15px;">📲 הלינק האישי שלך</p>
      <p style="font-size:13px;color:rgba(200,230,255,0.55);margin-bottom:0;">שלח לאנשים שרוצים לקבל התראות ממך:</p>
      <div class="share-link" id="myShareLink">טוען...</div>
      <button class="share-btn" onclick="doShare()">📤 שתף עכשיו</button>
    </div>
    <div class="card">
      <p class="card-subtitle" style="color:#7ecfff;margin-bottom:10px;">👁️ אנשים שעוקבים אחריך</p>
      <div id="followersList"><p style="font-size:13px;color:rgba(200,230,255,0.3);text-align:center;padding:8px 0;">עדיין אין עוקבים – שתף את הלינק!</p></div>
    </div>
  </div>

  <div class="screen" id="screen-frequency">
    <p class="section-title">🔄 תדירות דיווח</p>
    <div class="freq-option active" id="freq-daily" onclick="setFreq('daily')">כל יום</div>
    <div class="freq-option" id="freq-odd" onclick="setFreq('odd')">כל יום אי-זוגי (א׳, ג׳, ה׳, ש׳)</div>
    <div class="freq-option" id="freq-even" onclick="setFreq('even')">כל יום זוגי (ב׳, ד׳, ו׳)</div>
    <div class="freq-option" id="freq-specific" onclick="setFreq('specific')">ימים ספציפיים בשבוע</div>
    <div class="freq-option" id="freq-interval" onclick="setFreq('interval')">מרווח זמן קבוע</div>
    <div class="card" id="specificDaysCard" style="display:none;margin-top:12px;">
      <p class="card-hint">בחר ימים:</p>
      <div class="day-grid">
        <div class="day-cell" id="day-0" onclick="toggleDay(0)">א׳</div>
        <div class="day-cell" id="day-1" onclick="toggleDay(1)">ב׳</div>
        <div class="day-cell" id="day-2" onclick="toggleDay(2)">ג׳</div>
        <div class="day-cell" id="day-3" onclick="toggleDay(3)">ד׳</div>
        <div class="day-cell" id="day-4" onclick="toggleDay(4)">ה׳</div>
        <div class="day-cell" id="day-5" onclick="toggleDay(5)">ו׳</div>
        <div class="day-cell" id="day-6" onclick="toggleDay(6)">ש׳</div>
      </div>
    </div>
    <div class="card" id="intervalCard" style="display:none;margin-top:12px;">
      <p class="card-hint">כל כמה ימים?</p>
      <div class="interval-grid">
        <div class="interval-cell active" id="int-1" onclick="setIntervalDays(1)">1</div>
        <div class="interval-cell" id="int-2" onclick="setIntervalDays(2)">2</div>
        <div class="interval-cell" id="int-3" onclick="setIntervalDays(3)">3</div>
        <div class="interval-cell" id="int-4" onclick="setIntervalDays(4)">4</div>
      </div>
    </div>
  </div>

  <div class="screen" id="screen-alerts">
    <p class="section-title">🔔 התראות</p>
    <div class="card">
      <p class="card-subtitle" style="color:#7ecfff;">תזכורות אישיות</p>
      <p class="card-hint">תקבל התראה לפני שפג הזמן לדיווח:</p>
      <div class="alert-row"><span>2 שעות לפני</span><span class="alert-check">✓ פעיל</span></div>
      <div class="alert-row"><span>שעה לפני</span><span class="alert-check">✓ פעיל</span></div>
      <div class="alert-row"><span>30 דקות לפני</span><span class="alert-check">✓ פעיל</span></div>
      <div class="alert-row"><span>10 דקות לפני</span><span class="alert-check">✓ פעיל</span></div>
      <div class="alert-row"><span>דקה לפני</span><span class="alert-check">✓ פעיל</span></div>
    </div>
    <div class="card">
      <p class="card-subtitle" style="color:#ff9b60;">התראות לעוקבים אם לא דיווחת</p>
      <div class="alert-row orange"><span>מיידית</span><span class="alert-check orange">✓ פעיל</span></div>
      <div class="alert-row orange"><span>30 דקות אחרי</span><span class="alert-check orange">✓ פעיל</span></div>
      <div class="alert-row orange"><span>שעה אחרי</span><span class="alert-check orange">✓ פעיל</span></div>
      <div class="alert-row orange"><span>שעתיים אחרי</span><span class="alert-check orange">✓ פעיל</span></div>
      <div class="alert-row orange"><span>4 שעות אחרי</span><span class="alert-check orange">✓ פעיל</span></div>
      <div class="alert-row orange"><span>12 שעות אחרי</span><span class="alert-check orange">✓ פעיל</span></div>
    </div>
  </div>

  <div class="screen" id="screen-policy">
    <p class="section-title">📋 מדיניות</p>
    <div class="policy-box">
      <p class="policy-title">אני בסדר – הצהרת שקיפות</p>
      <p>🔴 <strong>אינה תחליף לעזרה:</strong> חירום – חייגו 101 (מד"א) או 100 (משטרה).</p>
      <p>📍 <strong>אין מעקב מיקום:</strong> האפליקציה אינה קוראת את מיקומך.</p>
      <p>❤️ <strong>אין מדדים בריאותיים:</strong> דיווח ידני בלבד.</p>
      <p>👆 <strong>כלי תקשורת בלבד:</strong> שליחת התראה לעוקבים שנרשמו.</p>
      <p>🔒 <strong>פרטיות:</strong> נשמרים שם, אימייל ומועד דיווח בלבד.</p>
      <p>⚠️ <strong>שקיפות:</strong> מדובר בלחיצת כפתור ידנית בלבד.</p>
      <p style="font-size:11px;color:rgba(255,220,130,0.45);margin-top:16px;">גרסה 2.0 | שימוש אישי בלבד</p>
    </div>
  </div>

  <div class="nav">
    <div class="nav-item active" id="nav-main" onclick="showScreen('main')"><span class="nav-icon">🏠</span>בית</div>
    <div class="nav-item" id="nav-contacts" onclick="showScreen('contacts')"><span class="nav-icon">👥</span>עוקבים</div>
    <div class="nav-item" id="nav-frequency" onclick="showScreen('frequency')"><span class="nav-icon">🔄</span>תדירות</div>
    <div class="nav-item" id="nav-alerts" onclick="showScreen('alerts')"><span class="nav-icon">🔔</span>התראות</div>
    <div class="nav-item" id="nav-policy" onclick="showScreen('policy')"><span class="nav-icon">📋</span>מדיניות</div>
  </div>
</div>

<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdErGgHq1ens9kQiQzofowxFsyeS2hjNY",
  authDomain: "ani-beseder-57800.firebaseapp.com",
  projectId: "ani-beseder-57800",
  storageBucket: "ani-beseder-57800.firebasestorage.app",
  messagingSenderId: "596709424854",
  appId: "1:596709424854:web:3aadf6233f4a9a84ac9377",
  measurementId: "G-07PX1C42D5"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

let currentUser = null;
let state = { freq:'daily', specificDays:[], intervalDays:1, isOk:false, lastConfirmed:null, followers:[] };

window.signInWithGoogle = async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch(e) { alert('שגיאה בכניסה, נסה שוב'); }
};
window.doSignOut = async () => {
  if (confirm('להתנתק?')) await signOut(auth);
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
  } else {
    currentUser = null;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});

async function initUser() {
  const ref = doc(db, 'users', currentUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    state.freq = d.freq||'daily';
    state.specificDays = d.specificDays||[];
    state.intervalDays = d.intervalDays||1;
    if (d.lastConfirmed) {
      state.lastConfirmed = d.lastConfirmed.toDate();
      state.isOk = (Date.now()-state.lastConfirmed)/3600000 < 24;
    }
  } else {
    await setDoc(ref, { name:currentUser.displayName, email:currentUser.email, freq:'daily', specificDays:[], intervalDays:1, createdAt:serverTimestamp() });
  }
  await loadFollowers();
  syncFreqUI();
  updateMainUI();
}

async function loadFollowers() {
  const q = query(collection(db,'follows'), where('followingUid','==',currentUser.uid));
  const snaps = await getDocs(q);
  state.followers = [];
  snaps.forEach(d => state.followers.push(d.data()));
  renderFollowers();
  updateChips();
}

function renderFollowers() {
  const el = document.getElementById('followersList');
  if (!state.followers.length) { el.innerHTML = '<p style="font-size:13px;color:rgba(200,230,255,0.3);text-align:center;padding:8px 0;">עדיין אין עוקבים – שתף את הלינק!</p>'; return; }
  el.innerHTML = state.followers.map(f => `<div class="follower-row"><div><div class="follower-name">${f.followerName||'משתמש'}</div><div class="follower-email">${f.followerEmail||''}</div></div><span style="color:#4cde80;font-size:20px;">✓</span></div>`).join('');
}

async function checkFollowParam() {
  const params = new URLSearchParams(window.location.search);
  const followUid = params.get('follow');
  if (!followUid || followUid === currentUser.uid) return;
  const followId = `${currentUser.uid}_${followUid}`;
  const ref = doc(db,'follows',followId);
  const snap = await getDoc(ref);
  const userSnap = await getDoc(doc(db,'users',followUid));
  const followedName = userSnap.exists() ? (userSnap.data().name||'המשתמש') : 'המשתמש';
  if (!snap.exists()) {
    await setDoc(ref, { followerUid:currentUser.uid, followerName:currentUser.displayName, followerEmail:currentUser.email, followingUid:followUid, followingName:followedName, createdAt:serverTimestamp() });
    document.getElementById('followBannerTitle').textContent = `✅ עכשיו אתה עוקב אחרי ${followedName}`;
    document.getElementById('followBannerText').textContent = `תקבל התראה כשהכל בסדר עם ${followedName}.`;
    document.getElementById('followBanner').classList.add('show');
    setTimeout(() => document.getElementById('followBanner').classList.remove('show'), 6000);
  }
  window.history.replaceState({},'',' /');
  onSnapshot(doc(db,'status',followUid), snap => {
    if (!snap.exists()) return;
    const d = snap.data();
    const ts = d.timestamp?.toDate();
    if (ts && (Date.now()-ts)/60000 < 2 && Notification.permission==='granted') {
      new Notification(`${d.name} בסדר! 🤝`, { body:`${d.name} עדכן עכשיו שהכל בסדר` });
    }
  });
}

window.handleOkPress = async () => {
  if (state.isOk || !currentUser) return;
  document.getElementById('bigBtn').classList.add('pulse');
  setTimeout(() => document.getElementById('bigBtn').classList.remove('pulse'), 300);
  state.isOk = true;
  state.lastConfirmed = new Date();
  await setDoc(doc(db,'users',currentUser.uid), { lastConfirmed:serverTimestamp() }, { merge:true });
  await setDoc(doc(db,'status',currentUser.uid), { uid:currentUser.uid, name:currentUser.displayName, isOk:true, timestamp:serverTimestamp() });
  updateMainUI();
  document.getElementById('sentBadge').classList.add('show');
  setTimeout(() => document.getElementById('sentBadge').classList.remove('show'), 4000);
};

window.doShare = () => {
  const link = `https://anibeseder.netlify.app/?follow=${currentUser.uid}`;
  const text = `היי! ${currentUser.displayName||'אני'} מזמין אותך לעקוב באפליקציית "אני בסדר".\nתקבל התראה כשאני בסדר:\n${link}`;
  if (navigator.share) navigator.share({ title:'אני בסדר', text, url:link });
  else navigator.clipboard.writeText(text).then(() => alert('✅ הועתק! הדבק בוואטסאפ.')).catch(() => alert('העתק את הלינק:\n'+link));
};

window.setFreq = async mode => {
  state.freq = mode;
  syncFreqUI(); updateChips();
  await setDoc(doc(db,'users',currentUser.uid), { freq:mode }, { merge:true });
};
window.toggleDay = async d => {
  const i = state.specificDays.indexOf(d);
  if (i>-1) state.specificDays.splice(i,1); else state.specificDays.push(d);
  document.querySelectorAll('.day-cell').forEach((el,j) => el.classList.toggle('active',state.specificDays.includes(j)));
  await setDoc(doc(db,'users',currentUser.uid), { specificDays:state.specificDays }, { merge:true });
};
window.setIntervalDays = async n => {
  state.intervalDays = n;
  document.querySelectorAll('.interval-cell').forEach((el,i) => el.classList.toggle('active',i+1===n));
  updateChips();
  await setDoc(doc(db,'users',currentUser.uid), { intervalDays:n }, { merge:true });
};

function syncFreqUI() {
  document.querySelectorAll('.freq-option').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('freq-'+state.freq);
  if (el) el.classList.add('active');
  document.getElementById('specificDaysCard').style.display = state.freq==='specific'?'block':'none';
  document.getElementById('intervalCard').style.display = state.freq==='interval'?'block':'none';
  state.specificDays.forEach(d => { const c = document.getElementById('day-'+d); if(c) c.classList.add('active'); });
  document.querySelectorAll('.interval-cell').forEach((el,i) => el.classList.toggle('active',i+1===state.intervalDays));
}

function checkNotifPermission() {
  if ('Notification' in window && Notification.permission==='default')
    document.getElementById('notifBar').classList.add('show');
}
window.askNotifications = async () => {
  const p = await Notification.requestPermission();
  document.getElementById('notifBar').classList.remove('show');
  if (p==='granted') new Notification('אני בסדר 🤝', { body:'מעולה! נזכיר לך לדווח בזמן.' });
};

function updateMainUI() {
  const btn = document.getElementById('bigBtn');
  const st = document.getElementById('statusText');
  if (state.isOk) {
    btn.classList.add('ok');
    btn.innerHTML = '<span class="btn-text">הכל<br>בסדר ✓</span>';
    st.textContent = '✅ העוקבים שלך קיבלו התראה';
  } else {
    btn.classList.remove('ok');
    btn.innerHTML = '<span class="btn-emoji">👋</span><span class="btn-text">אני<br>בסדר</span>';
    st.textContent = 'לחץ לעדכן שהכל בסדר';
  }
  document.getElementById('lastTime').textContent = state.lastConfirmed ? 'עודכן: '+state.lastConfirmed.toLocaleTimeString('he-IL') : '';
  updateChips();
}

function updateChips() {
  document.getElementById('contactsChip').textContent = `👥 ${state.followers.length} עוקבים`;
  const labels = {daily:'כל יום',odd:'ימים אי-זוגיים',even:'ימים זוגיים',specific:'ימים ספציפיים',interval:`כל ${state.intervalDays} ימים`};
  document.getElementById('freqChip').textContent = '🔄 '+(labels[state.freq]||'כל יום');
}

window.showScreen = name => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  const nav = document.getElementById('nav-'+name);
  if (nav) nav.classList.add('active');
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
</script>
</body>
</html>
