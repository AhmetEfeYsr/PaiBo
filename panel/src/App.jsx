import { useState, useEffect } from 'react'

const KICK_CLIENT_ID = "01KSWTJSRKMA4DN9QS76SHAQK3";
const KICK_OAUTH_CALLBACK_URL = "https://kz1d3kezb3.execute-api.eu-north-1.amazonaws.com/default/kick_oauth_callback";
const AWS_CHANNEL_API_URL = "https://9zdnkqnc90.execute-api.eu-north-1.amazonaws.com/default/kick_channel";
const AWS_CHAT_API_URL = "https://nbgqqa1530.execute-api.eu-north-1.amazonaws.com/default/kick_send_message";

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

  // --- MODERATOR STATES ---
  const [modUser, setModUser] = useState('');
  const [modPoints, setModPoints] = useState(100);
  const [modHealth, setModHealth] = useState(100);
  const [modItem, setModItem] = useState('Madalya');

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

        window.location.hash = ''; // Clear hash
      }
    }
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
  }, [devId, broadcasterSecret, channelName, broadcasterUserId, authList, poolWidth, charWidth, charSelect, targetSelect, soundSelect]);

  // Load WAL Logs and Replay State
  const fetchLogs = async () => {
    const loadedLogs = await readIndexedDBLogs();
    setLogs(loadedLogs);

    // Replay to build profiles
    const profiles = {};
    const getOrCreate = (user) => {
      const k = user.toLowerCase();
      if (!profiles[k]) {
        profiles[k] = { username: user, puan: 0, seviye: 1, envanter: [], health: 100 };
      }
      return profiles[k];
    };

    const raffleUsers = new Set();

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
      }
    }

    setRpgProfiles(profiles);
    setRaffleParticipants(Array.from(raffleUsers));
  };

  useEffect(() => {
    setTimeout(() => {
      fetchLogs();
    }, 0);
    // Set up timer to refresh log list every 3 seconds
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
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
      const redirectBase = `${window.location.origin}${window.location.pathname}`;
      const stateStr = encodeURIComponent(`${ch}|${buid}|${redirectBase}`);
      const authUrl = `https://id.kick.com/oauth/authorize?response_type=code&client_id=${KICK_CLIENT_ID}&redirect_uri=${encodeURIComponent(KICK_OAUTH_CALLBACK_URL)}&scope=user:read%20chat:write&state=${stateStr}`;
      window.location.href = authUrl;
    } catch (err) {
      console.error("Kanal bilgileri alınırken hata oluştu:", err);
      alert("Kanal bilgileri alınırken hata oluştu.");
    }
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

  const handleClearRaffle = () => {
    setRaffleParticipants([]);
    // We can clear locally
  };

  const handleStartRaffle = () => {
    if (raffleParticipants.length === 0) {
      alert("Çekilişe katılan kimse yok!");
      return;
    }
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

  return (
    <div>
      <header className="panel-header">
        <div className="logo-section">
          <h1>PairaBot Streamer Dashboard</h1>
          <p>Atlama Oyunu & Chat Yönetim Paneli</p>
        </div>
        <div className="nav-tabs">
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
        </div>
      </header>

      <main>
        {activeTab === 'config' && (
          <div className="panel-card">
            <h2 className="card-title">1. Adım: Kick & AWS Yetkilendirme</h2>
            <div className="form-grid" style={{ marginBottom: '24px' }}>
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
                <button className="btn btn-primary" onClick={handleKickConnect}>
                  Kick İle Yetkilendir (OAuth)
                </button>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Chatroom ID (buid)</label>
                <input type="text" value={broadcasterUserId} readOnly placeholder="Otomatik doldurulur" />
              </div>
              <div className="form-group">
                <label>Gizli Anahtar (Secret)</label>
                <input type="password" value={broadcasterSecret} readOnly placeholder="Otomatik doldurulur" />
              </div>
            </div>

            <h2 className="card-title" style={{ marginTop: '32px' }}>2. Adım: Görsel ve Fizik Ayarları</h2>
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

            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Karakter Görseli</label>
                <select value={charSelect} onChange={(e) => setCharSelect(e.target.value)}>
                  <option value="karakter">Varsayılan Kedy</option>
                  <option value="askersincap">Asker Sincap</option>
                  <option value="askerkedy">Asker Kedi</option>
                  <option value="steve">Steve (Minecraft)</option>
                  <option value="other">Diğer (Özel Dosya)</option>
                </select>
                {charSelect === 'other' && (
                  <input 
                    type="text" 
                    value={charNameOther} 
                    onChange={(e) => setCharNameOther(e.target.value)} 
                    placeholder="Dosya adını yazın" 
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Hedef Görseli</label>
                <select value={targetSelect} onChange={(e) => setTargetSelect(e.target.value)}>
                  <option value="havuz">Havuz</option>
                  <option value="bulut">Bulut</option>
                  <option value="trambolin">Trambolin</option>
                  <option value="other">Diğer (Özel Dosya)</option>
                </select>
                {targetSelect === 'other' && (
                  <input 
                    type="text" 
                    value={targetNameOther} 
                    onChange={(e) => setTargetNameOther(e.target.value)} 
                    placeholder="Dosya adını yazın" 
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Atlama Sesi</label>
                <select value={soundSelect} onChange={(e) => setSoundSelect(e.target.value)}>
                  <option value="vada">Varsayılan Vada</option>
                  <option value="selcuk">Selçuk</option>
                  <option value="other">Diğer (Özel Dosya)</option>
                </select>
                {soundSelect === 'other' && (
                  <input 
                    type="text" 
                    value={soundNameOther} 
                    onChange={(e) => setSoundNameOther(e.target.value)} 
                    placeholder="Ses dosya adını yazın" 
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
            </div>

            <h2 className="card-title" style={{ marginTop: '32px' }}>3. Adım: Lokal WAL Dosya Kaydı (İsteğe Bağlı)</h2>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: varColor('--text-second'), marginBottom: '12px' }}>
                Verilerinizin masaüstünüzde <code>paira_wal.log</code> dosyasına canlı olarak yazılmasını istiyorsanız bir kereye mahsus dosya seçin:
              </p>
              <button className="btn btn-secondary" onClick={handleSelectLocalFile}>
                📁 Log Dosyası Konumu Seç
              </button>
            </div>

            <button className="btn btn-primary" onClick={handleGenerateUrl} style={{ width: '100%', padding: '16px' }}>
              OBS Tarayıcı URL'si Oluştur
            </button>

            {generatedUrl && (
              <div style={{ marginTop: '24px' }}>
                <div className="flex-row">
                  <label style={{ fontWeight: '700', fontSize: '14px' }}>Oluşturulan URL:</label>
                  <button className="btn btn-success" onClick={handleCopyToClipboard}>
                    {copied ? 'Kopyalandı!' : 'Kopyala'}
                  </button>
                </div>
                <textarea className="output-textarea" value={generatedUrl} readOnly />
              </div>
            )}
          </div>
        )}

        {activeTab === 'raffle' && (
          <div className="grid-cols-2">
            <div className="panel-card">
              <h2 className="card-title">Çekiliş Çarkı</h2>
              <div className="slot-machine-container">
                <div className="slot-window">
                  <div className={`slot-name ${rolling ? 'rolling' : ''}`}>{rollName}</div>
                </div>
                
                {!rolling && winner && (
                  <div className="winner-announce">
                    <p style={{ fontSize: '13px', color: 'var(--text-second)' }}>Tebrikler Kazanan!</p>
                    <div className="winner-name">@{winner}</div>
                  </div>
                )}

                <button 
                  className="btn btn-primary" 
                  onClick={handleStartRaffle} 
                  disabled={rolling}
                  style={{ marginTop: '24px', width: '100%' }}
                >
                  {rolling ? 'Çekiliyor...' : 'Çekilişi Başlat 🚀'}
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
                  style={{ flex: '1', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                />
                <button type="submit" className="btn btn-secondary">Ekle</button>
              </form>

              <div style={{ maxHeight: '280px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {raffleParticipants.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-second)', fontSize: '13px' }}>
                    Henüz çekilişe katılan yok. Chat'ten <code>!katıl</code> yazanlar otomatik burada görünür.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {raffleParticipants.map((user, idx) => (
                      <span key={idx} className="badge badge-primary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        @{user}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn btn-danger" onClick={handleClearRaffle} style={{ marginTop: '16px', width: '100%' }}>
                Katılımcıları Temizle
              </button>
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
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-second)' }}>
                          Henüz hiçbir veri yok.
                        </td>
                      </tr>
                    ) : (
                      Object.values(rpgProfiles)
                        .sort((a, b) => (b.seviye * 100 + b.puan) - (a.seviye * 100 + a.puan))
                        .map((profile, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '700' }}>@{profile.username}</td>
                            <td style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>{profile.puan}</td>
                            <td>
                              <span className="badge badge-primary">Lv. {profile.seviye}</span>
                            </td>
                            <td>
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: profile.health > 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: profile.health > 50 ? 'var(--success)' : 'var(--danger)',
                                  border: profile.health > 50 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                              >
                                %{profile.health}
                              </span>
                            </td>
                            <td>
                              {profile.envanter.length > 0 ? (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {profile.envanter.map((item, i) => (
                                    <span key={i} className="badge badge-info">{item}</span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-second)', fontSize: '12px' }}>Boş</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => setModUser(profile.username)}
                              >
                                Düzenle
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
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Puan Ekle / Çıkar</button>
              </form>

              <form onSubmit={handleSetHealth} style={{ marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Sağlık Değeri (%0 - %100)</label>
                  <input type="number" value={modHealth} onChange={(e) => setModHealth(e.target.value)} min="0" max="100" required />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Sağlık Durumu Belirle</button>
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
                <button type="submit" className="btn btn-success" style={{ width: '100%' }}>Eşya Ver</button>
              </form>
            </div>

            <div className="panel-card">
              <h2 className="card-title">Canlı Etkinlik Günlüğü (WAL)</h2>
              <div style={{ maxHeight: '440px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '12.5px' }}>
                {logs.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-second)', padding: '20px 0' }}>Henüz aktivite günlüğü bulunmamaktadır.</p>
                ) : (
                  [...logs].reverse().slice(0, 25).map((log, idx) => {
                    let text = '';
                    let color = 'var(--text-main)';
                    if (log.type === "SCORE") {
                      text = `🎯 @${log.user} hedefe ulaştı!`;
                      color = 'var(--accent-blue)';
                    } else if (log.type === "RPG_POINT_CHANGE") {
                      text = `⭐ @${log.user} ${log.amount > 0 ? '+' : ''}${log.amount} Puan aldı.`;
                      color = 'var(--success)';
                    } else if (log.type === "RPG_INVENTORY") {
                      text = `🎒 @${log.user}: Eşya ${log.action === 'ADD' ? 'Eklendi' : 'Çıkarıldı'} -> ${log.item}`;
                      color = '#f59e0b';
                    } else if (log.type === "RPG_HEALTH") {
                      text = `❤️ @${log.user} Sağlık: %${log.health}`;
                      color = 'var(--danger)';
                    } else if (log.type === "RAFFLE_JOIN") {
                      text = `🎟️ @${log.user} çekilişe katıldı.`;
                      color = 'var(--accent)';
                    }
                    return (
                      <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color }}>
                        {text}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helpers for IndexedDB and local logs
function readIndexedDBLogs() {
  return new Promise((resolve) => {
    const request = indexedDB.open("PairaBotDB", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("wal_logs")) {
        return resolve([]);
      }
      const tx = db.transaction("wal_logs", "readonly");
      const store = tx.objectStore("wal_logs");
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        resolve(results.map(r => JSON.parse(r.data)));
      };
      req.onerror = () => resolve([]);
    };
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("wal_logs")) {
        db.createObjectStore("wal_logs", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings");
      }
    };
    request.onerror = () => resolve([]);
  });
}

function appendIndexedDBLog(logEntry) {
  return new Promise((resolve) => {
    const request = indexedDB.open("PairaBotDB", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("wal_logs", "readwrite");
      const store = tx.objectStore("wal_logs");
      const entry = {
        ...logEntry,
        ts: Date.now()
      };
      store.add({ data: JSON.stringify(entry) });
      tx.oncomplete = () => {
        const channel = new BroadcastChannel("paira_wal_sync");
        channel.postMessage({
          type: "WAL_APPEND",
          payload: entry
        });
        resolve();
      };
    };
    request.onerror = () => resolve();
  });
}

function storeFileHandleInDB(handle) {
  return new Promise((resolve) => {
    const request = indexedDB.open("PairaBotDB", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      const req = store.put(handle, "file_handle");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    };
  });
}

// CSS color values dynamic loader helper
function varColor(name) {
  return `var(${name})`;
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
      type: "bot"
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

export default App;
