import { useState, useEffect, useRef } from 'react'

const KICK_CLIENT_ID = "01KSWTJSRKMA4DN9QS76SHAQK3";
const KICK_OAUTH_CALLBACK_URL = "https://kz1d3kezb3.execute-api.eu-north-1.amazonaws.com/default/kick_oauth_callback";
const AWS_CHANNEL_API_URL = "https://9zdnkqnc90.execute-api.eu-north-1.amazonaws.com/default/kick_channel";
const AWS_CHAT_API_URL = "https://nbgqqa1530.execute-api.eu-north-1.amazonaws.com/default/kick_send_message";

const DEFAULT_MARKET_ITEMS = [
  { id: "10", name: "Peluş", price: 500, type: "skin", file: "peluş.png", status: "approved", developer: "System", desc: "Sevimli ve yumuşak ayıcık görünümü." },
  { id: "11", name: "Nilüfer", price: 600, type: "skin", file: "nilüfer.png", status: "approved", developer: "System", desc: "Zarif ve pembe nilüfer çiçeği görünümü." },
  { id: "12", name: "Rakı", price: 800, type: "skin", file: "rakı.png", status: "approved", developer: "System", desc: "Klasik rakı kadehi eşliğinde geleneksel görünüm." },
  { id: "13", name: "Çay", price: 300, type: "skin", file: "çay.png", status: "approved", developer: "System", desc: "Tavşan kanı sıcak ince belli Türk çayı görünümü." }
];

function App() {
  const [activeTab, setActiveTab] = useState('config');

  // --- CONFIGURATOR STATES ---
  const [devId, setDevId] = useState(() => localStorage.getItem('paira_devId') || '');
  const [broadcasterSecret, setBroadcasterSecret] = useState(() => localStorage.getItem('paira_secret') || '');
  const [channelName, setChannelName] = useState(() => localStorage.getItem('paira_channel') || '');
  const [broadcasterUserId, setBroadcasterUserId] = useState(() => localStorage.getItem('paira_buid') || '');
  const [authList, setAuthList] = useState(() => localStorage.getItem('paira_auth') || '');
  const [poolWidth, setPoolWidth] = useState(() => localStorage.getItem('paira_poolwidth') || '300');
  const [charWidth, setCharWidth] = useState(() => localStorage.getItem('paira_charwidth') || '120');
  const [charSelect, setCharSelect] = useState(() => localStorage.getItem('paira_char') || 'karakter');
  const [targetSelect, setTargetSelect] = useState(() => localStorage.getItem('paira_target') || 'havuz');
  const [soundSelect, setSoundSelect] = useState(() => localStorage.getItem('paira_sound') || 'vada');
  const [gravity, setGravity] = useState(() => localStorage.getItem('paira_gravity') || '0.025');
  const [minAngle, setMinAngle] = useState(() => localStorage.getItem('paira_minangle') || '25');
  const [maxAngle, setMaxAngle] = useState(() => localStorage.getItem('paira_maxangle') || '55');
  const [minAccel, setMinAccel] = useState(() => localStorage.getItem('paira_minaccel') || '0.01');
  const [maxAccel, setMaxAccel] = useState(() => localStorage.getItem('paira_maxaccel') || '0.03');
  const [speed, setSpeed] = useState(() => localStorage.getItem('paira_speed') || '4');

  const [charNameOther, setCharNameOther] = useState('');
  const [targetNameOther, setTargetNameOther] = useState('');
  const [soundNameOther, setSoundNameOther] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // --- WAL LOGS STATE ---
  const [logs, setLogs] = useState([]);
  const [rpgProfiles, setRpgProfiles] = useState({});
  const [raffleParticipants, setRaffleParticipants] = useState([]);

  // --- RAFFLE STATES ---
  const [manualParticipant, setManualParticipant] = useState('');
  const [rolling, setRolling] = useState(false);
  const [rollName, setRollName] = useState('Hazır');
  const [winner, setWinner] = useState(null);

  // --- DECOUPLED RAFFLE STATES ---
  const [raffleActive, setRaffleActive] = useState(false);
  const [raffleEntryCost, setRaffleEntryCost] = useState(() => Number(localStorage.getItem('paira_raffle_cost')) || 0);
  const [raffleMinLevel, setRaffleMinLevel] = useState(() => Number(localStorage.getItem('paira_raffle_level')) || 1);
  const [raffleHistory, setRaffleHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('paira_raffle_history')) || [];
    } catch {
      return [];
    }
  });
  const [butterflyMinTime, setButterflyMinTime] = useState(() => Number(localStorage.getItem('paira_butterfly_min_time')) || 2);
  const [butterflyMaxTime, setButterflyMaxTime] = useState(() => Number(localStorage.getItem('paira_butterfly_max_time')) || 6);
  const [activePlugins, setActivePlugins] = useState({ butterfly: true, blackjack: true, robbery: true, trivia: true });
  const [customCommands, setCustomCommands] = useState([]);
  const [customCmdName, setCustomCmdName] = useState('');
  const [customCmdResponse, setCustomCmdResponse] = useState('');
  const [activeTheme, setActiveTheme] = useState(null);
  const [activeWidget, setActiveWidget] = useState(null);
  const [marketSubTab, setMarketSubTab] = useState('eklentiler');

  // --- GLOBAL MARKETPLACE STATE ---
  const [globalMarketItems, setGlobalMarketItems] = useState([]);
  const [disabledMarketItems, setDisabledMarketItems] = useState(new Set());

  // --- DEVELOPER FORM STATE ---
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('skin');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemDeveloper, setNewItemDeveloper] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [generatedPackageToken, setGeneratedPackageToken] = useState('');
  const [designerY, setDesignerY] = useState('30%');
  const [designerBg, setDesignerBg] = useState('rgba(10, 8, 22, 0.9)');
  const [designerRadius, setDesignerRadius] = useState('24px');
  const [designerBorder, setDesignerBorder] = useState('rgba(178, 102, 255, 0.4)');
  const [customWidgetCode, setCustomWidgetCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: sans-serif; background: transparent; }
    #alert-box { background: rgba(138, 43, 226, 0.85); color: #fff; padding: 20px 40px; border-radius: 12px; border: 2px solid #b266ff; box-shadow: 0 0 20px rgba(178,102,255,0.5); font-size: 24px; font-weight: 700; transform: scale(0); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    #alert-box.active { transform: scale(1); }
  </style>
</head>
<body>
  <div id="alert-box">📢 Yeni Aktivite Algılandı!</div>
  <script>
    window.addEventListener('message', (e) => {
      const data = e.data;
      if (data.event === 'wal') {
        const payload = data.payload;
        if (payload.type === 'SCORE') {
          const box = document.getElementById('alert-box');
          box.innerText = '🎯 @' + payload.user + ' hedefe ulaştı! (' + payload.score + ' Puan)';
          box.classList.add('active');
          setTimeout(() => box.classList.remove('active'), 4000);
        } else if (payload.type === 'CATCH_BUTTERFLY') {
          const box = document.getElementById('alert-box');
          box.innerText = '🦋 @' + payload.user + ' ' + payload.rarity.toUpperCase() + ' kelebek yakaladı!';
          box.classList.add('active');
          setTimeout(() => box.classList.remove('active'), 4000);
        }
      }
    });
  </script>
