import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import PredictionCard from './components/PredictionCard';
import { SectionType, Prediction, UserPremiumStatus } from './types';
import { fetchPredictions } from './services/geminiService';
import { Loader2, RefreshCcw, AlertCircle, Hash, Filter, Lock, Clock, Calendar, Crown, Send, MessageCircle, ShieldCheck, History, Unlock, Zap, ChevronRight, Check } from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import UnlockModal from './components/UnlockModal';

// Declare Firebase on window
declare global {
  interface Window {
    firebase: any;
  }
}

const STORAGE_KEY_FREE_DATE = 'betGuide_free_date';
const STORAGE_KEY_FREE_DATA = 'betGuide_free_data';
const STORAGE_KEY_VIP_USAGE = 'betGuide_vip_usage'; 
const STORAGE_KEY_VIP_HISTORY = 'betGuide_vip_history'; 
const PREMIUM_KEY = 'premium_v6';
const DEVICE_ID_KEY = 'deviceId_v6';

// Constants
const FREE_USER_LIMIT = 6;
const VIP_DAILY_LIMIT = 30;
const ADMIN_MASTER_CODE = "SUPERVIP2025";
const ADMIN_CONFIRM_CODE = "@admin1234!";

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>(SectionType.FREE);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // VIP Feature States
  const [predictionCount, setPredictionCount] = useState<number | string>(6);
  const [selectedMarket, setSelectedMarket] = useState<string>("Any");
  const [hasVipHistory, setHasVipHistory] = useState<boolean>(false);
  
  // Logic States
  const [freeLimitReached, setFreeLimitReached] = useState<boolean>(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(STORAGE_KEY_FREE_DATE);
    const storedData = localStorage.getItem(STORAGE_KEY_FREE_DATA);
    return storedDate === today && !!storedData;
  });

  const [vipLimitReached, setVipLimitReached] = useState<boolean>(false);
  const [vipDailyCount, setVipDailyCount] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>("");
  
  // Auth & Unlock States
  const [codeEntry, setCodeEntry] = useState('');
  const [premiumStatus, setPremiumStatus] = useState<UserPremiumStatus>({ role: 'free' });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [adminConfirmEntry, setAdminConfirmEntry] = useState('');

  // Firebase ref
  const firebaseDbRef = useRef<any>(null);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };
    updateDate();
    const timer = setInterval(updateDate, 60000);

    if (window.firebase && !firebaseDbRef.current) {
      try {
        const firebaseConfig = {
          apiKey: "AIzaSyBc2cUuGj8xbdlfv18PA8V7T77vSt_mnwI",
          authDomain: "predictions-ai-199d5.firebaseapp.com",
          databaseURL: "https://predictions-ai-199d5-default-rtdb.firebaseio.com",
          projectId: "predictions-ai-199d5",
          storageBucket: "predictions-ai-199d5.firebasestorage.app",
          messagingSenderId: "275877251235",
          appId: "1:275877251235:web:deb982eda6f3688bded716"
        };
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
        }
        firebaseDbRef.current = window.firebase.database();
      } catch (e) {
        console.error("Firebase init error:", e);
      }
    }

    const storedPremium = localStorage.getItem(PREMIUM_KEY);
    if (storedPremium) {
      try {
        const parsed = JSON.parse(storedPremium);
        setPremiumStatus(parsed);
        if (parsed.role === 'admin') {
           setShowAdminPanel(true);
           setActiveSection(SectionType.VIP);
        } else if (parsed.role === 'vip') {
           setActiveSection(SectionType.VIP);
        }
      } catch(e) {}
    }

    const loadVipData = () => {
      const today = new Date().toDateString();
      const storedUsage = localStorage.getItem(STORAGE_KEY_VIP_USAGE);
      if (storedUsage) {
        try {
          const parsed = JSON.parse(storedUsage);
          if (parsed.date === today) {
            setVipDailyCount(parsed.count);
            if (parsed.count >= VIP_DAILY_LIMIT) setVipLimitReached(true);
          } else {
            setVipDailyCount(0);
            setVipLimitReached(false);
            localStorage.removeItem(STORAGE_KEY_VIP_USAGE);
          }
        } catch(e) { setVipDailyCount(0); }
      }

      const storedHistory = localStorage.getItem(STORAGE_KEY_VIP_HISTORY);
      if (storedHistory) {
        try {
          const parsed = JSON.parse(storedHistory);
          if (parsed.date === today && parsed.predictions && parsed.predictions.length > 0) {
            setHasVipHistory(true);
          } else {
             localStorage.removeItem(STORAGE_KEY_VIP_HISTORY);
             setHasVipHistory(false);
          }
        } catch (e) { setHasVipHistory(false); }
      }
    };
    loadVipData();

    return () => clearInterval(timer);
  }, []);

  const getDeviceId = () => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = "dev-" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  };

  const handleUnlockCode = async () => {
    if (!codeEntry.trim() || !firebaseDbRef.current) return;
    if (codeEntry.trim() === ADMIN_MASTER_CODE) {
      setShowAdminConfirm(true);
      return;
    }

    try {
      const snapshot = await firebaseDbRef.current.ref(`codes/${codeEntry.trim()}`).once('value');
      const codeData = snapshot.val();

      if (!codeData) { alert("❌ Invalid code."); return; }
      if (!codeData.active) { alert("❌ Code is inactive."); return; }

      const deviceId = getDeviceId();
      if (codeData.assignedTo && codeData.assignedTo !== deviceId) {
        alert("❌ This code is already used on another device.");
        return;
      }

      const remaining = codeData.predictions - (codeData.usedPredictions || 0);
      if (remaining <= 0) { alert("❌ Code has exhausted its predictions."); return; }

      await firebaseDbRef.current.ref(`codes/${codeEntry.trim()}`).update({ assignedTo: deviceId });

      const newStatus: UserPremiumStatus = {
        role: 'vip',
        code: codeEntry.trim(),
        predictionsLeft: remaining,
        unlockedAt: Date.now()
      };
      setPremiumStatus(newStatus);
      localStorage.setItem(PREMIUM_KEY, JSON.stringify(newStatus));
      setActiveSection(SectionType.VIP);
      setCodeEntry('');
      alert(`✅ Code Accepted! You have ${remaining} VIP predictions.`);

    } catch (e) {
      console.error(e);
      alert("Error checking code. Please try again.");
    }
  };

  const verifyAdminConfirm = () => {
    if (adminConfirmEntry === ADMIN_CONFIRM_CODE) {
      const adminStatus: UserPremiumStatus = { role: 'admin' };
      setPremiumStatus(adminStatus);
      localStorage.setItem(PREMIUM_KEY, JSON.stringify(adminStatus));
      setShowAdminPanel(true);
      setShowAdminConfirm(false);
      setAdminConfirmEntry('');
      setCodeEntry('');
      setActiveSection(SectionType.VIP);
      alert("✅ Admin Mode Enabled.");
    } else {
      alert("❌ Access Denied.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(PREMIUM_KEY);
    setPremiumStatus({ role: 'free' });
    setShowAdminPanel(false);
    setActiveSection(SectionType.FREE);
    setPredictions([]);
  };

  const loadPredictions = useCallback(async (type: SectionType, count: number, market: string, forceRefresh: boolean = false) => {
    setError(null);
    
    if (type === SectionType.VIP && premiumStatus.role === 'free') {
        setPredictions([]); return; 
    }

    if (type === SectionType.FREE) {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem(STORAGE_KEY_FREE_DATE);
        const storedData = localStorage.getItem(STORAGE_KEY_FREE_DATA);

        if (storedDate === today && storedData && !forceRefresh) {
            setPredictions(JSON.parse(storedData));
            setFreeLimitReached(true);
            setLoading(false);
            setHasSearched(true);
            return;
        }
    }

    if (type === SectionType.VIP && premiumStatus.role === 'vip') {
        const today = new Date().toDateString();
        const storedVip = localStorage.getItem(STORAGE_KEY_VIP_USAGE);
        let currentCount = 0;
        
        if (storedVip) {
            const parsed = JSON.parse(storedVip);
            if (parsed.date === today) currentCount = parsed.count;
        }

        if (currentCount >= VIP_DAILY_LIMIT) {
            alert(`⚠️ VIP Daily Limit Reached (${VIP_DAILY_LIMIT}/Day). You can view your saved history.`);
            setVipLimitReached(true);
            return;
        }
        if (currentCount + count > VIP_DAILY_LIMIT) {
             alert(`⚠️ You only have ${VIP_DAILY_LIMIT - currentCount} predictions left for today.`);
             return;
        }
    }

    setPredictions([]);
    setLoading(true);
    setHasSearched(true);
    
    try {
      if (type === SectionType.VIP && premiumStatus.role === 'vip' && premiumStatus.code) {
         if (firebaseDbRef.current) {
            const codeRef = firebaseDbRef.current.ref(`codes/${premiumStatus.code}`);
            const snapshot = await codeRef.once('value');
            const data = snapshot.val();
            
            if (!data) {
                 setLoading(false);
                 setPremiumStatus({ role: 'free' });
                 localStorage.setItem(PREMIUM_KEY, JSON.stringify({ role: 'free' }));
                 setActiveSection(SectionType.FREE);
                 alert("Session expired or code invalid.");
                 return;
            }

            const currentUsed = data.usedPredictions || 0;
            const total = data.predictions || 0;
            
            await codeRef.update({ usedPredictions: currentUsed + count });
            
            const newLeft = Math.max(0, (total - (currentUsed + count)));
            const newStatus = { ...premiumStatus, predictionsLeft: newLeft };
            setPremiumStatus(newStatus);
            localStorage.setItem(PREMIUM_KEY, JSON.stringify(newStatus));
         }

         const today = new Date().toDateString();
         const storedVip = localStorage.getItem(STORAGE_KEY_VIP_USAGE);
         let currentCount = 0;
         if (storedVip) {
             const parsed = JSON.parse(storedVip);
             if (parsed.date === today) currentCount = parsed.count;
         }
         const newCount = currentCount + count;
         localStorage.setItem(STORAGE_KEY_VIP_USAGE, JSON.stringify({ date: today, count: newCount }));
         setVipDailyCount(newCount);
         if (newCount >= VIP_DAILY_LIMIT) setVipLimitReached(true);
      }

      const data = await fetchPredictions(type, count, market);
      
      if (type === SectionType.FREE && data.predictions.length > 0) {
          const today = new Date().toDateString();
          localStorage.setItem(STORAGE_KEY_FREE_DATE, today);
          localStorage.setItem(STORAGE_KEY_FREE_DATA, JSON.stringify(data.predictions));
          setFreeLimitReached(true);
      }

      if (type === SectionType.VIP && data.predictions.length > 0) {
        const today = new Date().toDateString();
        const storedHistory = localStorage.getItem(STORAGE_KEY_VIP_HISTORY);
        let existingHistory: Prediction[] = [];
        
        if (storedHistory) {
           const parsed = JSON.parse(storedHistory);
           if (parsed.date === today) existingHistory = parsed.predictions;
        }
        
        const updatedHistory = [...existingHistory, ...data.predictions];
        localStorage.setItem(STORAGE_KEY_VIP_HISTORY, JSON.stringify({
            date: today,
            predictions: updatedHistory
        }));
        setHasVipHistory(true);
      }

      setPredictions(data.predictions);
      
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to load predictions. Please try again.";
      if (err.message && (err.message.includes('Quota') || err.message.includes('Limit') || err.message.includes('429'))) {
          msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [premiumStatus]);

  useEffect(() => {
    setHasSearched(false);
    if (activeSection === SectionType.FREE) {
        loadPredictions(SectionType.FREE, FREE_USER_LIMIT, "Any");
    } else {
        setPredictions([]);
    }
  }, [activeSection, loadPredictions]); 

  const handleRefresh = () => {
    if (activeSection === SectionType.FREE && freeLimitReached) return;
    
    if (activeSection === SectionType.VIP && premiumStatus.role === 'vip') {
        if (vipLimitReached) {
            alert(`⚠️ VIP Daily Limit Reached. Resets at 12:00 AM.`);
            return;
        }
        
        const countVal = typeof predictionCount === 'number' ? predictionCount : 6;
        if ((premiumStatus.predictionsLeft || 0) < countVal) {
            alert("❌ Not enough predictions left in your code total.");
            setShowUnlockModal(true);
            return;
        }
    }

    const countVal = typeof predictionCount === 'number' ? predictionCount : 6;
    const countToFetch = activeSection === SectionType.VIP ? countVal : FREE_USER_LIMIT;
    const marketToFetch = activeSection === SectionType.VIP ? selectedMarket : "Any";
    loadPredictions(activeSection, countToFetch, marketToFetch, true);
  };

  const handleLoadVipHistory = () => {
    const today = new Date().toDateString();
    const storedHistory = localStorage.getItem(STORAGE_KEY_VIP_HISTORY);
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory);
      if (parsed.date === today && parsed.predictions) {
        setPredictions(parsed.predictions);
        setHasSearched(true);
        setError(null);
      } else {
        alert("No history found for today.");
        setHasVipHistory(false);
      }
    } else {
        alert("No history found for today.");
        setHasVipHistory(false);
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') { setPredictionCount(''); return; }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) setPredictionCount(parsed);
  };

  const handleCountBlur = () => {
    let val = typeof predictionCount === 'number' ? predictionCount : 6;
    if (val < 1) val = 1;
    if (val > VIP_DAILY_LIMIT) val = VIP_DAILY_LIMIT;
    
    if (premiumStatus.role === 'vip' && premiumStatus.predictionsLeft !== undefined) {
         if (val > premiumStatus.predictionsLeft) val = premiumStatus.predictionsLeft;
    }
    if (premiumStatus.role === 'vip') {
        const remainingDaily = VIP_DAILY_LIMIT - vipDailyCount;
        if (val > remainingDaily) val = remainingDaily;
    }
    setPredictionCount(val);
  };

  const getSkeletonCount = () => {
    if (activeSection !== SectionType.VIP) return FREE_USER_LIMIT;
    return typeof predictionCount === 'number' ? predictionCount : 6;
  };

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      
      {/* --- MODALS --- */}
      {showAdminConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
           <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
              <h3 className="text-white font-bold mb-4">Admin Security</h3>
              <input 
                 type="password" 
                 placeholder="Enter admin key..." 
                 className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mb-4 outline-none focus:border-emerald-500 transition-colors"
                 value={adminConfirmEntry}
                 onChange={e => setAdminConfirmEntry(e.target.value)}
              />
              <div className="flex gap-2">
                 <button onClick={verifyAdminConfirm} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-500 font-medium">Verify</button>
                 <button onClick={() => {setShowAdminConfirm(false); setAdminConfirmEntry('');}} className="flex-1 bg-slate-800 text-slate-400 py-2 rounded-lg hover:bg-slate-700 font-medium">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}

      {/* --- FLOATING ACTIONS --- */}
      {premiumStatus.role !== 'free' && (
        <a href="https://wa.me/233536635799" target="_blank" rel="noreferrer" className="fixed bottom-24 right-6 z-[900] bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-[0_4px_14px_rgba(37,211,102,0.4)] transition-transform hover:-translate-y-1 flex items-center justify-center group" title="VIP Support">
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform"/>
        </a>
      )}

      {premiumStatus.role === 'free' && (
        <button onClick={() => setShowUnlockModal(true)} className="fixed bottom-6 right-6 z-[900] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(245,158,11,0.4)] font-bold flex items-center gap-2 hover:scale-105 transition-all border border-white/20">
           <Crown size={18} fill="currentColor" /> <span>Upgrade to VIP</span>
        </button>
      )}

      {/* --- HEADER DASHBOARD --- */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl">
        
        {/* Left: Status & Date */}
        <div className="flex items-center gap-4">
           <div className="bg-slate-950/50 p-2 rounded-xl border border-white/5">
              <Calendar size={18} className="text-slate-400" />
           </div>
           <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Today's Date</div>
              <div className="text-sm font-medium text-slate-200">{currentDate}</div>
           </div>
           <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>
           <div className="hidden md:block">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Status</div>
              <div className={`text-sm font-bold flex items-center gap-2 ${premiumStatus.role !== 'free' ? 'text-amber-400' : 'text-emerald-400'}`}>
                 {premiumStatus.role === 'admin' ? 'Super Admin' : premiumStatus.role === 'vip' ? 'VIP Member' : 'Free Plan'}
                 {premiumStatus.role === 'vip' && <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/20">{premiumStatus.predictionsLeft} Left</span>}
              </div>
           </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <a href="https://t.me/Aibetgudie" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 rounded-lg text-sm font-bold transition-colors border border-[#0088cc]/20">
             <Send size={14} /> <span className="hidden sm:inline">Join Telegram</span>
          </a>

          {premiumStatus.role !== 'free' ? (
             <button onClick={handleLogout} className="flex-1 lg:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5">
                Sign Out
             </button>
          ) : activeSection === SectionType.VIP && (
             <div className="flex w-full lg:w-auto gap-2">
                <input 
                  type="text" 
                  placeholder="Paste Code..."
                  value={codeEntry}
                  onChange={e => setCodeEntry(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors"
                />
                <button onClick={handleUnlockCode} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Unlock
                </button>
             </div>
          )}
        </div>
      </div>

      {showAdminPanel && <AdminPanel firebaseDb={firebaseDbRef.current} />}

      {/* ================= FREE SECTION ================= */}
      {activeSection === SectionType.FREE && (
         <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <ShieldCheck size={20} className="text-emerald-500" />
                   </div>
                   Today's Free Picks
                   <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-white/5 uppercase tracking-wide">
                      Daily Top {FREE_USER_LIMIT}
                   </span>
                </h2>
                
                {!freeLimitReached && (
                  <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                  >
                     {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                     Refresh
                  </button>
                )}
             </div>

             {/* Grid */}
             {error ? (
                <div className="flex flex-col items-center justify-center py-16 bg-red-500/5 rounded-2xl border border-red-500/10">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
                    <p className="text-red-200 mb-4 text-sm">{error}</p>
                    <button onClick={() => loadPredictions(SectionType.FREE, FREE_USER_LIMIT, "Any", true)} className="px-5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold">Retry Connection</button>
                </div>
             ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl h-64 animate-pulse"></div>
                  ))}
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                   {predictions.map((pred, index) => (
                      <PredictionCard key={`${pred.homeTeam}-${index}`} prediction={pred} type={SectionType.FREE} />
                   ))}
                   {predictions.length === 0 && (
                      <div className="col-span-full text-center py-20">
                        <div className="inline-flex p-4 bg-slate-900 rounded-full mb-4 text-slate-600"><Clock size={32}/></div>
                        <h3 className="text-slate-300 font-bold">No Matches Available</h3>
                      </div>
                   )}
                </div>
             )}

             {/* Upsell Banner */}
             {premiumStatus.role === 'free' && (
                <div className="mt-8 rounded-2xl p-[1px] bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 shadow-2xl shadow-amber-900/20">
                   <div className="bg-slate-950 rounded-[15px] p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px]"></div>
                      
                      <div className="relative z-10 text-center md:text-left">
                          <h3 className="text-2xl font-black text-white italic tracking-tight mb-2">
                             WANT <span className="text-amber-400">HIGHER ODDS?</span>
                          </h3>
                          <p className="text-slate-400 text-sm max-w-lg leading-relaxed mb-6">
                             Unlock the <strong>VIP Lounge</strong> for Correct Scores, HT/FT, and 100% Analysis Confidence.
                          </p>
                          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                             <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500/90 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                                <Zap size={14} fill="currentColor"/> 90%+ Win Rate
                             </div>
                             <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500/90 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                                <Filter size={14} /> Custom Markets
                             </div>
                          </div>
                      </div>

                      <button onClick={() => setShowUnlockModal(true)} className="relative z-10 whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2">
                         UNLOCK VIP <ChevronRight size={20} strokeWidth={3} />
                      </button>
                   </div>
                </div>
             )}
         </div>
      )}


      {/* ================= VIP SECTION (LOCKED) ================= */}
      {activeSection === SectionType.VIP && premiumStatus.role === 'free' && (
         <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in duration-500">
             <div className="relative mb-8 group cursor-pointer" onClick={() => setShowUnlockModal(true)}>
                <div className="absolute inset-0 bg-amber-500 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-slate-900 p-8 rounded-full border border-amber-500/30 shadow-2xl">
                   <Lock size={64} className="text-amber-500" />
                </div>
             </div>
             
             <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight text-center">
               VIP Access <span className="text-slate-700">Restricted</span>
             </h1>
             <p className="text-slate-400 max-w-md text-center mb-8 leading-relaxed">
               Enter a valid access code to unlock our premium AI models, high-risk/high-reward markets, and unlimited generations.
             </p>

             <button 
                onClick={() => setShowUnlockModal(true)}
                className="bg-white text-slate-950 font-bold py-4 px-10 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
             >
                <Unlock size={20} /> Get Access Code
             </button>
         </div>
      )}


      {/* ================= VIP SECTION (UNLOCKED) ================= */}
      {activeSection === SectionType.VIP && premiumStatus.role !== 'free' && (
        <div className="animate-in fade-in duration-500">
          
          {/* Controls Bar */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-4 mb-8 flex flex-col xl:flex-row gap-6 items-end xl:items-center justify-between">
            <div className="w-full xl:w-auto">
               <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                  <Crown className="text-amber-400" fill="currentColor" size={24}/>
                  <span>VIP Lounge</span>
               </h2>
               <p className="text-slate-400 text-xs">AI-Powered Elite Predictions</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
              
              {hasVipHistory && (
                  <button onClick={handleLoadVipHistory} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-colors">
                     <History size={16} className="text-amber-500" /> <span className="hidden sm:inline">History</span>
                  </button>
              )}

              {/* Market Select */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center bg-slate-950 border border-slate-700 rounded-xl px-4 h-11 min-w-[200px]">
                   <Filter size={16} className="text-amber-500 mr-3" />
                   <select 
                      value={selectedMarket}
                      onChange={(e) => setSelectedMarket(e.target.value)}
                      className="bg-transparent text-sm text-white focus:outline-none w-full font-medium appearance-none cursor-pointer"
                   >
                      <option value="Any">Best Value (Recommended)</option>
                      <option value="Safe Market">Safe Market (1.20 - 1.50)</option>
                      <option value="Home or Away Win">Home or Away Win</option>
                      <option value="Draw">Draw (High Risk)</option>
                      <option value="1up">1st Half Winner</option>
                      <option value="2up">Early Payout</option>
                      <option value="Build the Bet">Build the Bet</option>
                      <option value="Over 2.5 Goals">Over 2.5 Goals</option>
                      <option value="BTTS">Both Teams to Score</option>
                      <option value="Correct Score">Correct Score (Extreme)</option>
                      <option value="HT/FT">HT/FT</option>
                   </select>
                </div>
              </div>

              {/* Count Input */}
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 h-11 w-24">
                <Hash size={16} className="text-amber-500 mr-2" />
                <input
                  type="number"
                  min={1}
                  max={VIP_DAILY_LIMIT}
                  value={predictionCount}
                  onChange={handleCountChange}
                  onBlur={handleCountBlur}
                  className="bg-transparent text-sm text-white focus:outline-none w-full font-bold text-center"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleRefresh}
                disabled={loading || vipLimitReached}
                className={`flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-bold transition-all shadow-lg ${
                  loading || vipLimitReached
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-900/20'
                }`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                {loading ? 'Analyzing...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Results Area */}
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-red-500/20 border-dashed">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-slate-300 mb-6 font-medium">{error}</p>
              <button onClick={() => loadPredictions(activeSection, getSkeletonCount(), selectedMarket, true)} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-500">Try Again</button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(getSkeletonCount())].map((_, i) => (
                <div key={i} className="relative bg-slate-900/40 rounded-2xl border border-white/5 p-6 h-80 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ transform: 'skewX(-20deg) translateX(-150%)' }}></div>
                   <div className="flex justify-between mb-8">
                      <div className="h-4 w-24 bg-slate-800 rounded"></div>
                      <div className="h-4 w-12 bg-slate-800 rounded"></div>
                   </div>
                   <div className="flex justify-between items-center mb-8 px-4">
                      <div className="h-14 w-14 rounded-full bg-slate-800"></div>
                      <div className="h-14 w-14 rounded-full bg-slate-800"></div>
                   </div>
                   <div className="h-16 bg-slate-800 rounded-xl mb-4 w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {predictions.map((pred, index) => (
                  <PredictionCard key={`${pred.homeTeam}-${index}`} prediction={pred} type={activeSection} />
                ))}
            </div>
          )}

          {!loading && predictions.length === 0 && !error && (
            <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-3xl">
               <div className="inline-flex p-6 bg-slate-900 rounded-full mb-6 shadow-inner">
                  <Filter size={48} className="text-slate-700" />
               </div>
               <h3 className="text-slate-200 text-xl font-bold mb-2">Ready to Analyze</h3>
               <p className="text-slate-500 max-w-sm mx-auto">
                 Select your preferred market and number of matches above, then hit <strong>Generate</strong> to start the AI.
               </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;