</body>
</html>`);

  // --- MODERATOR STATES ---
  const [modUser, setModUser] = useState('');
  const [modPoints, setModPoints] = useState(100);
  const [modHealth, setModHealth] = useState(100);
  const [modItem, setModItem] = useState('Madalya');

  // --- PAZAR YERİ BULUT API ENTEGRASYONU ---
  async function callMarketplaceAPI(action, extraParams = {}) {
    const dId = localStorage.getItem('paira_devId') || '';
    const bSecret = localStorage.getItem('paira_secret') || '';
    const bUserId = localStorage.getItem('paira_buid') || '';

    const headers = {
      'Content-Type': 'application/json'
    };

    const body = {
      action,
      ...extraParams
    };

    if (bSecret && dId && bUserId) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const payload = `${dId}:${timestamp}:${action}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(bSecret);
        const msgData = encoder.encode(payload);

        const cryptoKey = await crypto.subtle.importKey(
          'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        const signature = Array.from(new Uint8Array(signatureBuffer))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        headers['X-Signature'] = signature;
        headers['X-Timestamp'] = timestamp;
        headers['X-User-Id'] = dId;
      } catch (err) {
        console.error("Failed to sign marketplace request:", err);
      }
    }

    const response = await fetch(AWS_CHAT_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (HTTP ${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  const fetchGlobalMarketItems = async () => {
    try {
      const res = await callMarketplaceAPI("list_market_items");
      if (res && res.success && res.items) {
        setGlobalMarketItems(res.items);
        setTimeout(fetchLogs, 50);
      }
    } catch (err) {
      console.error("Failed to fetch global market items:", err);
      setGlobalMarketItems(DEFAULT_MARKET_ITEMS);
    }
  };

  useEffect(() => {
    if (devId) {
      setTimeout(() => setNewItemDeveloper(devId), 0);
    }
  }, [devId]);

  // Load state from URL hash if returning from OAuth
  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('success') === 'true') {
        const c = hashParams.get('channel') || '';
        const b = hashParams.get('buid') || '';
        const s = hashParams.get('secret') || '';
        
        setTimeout(() => {
          setDevId(c);
          setChannelName(c);
          setBroadcasterUserId(b);
          setBroadcasterSecret(s);
        }, 0);

        localStorage.setItem('paira_devId', c);
        localStorage.setItem('paira_channel', c);
        localStorage.setItem('paira_buid', b);
        localStorage.setItem('paira_secret', s);

        setTimeout(() => {
          fetchGlobalMarketItems();
        }, 0);

        window.location.hash = ''; // Clear hash
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save config values to localStorage
  useEffect(() => {
    localStorage.setItem('paira_devId', devId);
    localStorage.setItem('paira_secret', broadcasterSecret);
    localStorage.setItem('paira_channel', channelName);
    localStorage.setItem('paira_buid', broadcasterUserId);
    localStorage.setItem('paira_auth', authList);
    localStorage.setItem('paira_poolwidth', poolWidth);
    localStorage.setItem('paira_charwidth', charWidth);
    localStorage.setItem('paira_char', charSelect);
    localStorage.setItem('paira_target', targetSelect);
    localStorage.setItem('paira_sound', soundSelect);
    localStorage.setItem('paira_gravity', gravity);
    localStorage.setItem('paira_minangle', minAngle);
    localStorage.setItem('paira_maxangle', maxAngle);
    localStorage.setItem('paira_minaccel', minAccel);
    localStorage.setItem('paira_maxaccel', maxAccel);
    localStorage.setItem('paira_speed', speed);
    localStorage.setItem('paira_raffle_cost', raffleEntryCost.toString());
    localStorage.setItem('paira_raffle_level', raffleMinLevel.toString());
    localStorage.setItem('paira_raffle_history', JSON.stringify(raffleHistory));
    localStorage.setItem('paira_butterfly_min_time', butterflyMinTime.toString());
    localStorage.setItem('paira_butterfly_max_time', butterflyMaxTime.toString());
  }, [devId, broadcasterSecret, channelName, broadcasterUserId, authList, poolWidth, charWidth, charSelect, targetSelect, soundSelect, gravity, minAngle, maxAngle, minAccel, maxAccel, speed, raffleEntryCost, raffleMinLevel, raffleHistory, butterflyMinTime, butterflyMaxTime]);


  const handleRaffleJoinAttempt = async (user) => {
    const lowerUser = user.toLowerCase();
    
    // Check if already in participants list
    if (raffleParticipants.map(u => u.toLowerCase()).includes(lowerUser)) {
      return;
    }

    // Get user profile
    const profile = rpgProfiles[lowerUser] || { username: user, puan: 0, seviye: 1, envanter: [], health: 100 };
    
    if (profile.seviye < raffleMinLevel) {
      console.warn(`Raffle: @${user} levelsiz (${profile.seviye} < ${raffleMinLevel})`);
      return;
    }

    if (profile.puan < raffleEntryCost) {
      console.warn(`Raffle: @${user} puansız (${profile.puan} < ${raffleEntryCost})`);
      return;
    }

    // Deduct points
    if (raffleEntryCost > 0) {
      await appendIndexedDBLog({
        type: "RPG_POINT_CHANGE",
        user: user,
        amount: -raffleEntryCost,
        reason: "raffle_ticket"
      });
    }

    // Join raffle
    await appendIndexedDBLog({
      type: "RAFFLE_JOIN",
      user: user
    });
  };

  // Store handleRaffleJoinAttempt in a ref to avoid stale closures and reconnect spam
  const joinAttemptRef = useRef();
  joinAttemptRef.current = handleRaffleJoinAttempt;

  const globalMarketItemsRef = useRef(globalMarketItems);
  useEffect(() => {
    globalMarketItemsRef.current = globalMarketItems;
  }, [globalMarketItems]);

  // Kick WS connection for panel raffle
  useEffect(() => {
    if (activeTab !== 'raffle' || !broadcasterUserId || !raffleActive) return;

    let ws = null;
    let watchdogTimer = null;
    let reconnectTimer = null;
    
    const connectWS = () => {
      console.log(`Connecting to Kick WebSocket from Panel for chatroom: ${broadcasterUserId}`);
      ws = new WebSocket("wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false");
      
      const resetWatchdog = () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(() => {
          console.warn("Panel WebSocket inactivity timeout. Reconnecting...");
          ws.close();
        }, 45000);
      };

      ws.onopen = () => {
        resetWatchdog();
        const subscribeMsg = {
          event: "pusher:subscribe",
          data: { channel: `chatrooms.${broadcasterUserId}.v2`, auth: "" }
        };
        ws.send(JSON.stringify(subscribeMsg));
      };

      ws.onmessage = (event) => {
        resetWatchdog();
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'pusher:ping') {
            ws.send(JSON.stringify({ event: 'pusher:pong' }));
            return;
          }
          if (data.event === 'App\\Events\\ChatMessageEvent') {
            const chatMessage = JSON.parse(data.data);
            const username = chatMessage.sender?.username || '';
            const content = (chatMessage.content || '').trim().toLowerCase();

            if (content === '!katıl') {
              if (joinAttemptRef.current) {
                joinAttemptRef.current(username);
              }
            }
          }
        } catch (e) {
          console.error("Panel socket message parsing error:", e);
        }
      };

      ws.onclose = () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectWS, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, broadcasterUserId, raffleActive]);


  // Load WAL Logs and Replay State
  async function fetchLogs() {
    const loadedLogs = await readIndexedDBLogs();
    setLogs(loadedLogs);

    // Replay to build profiles
    const profiles = {};
    const getOrCreate = (user) => {
      const k = user.toLowerCase();
      if (!profiles[k]) {
        profiles[k] = { username: user, puan: 0, seviye: 1, envanter: [], health: 100, kelebekler: { yesil: 0, gumus: 0, mavi: 0, mor: 0, kirmizi: 0, altin: 0, kozmik: 0 } };
      }
      return profiles[k];
    };

    const raffleUsers = new Set();
    const plugins = { butterfly: true, blackjack: true, robbery: true, trivia: true };
    const cmds = {};
    let activeThemeItem = null;
    let activeWidgetItem = null;
    const disabledItems = new Set();

    const marketItems = {};
    const baseItems = globalMarketItemsRef.current.length > 0 ? globalMarketItemsRef.current : DEFAULT_MARKET_ITEMS;
    for (const item of baseItems) {
      marketItems[String(item.id)] = { ...item };
    }

    for (const log of loadedLogs) {
      if (log.type === "SCORE") {
        // Just track participation or score if needed
      } else if (log.type === "RPG_POINT_CHANGE") {
        const p = getOrCreate(log.user);
        p.puan = Math.max(0, p.puan + log.amount);
        let needed = p.seviye * 100;
        while (p.puan >= needed) {
          p.puan -= needed;
          p.seviye += 1;
          needed = p.seviye * 100;
        }
      } else if (log.type === "RPG_INVENTORY") {
        const p = getOrCreate(log.user);
        if (log.action === "ADD") {
          p.envanter.push(log.item);
        } else if (log.action === "REMOVE") {
          const idx = p.envanter.indexOf(log.item);
          if (idx !== -1) p.envanter.splice(idx, 1);
        }
      } else if (log.type === "RPG_HEALTH") {
        const p = getOrCreate(log.user);
        p.health = Math.max(0, Math.min(100, log.health));
      } else if (log.type === "RAFFLE_JOIN") {
        raffleUsers.add(log.user);
      } else if (log.type === "RAFFLE_CLEAR") {
        raffleUsers.clear();
      } else if (log.type === "CATCH_BUTTERFLY") {
        const p = getOrCreate(log.user);
        if (!p.kelebekler) p.kelebekler = { yesil: 0, gumus: 0, mavi: 0, mor: 0, kirmizi: 0, altin: 0, kozmik: 0 };
        p.kelebekler[log.rarity] = (p.kelebekler[log.rarity] || 0) + 1;
      } else if (log.type === "SELL_BUTTERFLY") {
        const p = getOrCreate(log.user);
        if (!p.kelebekler) p.kelebekler = { yesil: 0, gumus: 0, mavi: 0, mor: 0, kirmizi: 0, altin: 0, kozmik: 0 };
        const sellQty = Number(log.qty) || 1;
        p.kelebekler[log.rarity] = Math.max(0, (p.kelebekler[log.rarity] || 0) - sellQty);
      } else if (log.type === "TRADE_BUTTERFLY") {
        const pFrom = getOrCreate(log.from);
        const pTo = getOrCreate(log.to);
        if (!pFrom.kelebekler) pFrom.kelebekler = { yesil: 0, gumus: 0, mavi: 0, mor: 0, kirmizi: 0, altin: 0, kozmik: 0 };
        if (!pTo.kelebekler) pTo.kelebekler = { yesil: 0, gumus: 0, mavi: 0, mor: 0, kirmizi: 0, altin: 0, kozmik: 0 };
        const tradeQty = Number(log.qty) || 1;
        pFrom.kelebekler[log.rarity] = Math.max(0, (pFrom.kelebekler[log.rarity] || 0) - tradeQty);
        pTo.kelebekler[log.rarity] = (pTo.kelebekler[log.rarity] || 0) + tradeQty;
      } else if (log.type === "CRAFT_BUTTERFLY") {
        const p = getOrCreate(log.user);
        if (!p.kelebekler) p.kelebekler = { yesil: 0, gumus: 0, mavi: 0, mor: 0, kirmizi: 0, altin: 0, kozmik: 0 };
        p.kelebekler.yesil = Math.max(0, (p.kelebekler.yesil || 0) - 1);
        p.kelebekler.gumus = Math.max(0, (p.kelebekler.gumus || 0) - 1);
        p.kelebekler.mavi = Math.max(0, (p.kelebekler.mavi || 0) - 1);
        p.kelebekler.mor = Math.max(0, (p.kelebekler.mor || 0) - 1);
        p.kelebekler.kirmizi = Math.max(0, (p.kelebekler.kirmizi || 0) - 1);
        p.kelebekler.altin = Math.max(0, (p.kelebekler.altin || 0) - 1);
        p.kelebekler.kozmik = (p.kelebekler.kozmik || 0) + 1;
      } else if (log.type === "UPDATE_BUTTERFLY_SETTINGS") {
        setButterflyMinTime(Number(log.minTime) || 2);
        setButterflyMaxTime(Number(log.maxTime) || 6);
      } else if (log.type === "TOGGLE_PLUGIN") {
        plugins[log.pluginId] = log.enabled;
      } else if (log.type === "CREATE_CUSTOM_COMMAND") {
        cmds[log.name] = log.response;
      } else if (log.type === "DELETE_CUSTOM_COMMAND") {
        delete cmds[log.name];
      } else if (log.type === "EQUIP_SKIN") {
        const p = getOrCreate(log.user);
        p.equippedSkin = log.skinName;
      } else if (log.type === "INSTALL_MARKET_ITEM") {
        if (log.itemType === "theme") {
          activeThemeItem = log.itemId;
        } else if (log.itemType === "widget") {
          activeWidgetItem = log.itemId;
        }
      } else if (log.type === "DEVELOPER_SUBMIT_ITEM") {
        marketItems[String(log.id)] = {
          id: String(log.id),
          type: log.itemType,
          name: log.name,
          price: Number(log.price) || 0,
          content: log.content,
          developer: log.developer,
          status: log.status || "pending"
        };
      } else if (log.type === "ADMIN_APPROVE_ITEM") {
        const item = marketItems[String(log.id)];
        if (item) {
          item.status = log.status;
        }
      } else if (log.type === "TOGGLE_MARKET_ITEM") {
        if (log.enabled === false) {
          disabledItems.add(String(log.itemId));
        } else {
          disabledItems.delete(String(log.itemId));
        }
      }
    }

    setRpgProfiles(profiles);
    setRaffleParticipants(Array.from(raffleUsers));
    setActivePlugins(plugins);
    setCustomCommands(Object.entries(cmds).map(([name, response]) => ({ name, response })));
    setActiveTheme(activeThemeItem);
    setActiveWidget(activeWidgetItem);
    setGlobalMarketItems(Object.values(marketItems));
    setDisabledMarketItems(disabledItems);
  }

  useEffect(() => {
    PairaWALInstance.onAppendCallback = () => {
      fetchLogs();
    };

    PairaWALInstance.init().then(() => {
      fetchLogs();
    });

    setTimeout(() => {
      fetchGlobalMarketItems();
    }, 0);

    return () => {
      PairaWALInstance.onAppendCallback = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- OAUTH LOGIC ---
  const handleKickConnect = async () => {
    if (!devId.trim()) {
      alert("Lütfen önce kanal adınızı yazın!");
      return;
    }
    const ch = devId.trim();
    try {
      const response = await fetch(`${AWS_CHANNEL_API_URL}?channel=${ch}`);
      const data = await response.json();
      if (!data || !data.broadcaster_user_id) {
        alert("Kanal bulunamadı veya Chatroom ID okunamadı!");
        return;
      }
      const buid = data.broadcaster_user_id;

      // PKCE code verifier ve challenge üretimi
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallengeFromVerifier(codeVerifier);

      const redirectBase = `${window.location.origin}${window.location.pathname}`;
      // stateStr içerisine codeVerifier'ı da ekleyelim (parts[3] olarak)
      const stateStr = encodeURIComponent(`${ch}|${buid}|${redirectBase}|${codeVerifier}`);
      
      const authUrl = `https://id.kick.com/oauth/authorize?response_type=code&client_id=${KICK_CLIENT_ID}&redirect_uri=${encodeURIComponent(KICK_OAUTH_CALLBACK_URL)}&scope=user:read%20chat:write&state=${stateStr}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      window.location.href = authUrl;
    } catch (err) {
      console.error("Kanal bilgileri alınırken hata oluştu:", err);
      alert("Kanal bilgileri alınırken hata oluştu.");
    }
  };

  // --- SAVE BUTTERFLY SETTINGS ---
  const handleSaveButterflySettings = async () => {
    if (butterflyMinTime > butterflyMaxTime) {
      alert("Minimum belirme süresi maksimum süreden büyük olamaz!");
      return;
    }
    await appendIndexedDBLog({
      type: "UPDATE_BUTTERFLY_SETTINGS",
      minTime: butterflyMinTime,
      maxTime: butterflyMaxTime
    });
    alert("Kelebek oyunu ayarları başarıyla güncellendi ve OBS ekranına yansıtıldı!");
  };

  // --- GENERATE URL ---
  const handleGenerateUrl = () => {
    if (!devId || !broadcasterSecret || !channelName || !broadcasterUserId) {
      alert("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    const origin = window.location.origin;
    let baseUrl = origin + '/atla.html';

    // Web sunucusunda panel alt klasördeyse (örn: /panel/ veya /panel/dist/) veya yerel dosya sistemindeysek
    if (origin === 'null' || origin.startsWith('file') || window.location.pathname.includes('/panel')) {
      const pathParts = window.location.pathname.split('/');
      const panelIndex = pathParts.findIndex(part => part === 'panel');
      if (panelIndex !== -1) {
        baseUrl = origin + pathParts.slice(0, panelIndex).join('/') + '/atla.html';
      } else {
        pathParts[pathParts.length - 1] = 'atla.html';
        baseUrl = origin + pathParts.join('/');
      }
    }

    const params = new URLSearchParams();
    params.set('id', devId);
    params.set('secret', broadcasterSecret);
    params.set('channel', channelName);
    params.set('broadcaster_user_id', broadcasterUserId);

    if (authList) params.set('auth', authList);
    if (poolWidth) params.set('poolwidth', poolWidth);
    if (charWidth) params.set('charwidth', charWidth);
    if (gravity) params.set('gravity', gravity);
    if (minAngle) params.set('minaci', minAngle);
    if (maxAngle) params.set('maxaci', maxAngle);
    if (minAccel) params.set('minivme', minAccel);
    if (maxAccel) params.set('maxivme', maxAccel);
    if (speed) params.set('hiz', speed);

    const cVal = charSelect === 'other' ? charNameOther : charSelect;
    if (cVal && cVal !== 'karakter') params.set('char', cVal);

    const tVal = targetSelect === 'other' ? targetNameOther : targetSelect;
    if (tVal && tVal !== 'havuz') params.set('target', tVal);

    const sVal = soundSelect === 'other' ? soundNameOther : soundSelect;
    if (sVal && sVal !== 'vada') params.set('sound', sVal);

    setGeneratedUrl(`${baseUrl}?${params.toString()}`);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- RAFFLE ACTIONS ---
  const handleAddManualParticipant = async (e) => {
    e.preventDefault();
    if (!manualParticipant.trim()) return;
    await appendIndexedDBLog({ type: "RAFFLE_JOIN", user: manualParticipant.trim() });
    setManualParticipant('');
    fetchLogs();
  };

  const handleClearRaffle = async () => {
    await appendIndexedDBLog({ type: "RAFFLE_CLEAR" });
    fetchLogs();
  };

  const handleStartRaffle = () => {
    if (raffleParticipants.length === 0) {
      alert("Çekilişe katılan kimse yok!");
      return;
    }
    
    // Stop accepting new participants
    setRaffleActive(false);
    
    setRolling(true);
    setWinner(null);
    let counter = 0;
    let delay = 30;
    
    const spin = () => {
      const randName = raffleParticipants[Math.floor(Math.random() * raffleParticipants.length)];
      setRollName(randName);
      counter++;

      if (counter > 30) {
        delay += 30;
      }
      if (counter > 40) {
        delay += 80;
      }

      if (delay > 600) {
        // Land on winner
        setRolling(false);
        setWinner(randName);
        sendChatMessage(`🎟️ Çekiliş tamamlandı! Şanslı kazanan: @${randName}! Tebrikler! 🎉`);
        
        // Save to raffle history
        setRaffleHistory(prev => {
          const next = [
            { ts: Date.now(), winner: randName, prize: `Çekiliş Ödülü (Bedel: ${raffleEntryCost} Puan | Seviye: ${raffleMinLevel})` },
            ...prev
          ].slice(0, 20);
          return next;
        });
      } else {
        setTimeout(spin, delay);
      }
    };
    
    setTimeout(spin, delay);
  };

  // --- MODERATOR ACTIONS ---
  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!modUser.trim()) return;
    await appendIndexedDBLog({ type: "RPG_POINT_CHANGE", user: modUser.trim(), amount: parseInt(modPoints) });
    alert(`@${modUser} kullanıcısına ${modPoints} puan verildi!`);
    setModUser('');
    fetchLogs();
  };

  const handleSetHealth = async (e) => {
    e.preventDefault();
    if (!modUser.trim()) return;
    await appendIndexedDBLog({ type: "RPG_HEALTH", user: modUser.trim(), health: parseInt(modHealth) });
    alert(`@${modUser} sağlığı %${modHealth} olarak güncellendi.`);
    setModUser('');
    fetchLogs();
  };

  const handleGiveItem = async (e) => {
    e.preventDefault();
    if (!modUser.trim()) return;
    await appendIndexedDBLog({ type: "RPG_INVENTORY", user: modUser.trim(), item: modItem, action: "ADD" });
    alert(`@${modUser} envanterine '${modItem}' eklendi.`);
    setModUser('');
    fetchLogs();
  };

  // File system handle selection
  const handleSelectLocalFile = async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'paira_wal.log',
        types: [{
          description: 'Log Files',
          accept: { 'text/plain': ['.log'] }
        }]
      });
      if (handle) {
        await storeFileHandleInDB(handle);
        alert("WAL Log dosyası başarıyla seçildi! OBS overlay'i yenilenince bu dosyaya yazmaya başlayacaktır.");
      }
    } catch (e) {
      console.warn("File selection cancelled or failed:", e);
    }
  };

  // Helper mapping for character thumbnails in public directory
  const getCharPreviewSrc = (val) => {
    if (val === 'karakter') return '/karakter.png';
    if (val === 'askersincap') return '/askersincap.png';
    if (val === 'askerkedy') return '/askerkedy.png';
    if (val === 'steve') return '/steve.png';
    if (val === 'civciv') return '/civciv.png';
    if (val === 'papagan') return '/papagan.png';
    if (val === 'peri') return '/peri.png';
    if (val === 'other') return null;
    return `/${val}.png`;
  };

  const getTargetPreviewSrc = (val) => {
    if (val === 'havuz') return '/havuz.png';
    if (val === 'bulut') return '/bulut.png';
    if (val === 'trambolin') return '/trambolin.png';
    if (val === 'other') return null;
    return `/${val}.png`;
  };


  const isAdmin = ['pairaaa', 'otonomus', 'ahmetefe', 'ahmetefeyasar'].includes(devId.toLowerCase().trim());

  return (
    <div>
      <header className="panel-header">
        <div className="logo-container">
          <img src="/main_logo.avif" alt="Paira Games" className="logo-img" />
          <div className="logo-section">
            <h1 className="no-icon">Paira Atla</h1>
            <p>Yayıncı Kontrol Paneli & Chat Entegrasyonu</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            OBS Yapılandırma
          </button>
          <button 
            className={`nav-tab ${activeTab === 'raffle' ? 'active' : ''}`}
            onClick={() => setActiveTab('raffle')}
          >
            🎟️ Çekiliş Motoru
          </button>
          <button 
            className={`nav-tab ${activeTab === 'economy' ? 'active' : ''}`}
            onClick={() => setActiveTab('economy')}
          >
            👤 Oyuncu Listesi & Mod
          </button>
          <button 
            className={`nav-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('marketplace')}
          >
            🧩 Eklenti Pazarı
          </button>
        </nav>
      </header>

      <main style={{ marginTop: '24px' }}>
        {activeTab === 'config' && (
          <div className="panel-card">
            
            {/* Quick connection status indicator */}
            {devId && broadcasterSecret ? (
              <div className="connect-status-badge">
                <div className="connect-dot"></div>
                <div className="connect-text">
                  Kanal Bağlantısı Aktif: <strong>@{devId}</strong>. Tekrar yetkilendirmeniz gerekmez, doğrudan kullanabilirsiniz.
                </div>
                <span className="badge badge-primary">BAĞLI</span>
              </div>
            ) : (
              <div className="connect-status-badge disconnected">
                <div className="connect-dot"></div>
                <div className="connect-text">
                  Henüz bir Kick kanalı yetkilendirilmedi. OBS üzerinden chat verilerini almak için lütfen aşağıdaki butondan giriş yapın.
                </div>
                <span className="badge badge-info">BEKLİYOR</span>
              </div>
            )}

            <h2 className="card-title">1. Adım: Kick & AWS Yetkilendirme</h2>
            <div className="form-grid" style={{ marginBottom: '32px' }}>
              <div className="form-group">
                <label>Kanal Adınız</label>
                <input 
                  type="text" 
                  value={devId} 
                  onChange={(e) => {
                    setDevId(e.target.value);
                    setChannelName(e.target.value);
                  }}
                  placeholder="Örn: pairaaa" 
                />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end', paddingBottom: '4px' }}>
                <button className="btn btn-primary" onClick={handleKickConnect} style={{ height: '48px' }}>
                  🔑 Kick İle Yetkilendir (OAuth)
                </button>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: '24px' }}>
              <div className="form-group">
                <label>Chatroom ID (buid)</label>
                <input type="text" value={broadcasterUserId} readOnly placeholder="Otomatik doldurulur" />
              </div>
              <div className="form-group">
                <label>Gizli Anahtar (Secret)</label>
                <input type="password" value={broadcasterSecret} readOnly placeholder="Otomatik doldurulur" />
              </div>
            </div>

            <h2 className="card-title" style={{ marginTop: '40px' }}>2. Adım: Görsel ve Fizik Ayarları</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Genişlik (PoolWidth)</label>
                <input type="number" value={poolWidth} onChange={(e) => setPoolWidth(e.target.value)} placeholder="300" />
              </div>
              <div className="form-group">
                <label>Karakter Boyutu (CharWidth)</label>
                <input type="number" value={charWidth} onChange={(e) => setCharWidth(e.target.value)} placeholder="120" />
              </div>
              <div className="form-group">
                <label>Yetkili Listesi (Virgülle Ayırın)</label>
                <input type="text" value={authList} onChange={(e) => setAuthList(e.target.value)} placeholder="mod1,mod2" />
              </div>
            </div>

            <h3 className="card-subtitle" style={{ marginTop: '24px', fontSize: '15px', color: 'var(--text-h)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ Gelişmiş Uçuş Fizik Ayarları (Süzülme Kontrolü)</h3>
            <div className="form-grid" style={{ marginTop: '12px', gap: '20px' }}>
              <div className="form-group">
                <label>Yer Çekimi (Dikey İvme)</label>
                <input type="number" step="0.005" min="0.001" max="0.5" value={gravity} onChange={(e) => setGravity(e.target.value)} placeholder="0.025" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Düşüş hızı. Düşük değerler karakterlerin daha çok süzülmesini sağlar. (Örn: 0.025)</span>
              </div>
              <div className="form-group">
                <label>Temel Atlama Hızı</label>
                <input type="number" step="0.5" min="0.5" max="20" value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder="4" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Karakterin başlangıç fırlatılma hızı. (Örn: 4)</span>
              </div>
              <div className="form-group">
                <label>Atlama Açısı (Min / Max Derece)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" value={minAngle} onChange={(e) => setMinAngle(e.target.value)} placeholder="25" title="Minimum Açı" style={{ flex: 1 }} />
                  <input type="number" value={maxAngle} onChange={(e) => setMaxAngle(e.target.value)} placeholder="55" title="Maksimum Açı" style={{ flex: 1 }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Derece cinsinden fırlatma açıları (Örn: 25 - 55).</span>
              </div>
              <div className="form-group">
                <label>Yatay İvmelenme (Min / Max)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" step="0.005" value={minAccel} onChange={(e) => setMinAccel(e.target.value)} placeholder="0.01" title="Minimum Yatay İvme" style={{ flex: 1 }} />
                  <input type="number" step="0.005" value={maxAccel} onChange={(e) => setMaxAccel(e.target.value)} placeholder="0.03" title="Maksimum Yatay İvme" style={{ flex: 1 }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Karakterin havada yatay ivmelenme miktarı (Örn: 0.01 - 0.03).</span>
              </div>
            </div>


            <div className="form-grid" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Karakter Seçimi</label>
                <div className="visual-selector-grid">
                  {[
                    { val: 'karakter', label: 'Kedy' },
                    { val: 'askersincap', label: 'Sincap' },
                    { val: 'askerkedy', label: 'A. Kedi' },
                    { val: 'steve', label: 'Steve' },
                    { val: 'civciv', label: 'Civciv' },
                    { val: 'papagan', label: 'Papağan' },
                    { val: 'peri', label: 'Peri' },
                    { val: 'other', label: 'Özel' }
                  ].map(item => (
                    <div 
                      key={item.val} 
                      className={`visual-selector-item ${charSelect === item.val ? 'active' : ''}`}
                      onClick={() => setCharSelect(item.val)}
                      title={item.label}
                    >
                      {item.val !== 'other' ? (
                        <img src={getCharPreviewSrc(item.val)} alt={item.label} onError={(e) => e.target.style.display = 'none'} />
                      ) : (
                        <div className="sound-icon">📁</div>
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                {charSelect === 'other' && (
                  <div style={{ marginTop: '12px' }}>
                    <input 
                      type="text" 
                      value={charNameOther} 
                      onChange={(e) => setCharNameOther(e.target.value)} 
                      placeholder="Görsel dosya adı girin (örn: custom.png)" 
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Hedef Seçimi</label>
                <div className="visual-selector-grid">
                  {[
                    { val: 'havuz', label: 'Havuz' },
                    { val: 'bulut', label: 'Bulut' },
                    { val: 'trambolin', label: 'Trambolin' },
                    { val: 'other', label: 'Özel' }
                  ].map(item => (
                    <div 
                      key={item.val} 
                      className={`visual-selector-item ${targetSelect === item.val ? 'active' : ''}`}
                      onClick={() => setTargetSelect(item.val)}
                      title={item.label}
                    >
                      {item.val !== 'other' ? (
                        <img src={getTargetPreviewSrc(item.val)} alt={item.label} onError={(e) => e.target.style.display = 'none'} />
                      ) : (
                        <div className="sound-icon">📁</div>
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                {targetSelect === 'other' && (
                  <div style={{ marginTop: '12px' }}>
                    <input 
                      type="text" 
                      value={targetNameOther} 
                      onChange={(e) => setTargetNameOther(e.target.value)} 
                      placeholder="Hedef dosya adı girin (örn: custom_pool.png)" 
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Atlama Sesi</label>
                <div className="visual-selector-grid">
                  {[
                    { val: 'vada', label: 'Vada', icon: '🔊' },
                    { val: 'selcuk', label: 'Selçuk', icon: '🔊' },
                    { val: 'other', label: 'Özel', icon: '🎵' }
                  ].map(item => (
                    <div 
                      key={item.val} 
                      className={`visual-selector-item ${soundSelect === item.val ? 'active' : ''}`}
                      onClick={() => setSoundSelect(item.val)}
                      title={item.label}
                    >
                      <div className="sound-icon">{item.icon}</div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                {soundSelect === 'other' && (
                  <div style={{ marginTop: '12px' }}>
                    <input 
                      type="text" 
                      value={soundNameOther} 
                      onChange={(e) => setSoundNameOther(e.target.value)} 
                      placeholder="Ses dosya adı girin (örn: custom.mp3)" 
                    />
                  </div>
                )}
              </div>
            </div>

            <h2 className="card-title" style={{ marginTop: '40px' }}>3. Adım: Lokal WAL Dosya Kaydı (İsteğe Bağlı)</h2>
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.6' }}>
                Verilerinizin masaüstünüzde <code>paira_wal.log</code> dosyasına canlı olarak yazılmasını istiyorsanız bir kereye mahsus dosya konumu belirleyebilirsiniz:
              </p>
              <button className="btn btn-secondary" onClick={handleSelectLocalFile}>
                📁 Log Dosyası Konumu Seç
              </button>
            </div>

            <h2 className="card-title" style={{ marginTop: '40px' }}>4. Adım: Kelebek Oyunu Ayarları 🦋</h2>
            <div className="form-grid" style={{ marginBottom: '32px' }}>
              <div className="form-group">
                <label>Minimum Belirme Süresi (Dakika)</label>
                <input 
                  type="number" 
                  min="1"
                  value={butterflyMinTime} 
                  onChange={(e) => setButterflyMinTime(Math.max(1, parseInt(e.target.value) || 1))} 
                />
              </div>
              <div className="form-group">
                <label>Maksimum Belirme Süresi (Dakika)</label>
                <input 
                  type="number" 
                  min="1"
                  value={butterflyMaxTime} 
                  onChange={(e) => setButterflyMaxTime(Math.max(1, parseInt(e.target.value) || 1))} 
                />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end', paddingBottom: '4px' }}>
                <button className="btn btn-secondary" onClick={handleSaveButterflySettings} style={{ height: '48px' }}>
                  💾 Ayarları Kaydet
                </button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleGenerateUrl} style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
              🔗 OBS Tarayıcı URL'si Oluştur
            </button>

            {generatedUrl && (
              <div style={{ marginTop: '32px', animation: 'fadeIn 0.4s ease' }}>
                <div className="flex-row">
                  <label style={{ fontWeight: '700', fontSize: '14px', color: 'var(--lilac)' }}>Oluşturulan OBS Overlay Linki:</label>
                  <button className="btn btn-success" onClick={handleCopyToClipboard} style={{ padding: '6px 16px', fontSize: '12px' }}>
                    {copied ? 'Kopyalandı!' : '📋 Kopyala'}
                  </button>
                </div>
                <textarea className="output-textarea" value={generatedUrl} readOnly />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  * Bu linki OBS veya Streamlabs programında bir <strong>Tarayıcı Kaynağı (Browser Source)</strong> ekleyerek kullanın.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'raffle' && (
          <div>
            {!broadcasterUserId && (
              <div className="connect-status-badge disconnected" style={{ marginBottom: '24px', animation: 'fadeIn 0.4s ease' }}>
                <div className="connect-dot"></div>
                <div className="connect-text">
                  <strong>Kick Bağlantısı Yok:</strong> Chat üzerinden <code>!katıl</code> yazan izleyicilerin çekilişe otomatik eklenebilmesi için önce <strong>OBS Yapılandırma</strong> sekmesinden Kick hesabınızı bağlamalısınız. Şu an sadece manuel katılımcı ekleyebilirsiniz.
                </div>
              </div>
            )}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <h2 className="card-title">🎟️ Çekiliş Ayarları & Kontrol Paneli</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Katılım Bilet Ücreti (Puan)</label>
                  <input 
                    type="number" 
                    value={raffleEntryCost} 
                    onChange={(e) => setRaffleEntryCost(Math.max(0, parseInt(e.target.value) || 0))} 
                    placeholder="0" 
                    disabled={rolling}
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Seviye Şartı</label>
                  <input 
                    type="number" 
                    value={raffleMinLevel} 
                    onChange={(e) => setRaffleMinLevel(Math.max(1, parseInt(e.target.value) || 1))} 
                    placeholder="1" 
                    disabled={rolling}
                  />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end', paddingBottom: '4px' }}>
                  <button 
                    className={`btn ${raffleActive ? 'btn-danger' : 'btn-success'}`} 
                    disabled={rolling}
                    onClick={() => {
                      const nextState = !raffleActive;
                      setRaffleActive(nextState);
                      if (nextState) {
                        sendChatMessage(`🎟️ ÇEKİLİŞ BAŞLADI! Katılmak için chat'e '!katıl' yazın! Bilet: ${raffleEntryCost} Puan | Min Seviye: ${raffleMinLevel}`);
                      } else {
                        sendChatMessage(`🎟️ Çekiliş katılımları kapatıldı. Kazanan birazdan belirlenecek!`);
                      }
                    }}
                    style={{ height: '48px', width: '100%' }}
                  >
                    {raffleActive ? '🛑 Katılımları Kapat' : '🟢 Katılımları Başlat (Chat WebSocket)'}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '14px', fontSize: '13px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span>Durum:</span>
                <span className={`badge ${raffleActive ? 'badge-primary' : 'badge-info'}`}>
                  {raffleActive ? '🔴 KATILIMLAR AÇIK (!katıl)' : '⚪ KATILIMLAR KAPALI'}
                </span>
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="panel-card">
                <h2 className="card-title">Çekiliş Çarkı</h2>
                <div className="slot-machine-container">
                  <div className="slot-window">
                    <div className={`slot-name ${rolling ? 'rolling' : ''}`}>{rollName}</div>
                  </div>
                  
                  {!rolling && winner && (
                    <div className="winner-announce">
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>🎉 Tebrikler Kazanan!</p>
                      <div className="winner-name">@{winner}</div>
                    </div>
                  )}

                  <button 
                    className="btn btn-primary" 
                    onClick={handleStartRaffle} 
                    disabled={rolling || raffleParticipants.length === 0}
                    style={{ marginTop: '28px', width: '100%', padding: '14px' }}
                  >
                    {rolling ? 'Çark Dönüyor...' : 'Çekilişi Başlat 🚀'}
                  </button>
                </div>
              </div>

              <div className="panel-card">
                <h2 className="card-title">Katılımcı Listesi ({raffleParticipants.length})</h2>
                <form onSubmit={handleAddManualParticipant} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input 
                    type="text" 
                    value={manualParticipant}
                    onChange={(e) => setManualParticipant(e.target.value)}
                    placeholder="İzleyici kullanıcı adı..." 
                    style={{ flex: '1', margin: '0' }}
                    disabled={rolling}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ margin: '0' }} disabled={rolling}>Ekle</button>
                </form>

                <div className="participant-list-box" style={{ minHeight: '140px' }}>
                  {raffleParticipants.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
                      Henüz katılımcı yok. Chat'ten <code>!katıl</code> yazanlar otomatik olarak bu listede görünür.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {raffleParticipants.map((user, idx) => (
                        <span key={idx} className="badge badge-primary">
                          @{user}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button className="btn btn-danger" onClick={handleClearRaffle} style={{ marginTop: '20px', width: '100%' }} disabled={rolling}>
                  🗑️ Katılımcıları Temizle
                </button>
              </div>
            </div>

            <div className="panel-card" style={{ marginTop: '24px' }}>
              <h2 className="card-title">🏆 Çekiliş Geçmişi</h2>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Kazanan</th>
                      <th>Detay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffleHistory.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                          Henüz çekiliş geçmişi bulunmamaktadır.
                        </td>
                      </tr>
                    ) : (
                      raffleHistory.map((item, idx) => (
                        <tr key={idx}>
                          <td>{new Date(item.ts).toLocaleString()}</td>
                          <td style={{ fontWeight: '700', color: '#fff' }}>@{item.winner}</td>
                          <td style={{ color: 'var(--lilac)' }}>{item.prize}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'economy' && (
          <div className="grid-cols-2">
            <div className="panel-card" style={{ gridColumn: 'span 2' }}>
              <h2 className="card-title">Kanal Skor ve RPG Sıralaması</h2>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Kullanıcı</th>
                      <th>Puan</th>
                      <th>Seviye</th>
                      <th>Sağlık</th>
                      <th>Envanter</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(rpgProfiles).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          Henüz hiçbir oyuncu verisi kaydedilmedi.
                        </td>
                      </tr>
                    ) : (
                      Object.values(rpgProfiles)
                        .sort((a, b) => (b.seviye * 100 + b.puan) - (a.seviye * 100 + a.puan))
                        .map((profile, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '700', color: '#fff' }}>@{profile.username}</td>
                            <td style={{ color: '#00e5ff', fontWeight: '600' }}>{profile.puan} XP</td>
                            <td>
                              <span className="badge badge-primary">Lv. {profile.seviye}</span>
                            </td>
                            <td>
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: profile.health > 50 ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                                  color: profile.health > 50 ? 'var(--success)' : 'var(--danger)',
                                  border: profile.health > 50 ? '1px solid rgba(46, 204, 113, 0.25)' : '1px solid rgba(231, 76, 60, 0.25)'
                                }}
                              >
                                %{profile.health}
                              </span>
                            </td>
                            <td>
                              {profile.envanter.length > 0 ? (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {profile.envanter.map((item, i) => (
                                    <span key={i} className="badge badge-info">{item}</span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Boş</span>
                              )}
                              {profile.kelebekler && (
                                 profile.kelebekler.yesil > 0 || 
                                 profile.kelebekler.gumus > 0 || 
                                 profile.kelebekler.mavi > 0 || 
                                 profile.kelebekler.mor > 0 || 
                                 profile.kelebekler.kirmizi > 0 || 
                                 profile.kelebekler.altin > 0 || 
                                 profile.kelebekler.kozmik > 0
                               ) && (
                                 <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                                   <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🦋:</span>
                                   {profile.kelebekler.yesil > 0 && <span className="badge" style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '2px 6px', fontSize: '11px', margin: '0' }}>🟢 {profile.kelebekler.yesil}</span>}
                                   {profile.kelebekler.gumus > 0 && <span className="badge" style={{ backgroundColor: 'rgba(189, 195, 199, 0.15)', color: '#bdc3c7', border: '1px solid rgba(189, 195, 199, 0.3)', padding: '2px 6px', fontSize: '11px', margin: '0' }}>⚪ {profile.kelebekler.gumus}</span>}
                                   {profile.kelebekler.mavi > 0 && <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)', padding: '2px 6px', fontSize: '11px', margin: '0' }}>🔵 {profile.kelebekler.mavi}</span>}
                                   {profile.kelebekler.mor > 0 && <span className="badge" style={{ backgroundColor: 'rgba(178, 102, 255, 0.15)', color: '#b266ff', border: '1px solid rgba(178, 102, 255, 0.3)', padding: '2px 6px', fontSize: '11px', margin: '0' }}>🟣 {profile.kelebekler.mor}</span>}
                                   {profile.kelebekler.kirmizi > 0 && <span className="badge" style={{ backgroundColor: 'rgba(255, 42, 42, 0.15)', color: '#ff2a2a', border: '1px solid rgba(255, 42, 42, 0.3)', padding: '2px 6px', fontSize: '11px', margin: '0' }}>🔴 {profile.kelebekler.kirmizi}</span>}
                                   {profile.kelebekler.altin > 0 && <span className="badge" style={{ backgroundColor: 'rgba(241, 196, 15, 0.15)', color: '#f1c40f', border: '1px solid rgba(241, 196, 15, 0.3)', padding: '2px 6px', fontSize: '11px', margin: '0' }}>🟡 {profile.kelebekler.altin}</span>}
                                   {profile.kelebekler.kozmik > 0 && <span className="badge" style={{ backgroundColor: 'rgba(230, 126, 34, 0.15)', color: '#e67e22', border: '1px solid rgba(230, 126, 34, 0.3)', padding: '2px 6px', fontSize: '11px', margin: '0' }}>🌈 {profile.kelebekler.kozmik}</span>}
                                   {profile.kelebekler.kozmik > 0 && <span title="Kozmik Avcı Başarımı!" style={{ cursor: 'help', fontSize: '14px' }}>🏆</span>}
                                 </div>
                               )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '12px', margin: '0' }}
                                onClick={() => setModUser(profile.username)}
                              >
                                ⚙️ Düzenle
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel-card">
              <h2 className="card-title">Hızlı Moderasyon Panel</h2>
              <form onSubmit={handleAwardPoints} style={{ marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Hedef Kullanıcı</label>
                  <input type="text" value={modUser} onChange={(e) => setModUser(e.target.value)} placeholder="Kullanıcı adı..." required />
                </div>
                <div className="form-group">
                  <label>Puan Miktarı (+/-)</label>
                  <input type="number" value={modPoints} onChange={(e) => setModPoints(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', margin: '0' }}>Puan Ekle / Çıkar</button>
              </form>

              <form onSubmit={handleSetHealth} style={{ marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Sağlık Değeri (%0 - %100)</label>
                  <input type="number" value={modHealth} onChange={(e) => setModHealth(e.target.value)} min="0" max="100" required />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ width: '100%', margin: '0' }}>Sağlık Durumu Belirle</button>
              </form>

              <form onSubmit={handleGiveItem}>
                <div className="form-group">
                  <label>Verilecek Eşya</label>
                  <select value={modItem} onChange={(e) => setModItem(e.target.value)}>
                    <option value="Yüzük">Yüzük</option>
                    <option value="Çiçek">Çiçek</option>
                    <option value="Madalya">Madalya</option>
                    <option value="Kalp">Kalp</option>
                    <option value="Yıldız">Yıldız</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-success" style={{ width: '100%', margin: '0' }}>Eşya Ver</button>
              </form>
            </div>

            <div className="panel-card">
              <h2 className="card-title">Canlı Etkinlik Günlüğü (WAL)</h2>
              <div className="log-box">
                {logs.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>Henüz aktivite günlüğü bulunmamaktadır.</p>
                ) : (
                  [...logs].reverse().slice(0, 25).map((log, idx) => {
                    let text = '';
                    let emoji = '⚡';
                    let logColor = 'var(--text-main)';
                    if (log.type === "SCORE") {
                      text = `@${log.user} hedefe ulaştı!`;
                      emoji = '🎯';
                      logColor = '#00e5ff';
                    } else if (log.type === "RPG_POINT_CHANGE") {
                      text = `@${log.user} ${log.amount > 0 ? '+' : ''}${log.amount} Puan aldı.`;
                      emoji = '⭐';
                      logColor = 'var(--success)';
                    } else if (log.type === "RPG_INVENTORY") {
                      text = `@${log.user}: Eşya ${log.action === 'ADD' ? 'Eklendi' : 'Çıkarıldı'} -> ${log.item}`;
                      emoji = '🎒';
                      logColor = '#f59e0b';
                    } else if (log.type === "RPG_HEALTH") {
                      text = `@${log.user} Sağlık: %${log.health}`;
                      emoji = '❤️';
                      logColor = 'var(--danger)';
                    } else if (log.type === "RAFFLE_JOIN") {
                      text = `@${log.user} çekilişe katıldı.`;
                      emoji = '🎟️';
                      logColor = 'var(--neon-purple)';
                    }
                    return (
                      <div key={idx} className="log-entry" style={{ color: logColor }}>
                        <span>{emoji}</span>
                        <span>{text}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="fade-in">
            {!broadcasterSecret && (
              <div className="connect-status-badge disconnected" style={{ marginBottom: '24px', animation: 'fadeIn 0.4s ease' }}>
                <div className="connect-dot"></div>
                <div className="connect-text">
                  <strong>Pazar Yeri Sınırlı Erişim:</strong> Pazar yerini inceleyebilirsiniz ancak yeni karakter görünümleri göndermek, bunları kanalınızda aktif/pasif hale getirmek veya eklenti kurmak için önce <strong>OBS Yapılandırma</strong> sekmesinden Kick hesabınızı bağlamalısınız.
                </div>
              </div>
            )}

            {/* Top Info Banner */}
            <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 className="card-title" style={{ marginBottom: '8px' }}>
                🧩 Eklenti & Pazar Yeri Sistemi
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                PairaBot modüler mimarisini buradan yönetebilirsiniz. Aktif oyun eklentilerini açıp kapatabilir, 
                geliştirici tasarımı görünümleri/widget'ları OBS overlay ekranınıza anında kurabilirsiniz.
              </p>
            </div>

            {/* Category Switch Tabs */}
            <div className="nav-subtabs">
              <button
                className={`nav-subtab ${marketSubTab === 'eklentiler' ? 'active' : ''}`}
                onClick={() => setMarketSubTab('eklentiler')}
              >
                🔌 Eklentiler & Komutlar
              </button>
              <button
                className={`nav-subtab ${marketSubTab === 'skins' ? 'active' : ''}`}
                onClick={() => setMarketSubTab('skins')}
              >
                🎨 Karakter Görünümleri
              </button>
              <button
                className={`nav-subtab ${marketSubTab === 'widget' ? 'active' : ''}`}
                onClick={() => setMarketSubTab('widget')}
              >
                📺 Widget & Temalar
              </button>
              <button
                className={`nav-subtab ${marketSubTab === 'developer' ? 'active' : ''}`}
                onClick={() => setMarketSubTab('developer')}
              >
                💻 Geliştirici SDK
              </button>
              {isAdmin && (
                <button
                  className={`nav-subtab ${marketSubTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setMarketSubTab('admin')}
                >
                  🔑 Yönetici Paneli
                </button>
              )}
            </div>

            {/* Sub-tab: Eklentiler & Komutlar */}
            {marketSubTab === 'eklentiler' && (
              <div className="fade-in">
                {/* Plugins Toggle Grid */}
                <div className="panel-card" style={{ marginBottom: '24px' }}>
                  <h2 className="card-title">🔌 Aktif Eklentiler</h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginTop: '12px'
                  }}>
                    {/* Kelebek Oyunu Card */}
                    <div style={{
                      background: 'var(--card-bg)',
                      border: 'var(--glass-border)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      boxShadow: 'var(--glass-shadow)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '28px' }}>🦋</span>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)' }}>Kelebek Oyunu</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          Ekranda uçuşan rengarenk kelebekleri yakalama, ticaret (!takas), envanter (!kelebekenvanter) ve kozmik birleştirme oyunu.
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: activePlugins.butterfly ? 'var(--success)' : 'var(--danger)',
                          background: activePlugins.butterfly ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {activePlugins.butterfly ? '● AKTİF' : '○ DEVRE DIŞI'}
                        </span>
                        <button
                          className={`btn ${activePlugins.butterfly ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '8px 16px', fontSize: '13px', height: '36px', borderRadius: '8px' }}
                          onClick={async () => {
                            await appendIndexedDBLog({
                              type: "TOGGLE_PLUGIN",
                              pluginId: "butterfly",
                              enabled: !activePlugins.butterfly
                            });
                          }}
                        >
                          {activePlugins.butterfly ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                        </button>
                      </div>
                    </div>

                    {/* Blackjack Casino Card */}
                    <div style={{
                      background: 'var(--card-bg)',
                      border: 'var(--glass-border)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      boxShadow: 'var(--glass-shadow)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '28px' }}>🃏</span>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)' }}>Blackjack Casino</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          İzleyicilerinizin yayın puanları ile krupiyeye karşı blackjack oynayabileceği eğlenceli kart ve bahis simülasyonu.
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: activePlugins.blackjack ? 'var(--success)' : 'var(--danger)',
                          background: activePlugins.blackjack ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {activePlugins.blackjack ? '● AKTİF' : '○ DEVRE DIŞI'}
                        </span>
                        <button
                          className={`btn ${activePlugins.blackjack ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '8px 16px', fontSize: '13px', height: '36px', borderRadius: '8px' }}
                          onClick={async () => {
                            await appendIndexedDBLog({
                              type: "TOGGLE_PLUGIN",
                              pluginId: "blackjack",
                              enabled: !activePlugins.blackjack
                            });
                          }}
                        >
                          {activePlugins.blackjack ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                        </button>
                      </div>
                    </div>

                    {/* Banka Soygunu Card */}
                    <div style={{
                      background: 'var(--card-bg)',
                      border: 'var(--glass-border)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      boxShadow: 'var(--glass-shadow)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '28px' }}>🏦</span>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)' }}>Banka Soygunu</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          İzleyicilerin toplu olarak katılabileceği, can ve seviye risklerine göre puan kazandıkları (!soygun) rpg mini oyunu.
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: activePlugins.robbery ? 'var(--success)' : 'var(--danger)',
                          background: activePlugins.robbery ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {activePlugins.robbery ? '● AKTİF' : '○ DEVRE DIŞI'}
                        </span>
                        <button
                          className={`btn ${activePlugins.robbery ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '8px 16px', fontSize: '13px', height: '36px', borderRadius: '8px' }}
                          onClick={async () => {
                            await appendIndexedDBLog({
                              type: "TOGGLE_PLUGIN",
                              pluginId: "robbery",
                              enabled: !activePlugins.robbery
                            });
                          }}
                        >
                          {activePlugins.robbery ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                        </button>
                      </div>
                    </div>

                    {/* Trivia Card */}
                    <div style={{
                      background: 'var(--card-bg)',
                      border: 'var(--glass-border)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      boxShadow: 'var(--glass-shadow)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '28px' }}>📚</span>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)' }}>Trivia & Kelime Oyunları</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          Chat'te rastgele kelime karıştırma veya genel kültür soruları göndererek izleyicileri yarıştıran soru motoru.
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: activePlugins.trivia ? 'var(--success)' : 'var(--danger)',
                          background: activePlugins.trivia ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {activePlugins.trivia ? '● AKTİF' : '○ DEVRE DIŞI'}
                        </span>
                        <button
                          className={`btn ${activePlugins.trivia ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '8px 16px', fontSize: '13px', height: '36px', borderRadius: '8px' }}
                          onClick={async () => {
                            await appendIndexedDBLog({
                              type: "TOGGLE_PLUGIN",
                              pluginId: "trivia",
                              enabled: !activePlugins.trivia
                            });
                          }}
                        >
                          {activePlugins.trivia ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Commands Grid */}
                <div className="grid-cols-2">
                  {/* Custom Command Creator */}
                  <div className="panel-card">
                    <h2 className="card-title">💬 Yeni Özel Komut Ekle</h2>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!customCmdName.trim() || !customCmdResponse.trim()) {
                          alert("Lütfen komut adı ve yanıt alanlarını doldurun!");
                          return;
                        }
                        const rawName = customCmdName.trim().toLowerCase();
                        const finalName = rawName.startsWith('!') ? rawName : '!' + rawName;

                        await appendIndexedDBLog({
                          type: "CREATE_CUSTOM_COMMAND",
                          name: finalName,
                          response: customCmdResponse.trim()
                        });

                        // Clear fields
                        setCustomCmdName('');
                        setCustomCmdResponse('');
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Komut Tetikleyicisi (Örn: !discord)</label>
                        <input
                          type="text"
                          value={customCmdName}
                          onChange={(e) => setCustomCmdName(e.target.value)}
                          placeholder="!discord veya discord"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Botun Yanıtı (Metin veya Link)</label>
                        <input
                          type="text"
                          value={customCmdResponse}
                          onChange={(e) => setCustomCmdResponse(e.target.value)}
                          placeholder="Discord sunucumuza katılın: discord.gg/pairabot"
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', margin: '8px 0 0 0' }}>
                        ➕ Komut Oluştur
                      </button>
                    </form>
                  </div>

                  {/* Custom Commands Table */}
                  <div className="panel-card">
                    <h2 className="card-title">📋 Mevcut Özel Komutlar ({customCommands.length})</h2>
                    {customCommands.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '40px 0',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '12px',
                        border: 'var(--glass-border)'
                      }}>
                        Henüz özel bir komut oluşturulmadı. Soldaki formdan ilk özel komutunuzu tanımlayabilirsiniz.
                      </div>
                    ) : (
                      <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        <table className="premium-table">
                          <thead>
                            <tr>
                              <th>Komut</th>
                              <th>Yanıt</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>İşlem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customCommands.map((cmd, idx) => (
                              <tr key={idx}>
                                <td style={{ color: 'var(--lilac)', fontWeight: '600' }}>{cmd.name}</td>
                                <td style={{
                                  maxWidth: '180px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }} title={cmd.response}>
                                  {cmd.response}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    className="btn btn-danger"
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '11px',
                                      height: '28px',
                                      borderRadius: '6px'
                                    }}
                                    onClick={async () => {
                                      if (confirm(`${cmd.name} komutunu silmek istediğinize emin misiniz?`)) {
                                        await appendIndexedDBLog({
                                          type: "DELETE_CUSTOM_COMMAND",
                                          name: cmd.name
                                        });
                                      }
                                    }}
                                  >
                                    Sil
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: Karakter Görünümleri (Skins) */}
            {marketSubTab === 'skins' && (
              <div className="panel-card fade-in">
                <h2 className="card-title">🎨 Kanal Karakter Görünümleri (Skins)</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                  İzleyicilerinizin chat'te kazandıkları puanlarla satın alabilecekleri karakter görünümleri. 
                  Görünümler, oyuncuların <code>!atla</code> animasyonlarında avatar olarak gösterilir.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px'
                }}>
                  {globalMarketItems.filter(i => i.type === 'skin' && i.status === 'approved').map((skin) => (
                    <div key={skin.id} style={{
                      background: 'var(--card-bg)',
                      border: 'var(--glass-border)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'center',
                      boxShadow: 'var(--glass-shadow)',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: '90px',
                        height: '90px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                        position: 'relative',
                        fontSize: '32px'
                      }}>
                        <span style={{ position: 'absolute' }}>🎭</span>
                        <img 
                          src={skin.file ? `/${skin.file}` : `/${skin.name.toLowerCase()}.png`} 
                          alt={skin.name} 
                          style={{ width: '80%', height: '80%', objectFit: 'contain', zIndex: 1, position: 'relative' }} 
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }} 
                        />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--lilac)' }}>{skin.name}</h3>
                        <span style={{ fontSize: '12px', color: '#ffb020', fontWeight: '600' }}>💰 {skin.price} Puan</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {skin.desc || skin.content || `${skin.name} özel topluluk görünümü.`}
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--lilac-muted)', fontWeight: '600' }}>
                        👤 Geliştirici: @{skin.developer || 'System'}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-main)',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        width: '100%',
                        fontWeight: '500'
                      }}>
                        Satın Alma: <code>!market {skin.id}</code>
                      </div>
                      
                      <button
                        className={`btn ${disabledMarketItems.has(String(skin.id)) ? 'btn-danger' : 'btn-success'}`}
                        style={{ width: '100%', height: '32px', fontSize: '11px', padding: 0, marginTop: '8px', borderRadius: '8px' }}
                        onClick={async () => {
                          const isCurrentlyDisabled = disabledMarketItems.has(String(skin.id));
                          await appendIndexedDBLog({
                            type: "TOGGLE_MARKET_ITEM",
                            itemId: String(skin.id),
                            enabled: isCurrentlyDisabled
                          });
                        }}
                      >
                        {disabledMarketItems.has(String(skin.id)) ? '❌ Kanalda Devre Dışı' : '✅ Kanalda Aktif'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab: Widget & Temalar */}
            {marketSubTab === 'widget' && (
              <div className="panel-card fade-in">
                <h2 className="card-title">📺 Widget & Ekran Temaları</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                  OBS overlay ekranınızın görsel tasarımlarını ve widget'larını buradan değiştirebilirsiniz. 
                  Seçtiğiniz temalar veya widget'lar anında OBS ekranınızda aktif edilir.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Cyber alert widget card */}
                  <div style={{
                    background: 'var(--card-bg)',
                    border: 'var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: 'var(--glass-shadow)',
                    position: 'relative'
                  }}>
                    {activeWidget === 'cyber_alert' && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>AKTİF</div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📺</span> Neon Cyberpunk Uyarı Kutusu
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                        Kelebek yakalandığında veya oyuncular gol attığında OBS ekranında parıldayan neon animasyonlu bir bildirim penceresi gösterir.
                      </p>
                    </div>
                    <button
                      className={`btn ${activeWidget === 'cyber_alert' ? 'btn-danger' : 'btn-primary'}`}
                      style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                      onClick={async () => {
                        if (activeWidget === 'cyber_alert') {
                          await appendIndexedDBLog({
                            type: "INSTALL_MARKET_ITEM",
                            itemId: null,
                            itemType: "widget",
                            config: null
                          });
                        } else {
                          await appendIndexedDBLog({
                            type: "INSTALL_MARKET_ITEM",
                            itemId: "cyber_alert",
                            itemType: "widget",
                            config: {
                              html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'Consolas', monospace; background: transparent; }
    #alert { background: rgba(5, 5, 10, 0.95); color: #00f0ff; border: 3px solid #ff007f; padding: 25px 45px; border-radius: 4px; box-shadow: 0 0 30px #ff007f, inset 0 0 15px rgba(255,0,127,0.5); font-size: 26px; font-weight: 900; text-transform: uppercase; text-shadow: 0 0 10px #00f0ff; transform: rotate(-3deg) scale(0); transition: transform 0.4s cubic-bezier(0.85, 0, 0.15, 1); letter-spacing: 2px; }
    #alert.active { transform: rotate(-3deg) scale(1); }
  </style>
</head>
<body>
  <div id="alert">⚡ SYSTEM BOOTED ⚡</div>
  <script>
    window.addEventListener('message', (e) => {
      const data = e.data;
      if (data.event === 'wal') {
        const payload = data.payload;
        if (payload.type === 'SCORE') {
          const alertBox = document.getElementById('alert');
          alertBox.innerText = '🎯 ' + payload.user + ' IN GOAL! +' + payload.score + ' PTS';
          alertBox.classList.add('active');
          setTimeout(() => alertBox.classList.remove('active'), 4000);
        } else if (payload.type === 'CATCH_BUTTERFLY') {
          const alertBox = document.getElementById('alert');
          alertBox.innerText = '🦋 ' + payload.user + ' CAUGHT ' + payload.rarity;
          alertBox.classList.add('active');
          setTimeout(() => alertBox.classList.remove('active'), 4000);
        }
      }
    });
  </script>
</body>
</html>`
                            }
                          });
                        }
                      }}
                    >
                      {activeWidget === 'cyber_alert' ? 'Widget Kaldır' : 'OBS\'e Yükle'}
                    </button>
                  </div>

                  {/* Purple Dreams Theme card */}
                  <div style={{
                    background: 'var(--card-bg)',
                    border: 'var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: 'var(--glass-shadow)',
                    position: 'relative'
                  }}>
                    {activeTheme === 'purple_dream' && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>AKTİF</div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎨</span> Mor Düşler Teması
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                        OBS ekranındaki kelebek yakalama bildirim kutusunu derin mor, parıldayan neon kenarlıklı bir tasarıma kavuşturur.
                      </p>
                    </div>
                    <button
                      className={`btn ${activeTheme === 'purple_dream' ? 'btn-danger' : 'btn-primary'}`}
                      style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                      onClick={async () => {
                        if (activeTheme === 'purple_dream') {
                          await appendIndexedDBLog({
                            type: "INSTALL_MARKET_ITEM",
                            itemId: null,
                            itemType: "theme",
                            config: { styles: { y: '30%', x: '50%', bg: 'rgba(10, 8, 22, 0.9)', radius: '24px', 'border-color': 'rgba(178, 102, 255, 0.4)' } }
                          });
                        } else {
                          await appendIndexedDBLog({
                            type: "INSTALL_MARKET_ITEM",
                            itemId: "purple_dream",
                            itemType: "theme",
                            config: {
                              styles: {
                                y: '20%',
                                x: '50%',
                                bg: 'rgba(35, 10, 60, 0.95)',
                                radius: '16px',
                                'border-color': 'rgba(178, 102, 255, 0.85)'
                              }
                            }
                          });
                        }
                      }}
                    >
                      {activeTheme === 'purple_dream' ? 'Temayı Kaldır' : 'OBS\'e Uygula'}
                    </button>
                  </div>

                  {/* Minimal Glass Theme card */}
                  <div style={{
                    background: 'var(--card-bg)',
                    border: 'var(--glass-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: 'var(--glass-shadow)',
                    position: 'relative'
                  }}>
                    {activeTheme === 'minimal_glass' && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>AKTİF</div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎨</span> Minimalist Cam Teması
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                        İnce, transparan, yarı saydam ve beyaz çizgili sınırlarıyla minimalist yayıncılar için modern cam tasarımı.
                      </p>
                    </div>
                    <button
                      className={`btn ${activeTheme === 'minimal_glass' ? 'btn-danger' : 'btn-primary'}`}
                      style={{ width: '100%', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                      onClick={async () => {
                        if (activeTheme === 'minimal_glass') {
                          await appendIndexedDBLog({
                            type: "INSTALL_MARKET_ITEM",
                            itemId: null,
                            itemType: "theme",
                            config: { styles: { y: '30%', x: '50%', bg: 'rgba(10, 8, 22, 0.9)', radius: '24px', 'border-color': 'rgba(178, 102, 255, 0.4)' } }
                          });
                        } else {
                          await appendIndexedDBLog({
                            type: "INSTALL_MARKET_ITEM",
                            itemId: "minimal_glass",
                            itemType: "theme",
                            config: {
                              styles: {
                                y: '10%',
                                x: '10%',
                                bg: 'rgba(255, 255, 255, 0.08)',
                                radius: '8px',
                                'border-color': 'rgba(255, 255, 255, 0.2)'
                              }
                            }
                          });
                        }
                      }}
                    >
                      {activeTheme === 'minimal_glass' ? 'Temayı Kaldır' : 'OBS\'e Uygula'}
                    </button>
                  </div>

                  {/* Dynamic Community Approved Widgets & Themes */}
                  {globalMarketItems.filter(i => (i.type === 'widget' || i.type === 'theme') && i.status === 'approved').map((item) => {
                    const isActive = item.type === 'widget' ? activeWidget === item.id : activeTheme === item.id;
                    const typeLabel = item.type === 'widget' ? '📺 Widget' : '🎨 Tema';
                    return (
                      <div key={item.id} style={{
                        background: 'var(--card-bg)',
                        border: 'var(--glass-border)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        boxShadow: 'var(--glass-shadow)',
                        position: 'relative'
                      }}>
                        {isActive && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>AKTİF</div>
                        )}
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{item.type === 'widget' ? '📺' : '🎨'}</span> {item.name}
                          </h3>
                          <span style={{ fontSize: '11px', color: 'var(--lilac-muted)', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                            {typeLabel} | Geliştirici: @{item.developer || 'Bilinmeyen'}
                          </span>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                            {item.name} topluluk tarafından geliştirilen {typeLabel.toLowerCase()} modülüdür.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button
                            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
                            style={{ flex: 1, height: '40px', borderRadius: '8px', fontSize: '13px' }}
                            onClick={async () => {
                              if (item.type === 'widget') {
                                if (isActive) {
                                  await appendIndexedDBLog({
                                    type: "INSTALL_MARKET_ITEM",
                                    itemId: null,
                                    itemType: "widget",
                                    config: null
                                  });
                                } else {
                                  await appendIndexedDBLog({
                                    type: "INSTALL_MARKET_ITEM",
                                    itemId: item.id,
                                    itemType: "widget",
                                    config: { html: item.content }
                                  });
                                }
                              } else {
                                if (isActive) {
                                  await appendIndexedDBLog({
                                    type: "INSTALL_MARKET_ITEM",
                                    itemId: null,
                                    itemType: "theme",
                                    config: null
                                  });
                                } else {
                                  try {
                                    const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
                                    await appendIndexedDBLog({
                                      type: "INSTALL_MARKET_ITEM",
                                      itemId: item.id,
                                      itemType: "theme",
                                      config: parsed
                                    });
                                  } catch {
                                    await appendIndexedDBLog({
                                      type: "INSTALL_MARKET_ITEM",
                                      itemId: item.id,
                                      itemType: "theme",
                                      config: { styles: {} }
                                    });
                                  }
                                }
                              }
                            }}
                          >
                            {isActive ? 'Kaldır' : 'OBS\'e Yükle'}
                          </button>

                          <button
                            className={`btn ${disabledMarketItems.has(String(item.id)) ? 'btn-danger' : 'btn-success'}`}
                            style={{ padding: '0 16px', height: '40px', borderRadius: '8px', fontSize: '13px' }}
                            onClick={async () => {
                              const isCurrentlyDisabled = disabledMarketItems.has(String(item.id));
                              await appendIndexedDBLog({
                                type: "TOGGLE_MARKET_ITEM",
                                itemId: String(item.id),
                                enabled: isCurrentlyDisabled
                              });
                            }}
                          >
                            {disabledMarketItems.has(String(item.id)) ? '❌ Devre Dışı' : '✅ Aktif'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Package Importer */}
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'var(--card-bg)',
                  border: 'var(--glass-border)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--glass-shadow)',
                  marginTop: '20px'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lilac)' }}>🧩 Geliştirici Paketini İçe Aktar</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Topluluk geliştiricileri tarafından paylaşılan Base64 formatındaki paket kodunu buraya yapıştırarak temayı veya widget'ı anında yükleyebilirsiniz.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      id="import-package-input"
                      placeholder="Geliştirici paket kodunu buraya yapıştırın (Örn: eyJ0eXBlIjoi..."
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--lilac-muted)',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        fontSize: '13px'
                      }}
                    />
                    <button
                      className="btn btn-success"
                      style={{ height: '46px', padding: '0 24px' }}
                      onClick={async () => {
                        const input = document.getElementById('import-package-input');
                        const token = input ? input.value.trim() : '';
                        if (!token) {
                          alert("Lütfen geçerli bir paket kodu girin!");
                          return;
                        }
                        try {
                          const rawData = decodeURIComponent(escape(atob(token)));
                          const data = JSON.parse(rawData);
                          
                          if (data.type === 'widget') {
                            await appendIndexedDBLog({
                              type: "INSTALL_MARKET_ITEM",
                              itemId: data.name || "imported_widget",
                              itemType: "widget",
                              config: { html: data.html }
                            });
                            alert(`🎉 '${data.name}' başarıyla yüklendi ve OBS ekranında aktif edildi!`);
                          } else if (data.type === 'theme') {
                            await appendIndexedDBLog({
                              type: "INSTALL_MARKET_ITEM",
                              itemId: data.name || "imported_theme",
                              itemType: "theme",
                              config: { styles: data.styles }
                            });
                            alert(`🎉 '${data.name}' başarıyla yüklendi ve OBS ekranına uygulandı!`);
                          } else {
                            alert("Geçersiz paket tipi!");
                          }
                          if (input) input.value = '';
                        } catch (e) {
                          console.error("Import error:", e);
                          alert("Paket kodu çözümlenemedi! Lütfen geçerli bir kod kopyaladığınızdan emin olun.");
                        }
                      }}
                    >
                      📥 Paketi İçe Aktar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: Geliştirici Workspace SDK */}
            {marketSubTab === 'developer' && (
              <div className="fade-in">
                {/* Visual Designer and Custom Code Editor Side-by-Side */}
                <div className="grid-cols-2">
                  {/* Visual Alert Designer */}
                  <div className="panel-card">
                    <h2 className="card-title">📐 No-Code Alert Tasarımcısı</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                      Kelebek bildirim kutusunun ekran koordinatlarını ve arka plan stilini tasarlayın.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Ekran Dikey Pozisyonu (Top)</label>
                        <input
                          type="text"
                          value={designerY}
                          onChange={(e) => setDesignerY(e.target.value)}
                          placeholder="Örn: 30%, 150px"
                        />
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Arka Plan Rengi (RGBA / HEX)</label>
                        <input
                          type="text"
                          value={designerBg}
                          onChange={(e) => setDesignerBg(e.target.value)}
                          placeholder="Örn: rgba(10, 8, 22, 0.9)"
                        />
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Kenar Yumuşaklığı (Border Radius)</label>
                        <input
                          type="text"
                          value={designerRadius}
                          onChange={(e) => setDesignerRadius(e.target.value)}
                          placeholder="Örn: 24px, 50%"
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Kenarlık Rengi (Border Color)</label>
                        <input
                          type="text"
                          value={designerBorder}
                          onChange={(e) => setDesignerBorder(e.target.value)}
                          placeholder="Örn: rgba(178, 102, 255, 0.4)"
                        />
                      </div>

                      {/* Live designer preview box */}
                      <div style={{ marginTop: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lilac)', textTransform: 'uppercase' }}>Canlı Önizleme</label>
                        <div style={{
                          background: designerBg,
                          border: `2px solid ${designerBorder}`,
                          borderRadius: designerRadius,
                          padding: '16px 24px',
                          textAlign: 'center',
                          color: '#fff',
                          marginTop: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                        }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 4px 0' }}>🦋 KELEBEK YAKALANDI!</h4>
                          <p style={{ fontSize: '12px', margin: 0, color: 'rgba(255,255,255,0.7)' }}>Örnek bildirim önizlemesi</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '12px' }}
                        onClick={async () => {
                          await appendIndexedDBLog({
                            type: "INSTALL_MARKET_ITEM",
                            itemId: "custom_designer",
                            itemType: "theme",
                            config: {
                              styles: {
                                x: '50%',
                                y: designerY,
                                bg: designerBg,
                                radius: designerRadius,
                                'border-color': designerBorder
                              }
                            }
                          });
                          alert("Tasarım ayarları başarıyla OBS ekranına gönderildi!");
                        }}
                      >
                        💾 Tasarımı OBS Ekranına Gönder
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '8px' }}
                        onClick={() => {
                          const data = {
                            type: 'theme',
                            name: 'Özel Tasarım Teması',
                            styles: {
                              x: '50%',
                              y: designerY,
                              bg: designerBg,
                              radius: designerRadius,
                              'border-color': designerBorder
                            }
                          };
                          const token = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
                          navigator.clipboard.writeText(token);
                          alert("Tema paketi panoya kopyalandı! Yayıncılar bu kodu 'Widget & Temalar' sekmesinden içe aktarabilir.");
                        }}
                      >
                        📦 Temayı Dışa Aktar (Kopyala)
                      </button>
                    </div>
                  </div>

                  {/* Widget Code Sandbox */}
                  <div className="panel-card">
                    <h2 className="card-title">💻 Widget Sandbox Editörü (HTML/JS)</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                      Yalıtılmış Iframe içinde çalışacak tamamen özel HTML/JS widget kodları yükleyin.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Widget HTML Kaynak Kodu</label>
                        <textarea
                          value={customWidgetCode}
                          onChange={(e) => setCustomWidgetCode(e.target.value)}
                          style={{
                            width: '100%',
                            height: '240px',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--lilac-muted)',
                            borderRadius: '12px',
                            color: '#00e5ff',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            padding: '12px',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          type="button"
                          className="btn btn-success"
                          style={{ flex: 1 }}
                          onClick={async () => {
                            await appendIndexedDBLog({
                              type: "INSTALL_MARKET_ITEM",
                              itemId: "custom_iframe_widget",
                              itemType: "widget",
                              config: {
                                html: customWidgetCode
                              }
                            });
                            alert("Özel Widget kodu başarıyla OBS Sandbox Iframe'ine yüklendi!");
                          }}
                        >
                          🚀 Kodu OBS'e Gönder
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '12px 18px' }}
                          onClick={async () => {
                            await appendIndexedDBLog({
                              type: "INSTALL_MARKET_ITEM",
                              itemId: null,
                              itemType: "widget",
                              config: null
                            });
                            alert("OBS Sandbox Iframe'i temizlendi.");
                          }}
                        >
                          Temizle
                        </button>
                        
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            const data = {
                              type: 'widget',
                              name: 'Özel Sandbox Widget',
                              html: customWidgetCode
                            };
                            const token = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
                            navigator.clipboard.writeText(token);
                            alert("Widget paketi panoya kopyalandı! Yayıncılar bu kodu 'Widget & Temalar' sekmesinden içe aktarabilir.");
                          }}
                        >
                          📦 Widget'ı Dışa Aktar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Global Marketplace Submission Form */}
                <div className="panel-card" style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
                  <h2 className="card-title">🚀 Ürününü Pazar Yerinde Yayınla (Yönetici Onayına Gönder)</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                    Kendi geliştirdiğin karakter görünümü (skin), ekran widget'ı veya arayüz temasını global pazar yerine yükle. 
                    Yüklenen ürünler yönetici onayından geçtikten sonra tüm kanallarda kullanılabilir hale gelir.
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const developerName = devId ? devId : newItemDeveloper.trim();
                      if (!newItemName.trim() || !developerName) {
                        alert("Lütfen ürün adı ve geliştirici adı alanlarını doldurun!");
                        return;
                      }
                      if (!localStorage.getItem('paira_secret')) {
                        alert("Lütfen ürün göndermek için önce yukarıdan 'Kick İle Yetkilendir' butonuna tıklayarak giriş yapın!");
                        return;
                      }
                      if (newItemType === 'skin' && newItemPrice <= 0) {
                        alert("Karakter görünümleri için en az 1 puanlık fiyat belirlemelisiniz!");
                        return;
                      }
                      
                      const finalPrice = (newItemType === 'widget' || newItemType === 'theme') ? 0 : newItemPrice;
                      
                      let finalContent = newItemContent.trim();
                      if (!finalContent) {
                        if (newItemType === 'widget') {
                          finalContent = `<!DOCTYPE html><html><head><style>body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; background: transparent; }</style></head><body><div style="background:rgba(0,0,0,0.8);color:#fff;padding:20px;border-radius:8px;">${newItemName} Widget</div></body></html>`;
                        } else if (newItemType === 'theme') {
                          finalContent = JSON.stringify({
                            styles: {
                              x: "50%",
                              y: "30%",
                              bg: "rgba(10, 8, 22, 0.9)",
                              radius: "24px",
                              "border-color": "rgba(178, 102, 255, 0.4)"
                            }
                          });
                        } else {
                          finalContent = `${newItemName} karakter görünümü.`;
                        }
                      }

                      try {
                        const res = await callMarketplaceAPI("submit_market_item", {
                          itemType: newItemType,
                          name: newItemName.trim(),
                          price: Number(finalPrice) || 0,
                          content: finalContent,
                          desc: newItemType === 'skin' ? finalContent : ''
                        });

                        if (res && res.success) {
                          alert(`🎉 '${newItemName}' başarıyla gönderildi ve bulut veritabanına kaydedildi! Ürün ID: #${res.itemId}. Yönetici onayladıktan sonra yayına alınacaktır.`);
                          await appendIndexedDBLog({
                            type: "DEVELOPER_SUBMIT_ITEM",
                            id: String(res.itemId),
                            itemType: newItemType,
                            name: newItemName.trim(),
                            price: Number(finalPrice) || 0,
                            content: finalContent,
                            developer: developerName,
                            status: "pending"
                          });
                          fetchGlobalMarketItems();
                          
                          // Reset fields
                          setNewItemName('');
                          setNewItemContent('');
                          setNewItemPrice(0);
                        } else {
                          alert(`Hata: ${res.error || 'Ürün gönderilemedi.'}`);
                        }
                      } catch (err) {
                        console.error("Submit API error:", err);
                        alert(`Sistem hatası: ${err.message}`);
                      }
                    }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Geliştirici Adınız</label>
                        <input
                          type="text"
                          value={devId || newItemDeveloper}
                          onChange={(e) => !devId && setNewItemDeveloper(e.target.value)}
                          readOnly={!!devId}
                          className={devId ? "readonly-input" : ""}
                          placeholder="Kick ile giriş yapınca otomatik doldurulur"
                          required
                        />
                        {devId ? (
                          <span style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--success)' }}>●</span> Yetkilendirilmiş Geliştirici Hesabı: <strong>@{devId}</strong>
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--danger)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>⚠️</span> Pazar yerinde yayınlamak için lütfen yukarıdan <strong>Kick ile Yetkilendir</strong> butonuyla giriş yapın.
                          </span>
                        )}
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Ürün Adı</label>
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="Örn: Ateş Ejderi"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Ürün Tipi</label>
                        <select
                          value={newItemType}
                          onChange={(e) => {
                            const type = e.target.value;
                            setNewItemType(type);
                            if (type === 'widget' || type === 'theme') {
                              setNewItemPrice(0);
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--input-bg)',
                            border: '1px solid var(--lilac-muted)',
                            borderRadius: '12px',
                            color: 'var(--text-main)',
                            fontSize: '13px'
                          }}
                        >
                          <option value="skin">🎨 Karakter Görünümü (Skins - Ücretli/İzleyiciler İçin)</option>
                          <option value="widget">📺 Ekran Bildirim Widget'ı (Streamer - Ücretsiz)</option>
                          <option value="theme">🎭 OBS Arayüz Teması (Streamer - Ücretsiz)</option>
                        </select>
                      </div>
                      
                      {newItemType === 'skin' && (
                        <div className="form-group" style={{ margin: 0 }}>
                          <label>Fiyat (Puan Cinsinden)</label>
                          <input
                            type="number"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="Örn: 500"
                            min="1"
                            required
                          />
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label>
                          {newItemType === 'skin' && 'Görünüm Açıklaması veya Dosya Detayları'}
                          {newItemType === 'widget' && 'Widget HTML/JS Kaynak Kodu'}
                          {newItemType === 'theme' && 'Tema Stilleri JSON Konfigürasyonu'}
                        </label>
                        <textarea
                          value={newItemContent}
                          onChange={(e) => setNewItemContent(e.target.value)}
                          placeholder={
                            newItemType === 'skin' 
                              ? 'Görünümün özelliklerini açıklayın (Örn: Ateş efektli ejderha karakteri).' 
                              : newItemType === 'widget' 
                                ? 'HTML ve Javascript kodlarını buraya yazın...' 
                                : 'Tema JSON stil yapısını buraya yazın (Örn: {"styles": {"bg": "red"}})'
                          }
                          style={{
                            width: '100%',
                            flex: 1,
                            minHeight: '140px',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--lilac-muted)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            padding: '12px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-success" 
                        style={{ width: '100%', height: '46px', margin: 0 }}
                        disabled={!localStorage.getItem('paira_secret')}
                      >
                        {localStorage.getItem('paira_secret') ? '🚀 Ürünü Yayınla & Onaya Gönder' : '🔒 Giriş Yapılmadı (Ürün Gönderilemez)'}
                      </button>
                    </div>
                  </form>

                    {generatedPackageToken && (
                      <div style={{
                        marginTop: '24px',
                        background: 'rgba(46, 204, 113, 0.1)',
                        border: '1px solid var(--success)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--success)', margin: 0 }}>
                          🎉 Yayınlama Paketiniz Başarıyla Üretildi!
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                          Ürününüzün onaylanması için aşağıdaki şifrelenmiş paket kodunu kopyalayıp yöneticinize (Ahmet) iletin.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            readOnly
                            value={generatedPackageToken}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPackageToken);
                              alert("Paket kodu panoya kopyalandı!");
                            }}
                          >
                            📋 Kopyala
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}
                            onClick={() => setGeneratedPackageToken('')}
                          >
                            Kapat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: Yönetici Paneli */}
            {isAdmin && marketSubTab === 'admin' && (
              <div className="panel-card fade-in">
                <h2 className="card-title">🔑 Geliştirici Onay Paneli (Admin Review)</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                  Geliştiriciler tarafından gönderilen yeni karakter görünümlerini, eklentileri veya temaları inceleyin, test edin ve onaylayarak sisteme dahil edin.
                </p>

                {globalMarketItems.filter(item => item.status === 'pending').length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    padding: '60px 20px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '16px',
                    border: 'var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '48px' }}>🎉</span>
                    <h3 style={{ fontSize: '16px', color: 'var(--lilac)', fontWeight: '700' }}>Her Şey Temiz!</h3>
                    <p style={{ fontSize: '13px', maxWidth: '360px', margin: 0, lineHeight: '1.5' }}>
                      Şu anda incelenmeyi bekleyen herhangi bir geliştirici başvuru talebi bulunmuyor.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {globalMarketItems.filter(item => item.status === 'pending').map((item) => (
                      <div key={item.id} style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        boxShadow: 'var(--glass-shadow)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: 'var(--lilac)',
                              background: 'rgba(178, 102, 255, 0.15)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              ID: #{item.id}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#ffb020',
                              background: 'rgba(255, 176, 32, 0.15)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {item.type === 'skin' ? '🎨 Karakter Görünümü' : item.type === 'widget' ? '📺 Widget' : '🎭 Tema'}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '4px 0 0 0', color: 'var(--text-main)' }}>{item.name}</h3>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            Geliştirici: <strong>@{item.developer}</strong>
                          </div>
                          {item.type === 'skin' && (
                            <div style={{ fontSize: '13px', color: '#ffb020', fontWeight: '600' }}>
                              💰 Fiyat: {item.price} Puan
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                              className="btn btn-success"
                              style={{ padding: '10px 24px', flex: 1 }}
                              onClick={async () => {
                                try {
                                  const res = await callMarketplaceAPI("approve_market_item", {
                                    itemId: item.id,
                                    status: "approved"
                                  });
                                  if (res && res.success) {
                                    alert(`'${item.name}' başarıyla onaylandı ve yayına alındı!`);
                                    await appendIndexedDBLog({
                                      type: "ADMIN_APPROVE_ITEM",
                                      id: String(item.id),
                                      status: "approved"
                                    });
                                    fetchGlobalMarketItems();
                                  } else {
                                    alert(`Hata: ${res.error || 'Onaylanamadı.'}`);
                                  }
                                } catch (err) {
                                  alert(`Sistem hatası: ${err.message}`);
                                }
                              }}
                            >
                              ✅ Onayla & Yayınla
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '10px 24px', flex: 1 }}
                              onClick={async () => {
                                try {
                                  const res = await callMarketplaceAPI("approve_market_item", {
                                    itemId: item.id,
                                    status: "rejected"
                                  });
                                  if (res && res.success) {
                                    alert(`'${item.name}' başvurusu reddedildi.`);
                                    await appendIndexedDBLog({
                                      type: "ADMIN_APPROVE_ITEM",
                                      id: String(item.id),
                                      status: "rejected"
                                    });
                                    fetchGlobalMarketItems();
                                  } else {
                                    alert(`Hata: ${res.error || 'Reddedilemedi.'}`);
                                  }
                                } catch (err) {
                                  alert(`Sistem hatası: ${err.message}`);
                                }
                              }}
                            >
                              ❌ Reddet
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--lilac)' }}>Başvuru İçeriği</label>
                          <textarea
                            readOnly
                            value={item.content}
                            style={{
                              width: '100%',
                              height: '140px',
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '12px',
                              color: '#a5b4fc',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              padding: '12px',
                              resize: 'none'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Helpers for IndexedDB and local logs
class PairaWAL {
  constructor() {
    this.dbName = "PairaBotDB";
    this.storeName = "wal_logs";
    this.opfsFileName = "paira_wal.log";
    this.fileHandle = null;
    this.opfsFileHandle = null;
    this.db = null;
    this.storageType = "none";
    this.syncChannel = new BroadcastChannel("paira_wal_sync");
    this.mutexChannel = new BroadcastChannel("paira_wal_mutex");
    this.writeQueue = Promise.resolve();
    
    this.contextId = "ctx_panel_" + Math.random().toString(36).substring(2, 11);
    this.isWriter = false;
    this.pendingRequests = new Map(); // reqId -> { resolve, reject, timeout }
    this.onAppendCallback = null;
  }

  async init() {
    await this.initIndexedDB();

    // Determine storage systems
    try {
      const storedHandle = await this.getStoredFileHandle();
      if (storedHandle) {
        const opts = { mode: 'readwrite' };
        if ((await storedHandle.queryPermission(opts)) === 'granted') {
          this.fileHandle = storedHandle;
          this.storageType = "file";
        }
      }
    } catch (e) {
      console.warn("File System Access API query failed in panel:", e);
    }

    if (this.storageType === "none") {
      try {
        if (navigator.storage && navigator.storage.getDirectory) {
          const root = await navigator.storage.getDirectory();
          this.opfsFileHandle = await root.getFileHandle(this.opfsFileName, { create: true });
          this.storageType = "opfs";
        }
      } catch (e) {
        console.warn("OPFS setup failed in panel:", e);
      }
    }

    if (this.storageType === "none") {
      this.storageType = "idb";
    }

    console.log(`📝 Panel WAL initialized: ${this.storageType} (Context ID: ${this.contextId})`);

    // Initialize Mutex listeners
    this.mutexChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === "MUTEX_PING") {
        if (this.isWriter) {
          this.mutexChannel.postMessage({
            type: "MUTEX_PONG",
            senderId: this.contextId
          });
        }
      } else if (msg.type === "MUTEX_PONG") {
        if (this.pingTimeout) {
          clearTimeout(this.pingTimeout);
          this.pingResolve(false);
        }
      } else if (msg.type === "MUTEX_CLAIM") {
        if (msg.senderId !== this.contextId) {
          if (this.isWriter) {
            if (msg.senderId < this.contextId) {
              console.log(`📢 Mutex conflict! Relinquishing lock to smaller context ID: ${msg.senderId}`);
              this.isWriter = false;
            } else {
              console.log(`📢 Mutex conflict! Keeping lock over larger context ID: ${msg.senderId}`);
              this.mutexChannel.postMessage({
                type: "MUTEX_CLAIM",
                senderId: this.contextId
              });
            }
          } else {
            console.log(`📢 Mutex claimed by another context: ${msg.senderId}`);
            this.isWriter = false;
          }
        }
      } else if (msg.type === "WAL_WRITE_REQUEST") {
        if (this.isWriter) {
          console.log(`📥 Panel received write request from ${msg.senderId} (reqId: ${msg.reqId})`);
          this.append({
            ...msg.payload,
            _reqId: msg.reqId,
            _senderId: msg.senderId
          });
        }
      }
    };

    this.syncChannel.onmessage = (event) => {
      const msg = event.data;
      if (msg && msg.type === "WAL_APPEND") {
        const payload = msg.payload;
        
        // Check if this matches a pending write request from this context
        if (payload._senderId === this.contextId && payload._reqId) {
          const pending = this.pendingRequests.get(payload._reqId);
          if (pending) {
            clearTimeout(pending.timeout);
            pending.resolve(payload);
            this.pendingRequests.delete(payload._reqId);
          }
        }

        if (this.onAppendCallback) {
          this.onAppendCallback(payload);
        }
      }
    };

    // Run election
    const claimed = await this.runElection();
    if (claimed) {
      this.isWriter = true;
      this.mutexChannel.postMessage({
        type: "MUTEX_CLAIM",
        senderId: this.contextId
      });
      console.log("👑 Mutex acquired. Panel is the Active Writer.");
    } else {
      console.log("👥 Mutex denied. Panel is a Reader.");
    }
  }

  runElection() {
    return new Promise((resolve) => {
      this.pingResolve = resolve;
      this.mutexChannel.postMessage({
        type: "MUTEX_PING",
        senderId: this.contextId
      });
      this.pingTimeout = setTimeout(() => {
        resolve(true); // No response, claim lock
      }, 400);
    });
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = (e) => reject(e);
    });
  }

  async getStoredFileHandle() {
    return new Promise((resolve) => {
      if (!this.db) return resolve(null);
      const tx = this.db.transaction("settings", "readonly");
      const store = tx.objectStore("settings");
      const req = store.get("file_handle");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async storeFileHandle(handle) {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      const req = store.put(handle, "file_handle");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }

  async append(payload) {
    if (this.isWriter) {
      this.writeQueue = this.writeQueue.then(async () => {
        return await this._executeAppend(payload);
      }).catch(err => {
        console.error("WAL append serialization queue error in panel:", err);
      });
      return this.writeQueue;
    } else {
      // Delegate write to the active writer context
      return new Promise((resolve, reject) => {
        const reqId = "req_" + Math.random().toString(36).substring(2, 11);
        
        const timeout = setTimeout(async () => {
          console.warn(`⏰ Write request timed out (reqId: ${reqId}). Panel claiming lock.`);
          this.pendingRequests.delete(reqId);
          
          this.isWriter = true;
          this.mutexChannel.postMessage({
            type: "MUTEX_CLAIM",
            senderId: this.contextId
          });
          try {
            const entry = await this.append(payload);
            resolve(entry);
          } catch (e) {
            reject(e);
          }
        }, 1000);

        this.pendingRequests.set(reqId, { resolve, reject, timeout });
        
        this.mutexChannel.postMessage({
          type: "WAL_WRITE_REQUEST",
          senderId: this.contextId,
          reqId: reqId,
          payload: payload
        });
      });
    }
  }

  async _executeAppend(payload) {
    const logEntry = {
      ...payload,
      ts: Date.now()
    };

    if (this.storageType === "file" && this.fileHandle) {
      try {
        const file = await this.fileHandle.getFile();
        const writable = await this.fileHandle.createWritable({ keepExistingData: true });
        await writable.seek(file.size);
        await writable.write(JSON.stringify(logEntry) + "\n");
        await writable.close();
      } catch {
        try {
          const file = await this.fileHandle.getFile();
          const text = await file.text();
          const writable = await this.fileHandle.createWritable();
          await writable.write(text + JSON.stringify(logEntry) + "\n");
          await writable.close();
        } catch (err) {
          console.error("Error writing file in panel, fallback to IDB:", err);
          await this.writeToIDB(logEntry);
        }
      }
    } else if (this.storageType === "opfs" && this.opfsFileHandle) {
      try {
        const file = await this.opfsFileHandle.getFile();
        const writable = await this.opfsFileHandle.createWritable({ keepExistingData: true });
        await writable.seek(file.size);
        await writable.write(JSON.stringify(logEntry) + "\n");
        await writable.close();
      } catch {
        try {
          const file = await this.opfsFileHandle.getFile();
          const text = await file.text();
          const writable = await this.opfsFileHandle.createWritable();
          await writable.write(text + JSON.stringify(logEntry) + "\n");
          await writable.close();
        } catch (err) {
          console.error("Error writing OPFS in panel, fallback to IDB:", err);
          await this.writeToIDB(logEntry);
        }
      }
    } else {
      await this.writeToIDB(logEntry);
    }

    if (this.onAppendCallback) {
      this.onAppendCallback(logEntry);
    }

    this.syncChannel.postMessage({
      type: "WAL_APPEND",
      payload: logEntry
    });

    return logEntry;
  }

  async writeToIDB(logEntry) {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      store.add({ data: JSON.stringify(logEntry) });
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => {
        console.error("IndexedDB write failed in panel");
        resolve();
      };
    });
  }

  async readAll() {
    const logs = [];
    if (this.storageType === "file" && this.fileHandle) {
      try {
        const file = await this.fileHandle.getFile();
        const text = await file.text();
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            try {
              logs.push(JSON.parse(line));
            } catch (err) {
              console.warn("Skipping corrupt WAL line:", line, err);
            }
          }
        }
        return logs;
      } catch (e) {
        console.error("Error reading file WAL in panel:", e);
      }
    }

    if (this.storageType === "opfs" && this.opfsFileHandle) {
      try {
        const file = await this.opfsFileHandle.getFile();
        const text = await file.text();
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            try {
              logs.push(JSON.parse(line));
            } catch (err) {
              console.warn("Skipping corrupt OPFS line:", line, err);
            }
          }
        }
        return logs;
      } catch (e) {
        console.error("Error reading OPFS WAL in panel:", e);
      }
    }

    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        const parsed = [];
        for (const r of results) {
          try {
            parsed.push(JSON.parse(r.data));
          } catch (err) {
            console.warn("Skipping corrupt IndexedDB WAL entry:", r, err);
          }
        }
        resolve(parsed);
      };
      req.onerror = () => resolve([]);
    });
  }
}

const PairaWALInstance = new PairaWAL();

function readIndexedDBLogs() {
  return PairaWALInstance.readAll();
}

function appendIndexedDBLog(logEntry) {
  return PairaWALInstance.append(logEntry);
}

function storeFileHandleInDB(handle) {
  return PairaWALInstance.storeFileHandle(handle);
}


let currentAccessToken = '';

async function fetchAccessToken(forceRefresh = false) {
  const devId = localStorage.getItem('paira_devId');
  const broadcasterSecret = localStorage.getItem('paira_secret');
  const broadcasterUserId = localStorage.getItem('paira_buid');

  if (!broadcasterSecret || !broadcasterUserId || !devId) {
    console.warn("Token Broker config missing in panel.");
    return null;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = `${devId}:${timestamp}:${broadcasterUserId}:${forceRefresh ? 'true' : 'false'}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(broadcasterSecret);
    const msgData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const response = await fetch(AWS_CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-User-Id': devId
      },
      body: JSON.stringify({
        broadcaster_user_id: broadcasterUserId,
        force_refresh: forceRefresh
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.access_token) {
        currentAccessToken = data.access_token;
        return currentAccessToken;
      }
    }
    return null;
  } catch (e) {
    console.error("Panel token fetch failed:", e);
    return null;
  }
}

async function sendChatMessage(message, isRetry = false) {
  const devId = localStorage.getItem('paira_devId');
  const broadcasterSecret = localStorage.getItem('paira_secret');
  const broadcasterUserId = localStorage.getItem('paira_buid');

  if (!broadcasterSecret || !broadcasterUserId || !devId) {
    console.warn("Chat API config missing in panel.");
    return;
  }

  if (!currentAccessToken) {
    const token = await fetchAccessToken(false);
    if (!token) {
      console.error("Token could not be obtained for panel message:", message);
      return;
    }
  }

  try {
    const chatPayload = {
      broadcaster_user_id: parseInt(broadcasterUserId),
      content: message.substring(0, 500),
      type: "user"
    };


    const response = await fetch('https://api.kick.com/public/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentAccessToken}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify(chatPayload)
    });

    if (response.ok) {
      console.log(`📤 Panel: Mesaj doğrudan Kick API üzerinden gönderildi: ${message}`);
    } else if (response.status === 401 && !isRetry) {
      console.warn("⚠️ Panel: Token geçersiz/süresi dolmuş (401). Yenileniyor...");
      const token = await fetchAccessToken(true);
      if (token) {
        await sendChatMessage(message, true);
      } else {
        console.error("❌ Panel: Token yenilenemedi, mesaj gönderilemedi.");
      }
    } else {
      const errText = await response.text();
      console.error(`❌ Panel: Kick Chat API Hatası (HTTP ${response.status}):`, errText);
    }
  } catch (e) {
    console.error("Panel direct send message failed:", e);
  }
}

// PKCE Helpers
function dec2hex(dec) {
  return dec.toString(16).padStart(2, "0");
}

function generateCodeVerifier() {
  const array = new Uint8Array(56);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join("");
}

function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(a) {
  let str = "";
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallengeFromVerifier(v) {
  const hashed = await sha256(v);
  const base64encoded = base64urlencode(hashed);
  return base64encoded;
}

export default App;
