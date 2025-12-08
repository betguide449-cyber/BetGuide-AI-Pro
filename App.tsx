import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import PredictionCard from './components/PredictionCard';
import { SectionType, Prediction, UserPremiumStatus } from './types';
import { fetchPredictions } from './services/geminiService';
import { Loader2, RefreshCcw, AlertCircle, Hash, Filter, Lock, Clock, Calendar, Crown, ArrowRight, Zap, Target, TrendingUp, Info, Unlock, CheckCircle, Send, MessageCircle, ShieldCheck, History } from 'lucide-react';
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
const STORAGE_KEY_VIP_USAGE = 'betGuide_vip_usage'; // Tracks count
const STORAGE_KEY_VIP_HISTORY = 'betGuide_vip_history'; // Tracks actual data
const PREMIUM_KEY = 'premium_v6';
const DEVICE_ID_KEY = 'deviceId_v6';

// Constants
const FREE_USER_LIMIT = 4;
const VIP_DAILY_LIMIT = 30; // New Daily Limit for VIP
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
  // Initialize freeLimitReached directly from storage to prevent flicker
  const [freeLimitReached, setFreeLimitReached] = useState<boolean>(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(STORAGE_KEY_FREE_DATE);
    const storedData = localStorage.getItem(STORAGE_KEY_FREE_DATA);
    return storedDate === today && !!storedData;
  });

  const [vipLimitReached, setVipLimitReached] = useState<boolean>(false); // Track VIP daily limit
  const [vipDailyCount, setVipDailyCount] = useState<number>(0); // Track current VIP usage
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

  // Initialize Firebase and User Data
  useEffect(() => {
    // 1. Date Clock
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };
    updateDate();
    const timer = setInterval(updateDate, 60000);

    // 2. Initialize Firebase
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
        // Check if already initialized
        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
        }
        firebaseDbRef.current = window.firebase.database();
      } catch (e) {
        console.error("Firebase init error:", e);
      }
    }

    // 3. Load Premium Status from LocalStorage
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

    // 4. Load VIP Daily Usage & History Status
    const loadVipData = () => {
      const today = new Date().toDateString();
      
      // Check Usage Count
      const storedUsage = localStorage.getItem(STORAGE_KEY_VIP_USAGE);
      if (storedUsage) {
        try {
          const parsed = JSON.parse(storedUsage);
          if (parsed.date === today) {
            setVipDailyCount(parsed.count);
            if (parsed.count >= VIP_DAILY_LIMIT) setVipLimitReached(true);
          } else {
            // New day, reset usage
            setVipDailyCount(0);
            setVipLimitReached(false);
            localStorage.removeItem(STORAGE_KEY_VIP_USAGE);
          }
        } catch(e) { setVipDailyCount(0); }
      }

      // Check History Existence
      const storedHistory = localStorage.getItem(STORAGE_KEY_VIP_HISTORY);
      if (storedHistory) {
        try {
          const parsed = JSON.parse(storedHistory);
          if (parsed.date === today && parsed.predictions && parsed.predictions.length > 0) {
            setHasVipHistory(true);
          } else {
             // New day, clear history
             localStorage.removeItem(STORAGE_KEY_VIP_HISTORY);
             setHasVipHistory(false);
          }
        } catch (e) { setHasVipHistory(false); }
      }
    };
    loadVipData();

    return () => clearInterval(timer);
  }, []);

  // Helper: Device ID
  const getDeviceId = () => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = "dev-" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  };

  // --- Code Verification Logic ---

  const handleUnlockCode = async () => {
    if (!codeEntry.trim() || !firebaseDbRef.current) return;

    // Check for Admin Master Code
    if (codeEntry.trim() === ADMIN_MASTER_CODE) {
      setShowAdminConfirm(true);
      return;
    }

    // Check Firebase for VIP Code
    try {
      const snapshot = await firebaseDbRef.current.ref(`codes/${codeEntry.trim()}`).once('value');
      const codeData = snapshot.val();

      if (!codeData) {
        alert("❌ Invalid code.");
        return;
      }
      if (!codeData.active) {
        alert("❌ Code is inactive.");
        return;
      }

      const deviceId = getDeviceId();
      if (codeData.assignedTo && codeData.assignedTo !== deviceId) {
        alert("❌ This code is already used on another device.");
        return;
      }

      const remaining = codeData.predictions - (codeData.usedPredictions || 0);
      if (remaining <= 0) {
        alert("❌ Code has exhausted its predictions.");
        return;
      }

      // Valid Code: Bind to device
      await firebaseDbRef.current.ref(`codes/${codeEntry.trim()}`).update({ assignedTo: deviceId });

      // Save Local State
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

  // --- Prediction Logic ---

  const loadPredictions = useCallback(async (type: SectionType, count: number, market: string, forceRefresh: boolean = false) => {
    setError(null);
    
    // Prevent free users from fetching VIP
    if (type === SectionType.VIP && premiumStatus.role === 'free') {
        setPredictions([]);
        return; 
    }

    // FREE SECTION LOGIC: Check LocalStorage Cache
    if (type === SectionType.FREE) {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem(STORAGE_KEY_FREE_DATE);
        const storedData = localStorage.getItem(STORAGE_KEY_FREE_DATA);

        // If data exists for today, load it and STOP.
        if (storedDate === today && storedData && !forceRefresh) {
            setPredictions(JSON.parse(storedData));
            setFreeLimitReached(true);
            setLoading(false);
            setHasSearched(true);
            return;
        }
    }

    // VIP SECTION LOGIC: Check Daily Limit
    if (type === SectionType.VIP && premiumStatus.role === 'vip') {
        const today = new Date().toDateString();
        const storedVip = localStorage.getItem(STORAGE_KEY_VIP_USAGE);
        let currentCount = 0;
        
        if (storedVip) {
            const parsed = JSON.parse(storedVip);
            if (parsed.date === today) {
                currentCount = parsed.count;
            }
        }

        if (currentCount >= VIP_DAILY_LIMIT) {
            alert(`⚠️ VIP Daily Limit Reached (${VIP_DAILY_LIMIT}/Day). You can view your saved history.`);
            setVipLimitReached(true);
            return;
        }

        if (currentCount + count > VIP_DAILY_LIMIT) {
             const remaining = VIP_DAILY_LIMIT - currentCount;
             alert(`⚠️ You only have ${remaining} predictions left for today.`);
             return;
        }
    }

    setPredictions([]);
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Logic for VIP Code Consumption (Total Pool)
      if (type === SectionType.VIP && premiumStatus.role === 'vip' && premiumStatus.code) {
        // Decrease usage count in Firebase
         if (firebaseDbRef.current) {
            const codeRef = firebaseDbRef.current.ref(`codes/${premiumStatus.code}`);
            const snapshot = await codeRef.once('value');
            const data = snapshot.val();
            const currentUsed = data.usedPredictions || 0;
            const total = data.predictions || 0;
            
            // Update usage
            await codeRef.update({ usedPredictions: currentUsed + count });
            
            // Update local state
            const newLeft = Math.max(0, (total - (currentUsed + count)));
            const newStatus = { ...premiumStatus, predictionsLeft: newLeft };
            setPremiumStatus(newStatus);
            localStorage.setItem(PREMIUM_KEY, JSON.stringify(newStatus));
         }

         // Update VIP Daily Usage LocalStorage
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
      
      // Save Free Predictions to Cache
      if (type === SectionType.FREE && data.predictions.length > 0) {
          const today = new Date().toDateString();
          localStorage.setItem(STORAGE_KEY_FREE_DATE, today);
          localStorage.setItem(STORAGE_KEY_FREE_DATA, JSON.stringify(data.predictions));
          setFreeLimitReached(true);
      }

      // Save VIP Predictions to Daily History Cache
      if (type === SectionType.VIP && data.predictions.length > 0) {
        const today = new Date().toDateString();
        const storedHistory = localStorage.getItem(STORAGE_KEY_VIP_HISTORY);
        let existingHistory: Prediction[] = [];
        
        if (storedHistory) {
           const parsed = JSON.parse(storedHistory);
           if (parsed.date === today) {
              existingHistory = parsed.predictions;
           }
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
          msg = err.message; // Use the specific error from service
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [premiumStatus]);

  // Initial load logic - Controlled by Section Switch
  useEffect(() => {
    // Reset search state on section switch
    setHasSearched(false);

    if (activeSection === SectionType.FREE) {
        // Automatically load for Free section (will hit cache if exists)
        loadPredictions(SectionType.FREE, FREE_USER_LIMIT, "Any");
    } else {
        // For VIP, DO NOT auto-load. 
        setPredictions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]); 

  const handleRefresh = () => {
    // Free User cannot refresh manually if limit reached
    if (activeSection === SectionType.FREE && freeLimitReached) {
        return; 
    }
    
    // VIP Check
    if (activeSection === SectionType.VIP && premiumStatus.role === 'vip') {
        if (vipLimitReached) {
            alert(`⚠️ VIP Daily Limit Reached (${VIP_DAILY_LIMIT}/Day). Resets at 12:00 AM.`);
            return;
        }
        
        const countVal = typeof predictionCount === 'number' ? predictionCount : 6;
        if ((premiumStatus.predictionsLeft || 0) < countVal) {
            alert("❌ Not enough predictions left in your code total. Please top up.");
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
    if (val === '') {
      setPredictionCount('');
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      setPredictionCount(parsed);
    }
  };

  const handleCountBlur = () => {
    let val = typeof predictionCount === 'number' ? predictionCount : 6;
    if (val < 1) val = 1;
    // Set Max to 30 for daily limit logic
    if (val > VIP_DAILY_LIMIT) val = VIP_DAILY_LIMIT;
    
    // Cap at remaining limits for VIP (Total Code Limit)
    if (premiumStatus.role === 'vip' && premiumStatus.predictionsLeft !== undefined) {
         if (val > premiumStatus.predictionsLeft) val = premiumStatus.predictionsLeft;
    }
    
    // Cap at remaining Daily Limit
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

  const renderConfigurationGuide = () => (
    <div className="mt-5 p-6 bg-slate-900/40 rounded-xl border border-slate-800/60 max-w-2xl mx-auto shadow-xl text-left">
       <div className="flex items-center gap-2 mb-4">
         <Info size={16} className="text-amber-500" />
         <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">VIP Feature Guide</span>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="flex flex-col gap-2">
           <span className="text-xs font-bold text-amber-500/90 flex items-center gap-2">
             <Filter size={12} /> Market Selector
           </span>
           <p className="text-xs text-slate-400 leading-relaxed">
             Direct the AI to hunt for specific high-value targets (e.g., 'Correct Score', 'HT/FT') or use <span className="text-slate-300 font-medium">Any Best Value</span> for the highest probability outcome across all markets.
           </p>
         </div>
         <div className="flex flex-col gap-2">
           <span className="text-xs font-bold text-amber-500/90 flex items-center gap-2">
             <Hash size={12} /> Custom Match Count
           </span>
           <p className="text-xs text-slate-400 leading-relaxed">
             You control the volume. Generate between 1 to {VIP_DAILY_LIMIT} deep-analysis predictions instantly to fit your betting strategy.
           </p>
         </div>
       </div>
    </div>
  );

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      
      {/* --- ADMIN CONFIRM MODAL --- */}
      {showAdminConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4">
           <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm">
              <h3 className="text-white font-bold mb-4">Admin Security</h3>
              <input 
                 type="password" 
                 placeholder="Enter admin key..." 
                 className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mb-4 outline-none focus:border-emerald-500"
                 value={adminConfirmEntry}
                 onChange={e => setAdminConfirmEntry(e.target.value)}
              />
              <div className="flex gap-2">
                 <button onClick={verifyAdminConfirm} className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-500">Verify</button>
                 <button onClick={() => {setShowAdminConfirm(false); setAdminConfirmEntry('');}} className="flex-1 bg-slate-800 text-slate-400 py-2 rounded hover:bg-slate-700">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {/* --- UNLOCK MODAL --- */}
      {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}

      {/* --- FLOATING BUTTONS --- */}
      
      {/* 2. WhatsApp (VIP LOCKED) - Only show if VIP/Admin */}
      {premiumStatus.role !== 'free' && (
        <a 
          href="https://wa.me/233536635799"
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 right-6 z-[900] bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-[0_4px_14px_rgba(37,211,102,0.4)] transition-transform hover:-translate-y-1 flex items-center justify-center animate-in zoom-in duration-300"
          title="VIP Support"
        >
          <MessageCircle size={24} />
        </a>
      )}

      {/* 3. Get Unlock Code (Show if FREE) */}
      {premiumStatus.role === 'free' && (
        <button 
          onClick={() => setShowUnlockModal(true)}
          className="fixed bottom-6 left-6 z-[900] bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-3 rounded-full shadow-[0_4px_14px_rgba(16,185,129,0.4)] font-bold flex items-center gap-2 hover:scale-105 transition-all"
        >
           <Unlock size={18} /> Get Unlock Code
        </button>
      )}


      {/* --- HEADER: CODE ENTRY & STATUS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-8 backdrop-blur-sm gap-4">
        {/* Status Display */}
        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
          
          {/* Telegram Button */}
          <a 
             href="tg://resolve?domain=Aibetgudie"
             onClick={(e) => {
                setTimeout(() => { window.open('https://t.me/Aibetgudie', '_blank'); }, 500);
             }}
             className="flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-[0_2px_10px_rgba(0,136,204,0.3)]"
          >
             <Send size={14} />
             Telegram
          </a>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
             <Calendar size={12} className={premiumStatus.role !== 'free' ? "text-amber-500" : "text-emerald-500"} />
             <span>{currentDate}</span>
          </div>
          <div className="text-sm">
             <span className="text-slate-500 mr-1">Status:</span>
             {premiumStatus.role === 'admin' ? (
                <span className="text-amber-400 font-bold">SUPER VIP (Admin)</span>
             ) : premiumStatus.role === 'vip' ? (
                <span className="text-amber-400 font-bold flex flex-col md:flex-row md:items-center gap-1">
                    <span>VIP ({premiumStatus.predictionsLeft} Total)</span>
                    <span className="text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        Today: {vipDailyCount} / {VIP_DAILY_LIMIT}
                    </span>
                </span>
             ) : (
                <span className="text-emerald-400 font-medium">Free User</span>
             )}
          </div>
        </div>

        {/* Code Input Area */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {premiumStatus.role !== 'free' ? (
             <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Logout / Reset
             </button>
          ) : activeSection === SectionType.VIP && (
            <>
              <input 
                type="text" 
                placeholder="Enter Unlock Code..."
                value={codeEntry}
                onChange={e => setCodeEntry(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 w-full md:w-48"
              />
              <button 
                onClick={handleUnlockCode}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors"
              >
                Unlock
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- ADMIN PANEL --- */}
      {showAdminPanel && <AdminPanel firebaseDb={firebaseDbRef.current} />}


      {/* ================= SECTION LOGIC ================= */}
      
      {/* CASE 1: FREE SECTION */}
      {activeSection === SectionType.FREE && (
         <div className="animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <ShieldCheck className="text-emerald-500" />
                   <span>Daily Free Tips</span>
                   {freeLimitReached && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">Limit Reached</span>}
                </h2>
                
                {freeLimitReached ? (
                  <button disabled className="bg-slate-800/50 text-slate-500 px-4 py-2 rounded-lg text-sm font-medium border border-slate-800 cursor-not-allowed">
                     Predictions Locked for Today
                  </button>
                ) : (
                  <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600/20 rounded-lg text-sm font-medium transition-all"
                  >
                     {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                     Refresh Tips
                  </button>
                )}
             </div>

             {/* Predictions Grid */}
             {error ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-red-500/20">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                    <p className="text-slate-300 mb-4">{error}</p>
                    <button onClick={() => loadPredictions(SectionType.FREE, FREE_USER_LIMIT, "Any", true)} className="px-6 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full">Try Again</button>
                </div>
             ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(FREE_USER_LIMIT)].map((_, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 animate-pulse"></div>
                  ))}
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                   {predictions.map((pred, index) => (
                      <PredictionCard key={`${pred.homeTeam}-${index}`} prediction={pred} type={SectionType.FREE} />
                   ))}
                   {predictions.length === 0 && !loading && (
                      <div className="col-span-full text-center py-20 text-slate-500">No free tips available at the moment.</div>
                   )}
                </div>
             )}

             {/* VIP UPSELL BANNER (Visible only to Free users) */}
             {premiumStatus.role === 'free' && (
             <div className="relative rounded-3xl overflow-hidden mt-10 p-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600">
                <div className="bg-slate-950 rounded-[22px] p-8 md:p-12 relative overflow-hidden">
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left max-w-2xl">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-4 italic">
                                UNLOCK <span className="text-amber-400">GOD MODE</span>
                            </h3>
                            <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                                Our VIP AI runs <strong className="text-white">6-Step Deep Analysis</strong> on every match.
                                Unlock specific markets like <span className="text-amber-200">Correct Score</span>, <span className="text-amber-200">HT/FT</span>, and <span className="text-amber-200">Accumulators</span> with 95% accuracy confidence.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm font-medium text-slate-400">
                                <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-500"/> Unlimited Predictions</span>
                                <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-500"/> Custom Markets</span>
                                <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-500"/> High Odds Targets</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 min-w-[200px]">
                            <button 
                                onClick={() => setShowUnlockModal(true)}
                                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-4 px-8 rounded-xl shadow-lg shadow-amber-500/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <Unlock size={20} />
                                UNLOCK NOW
                            </button>
                            <p className="text-xs text-slate-500">Instant access code via WhatsApp</p>
                        </div>
                    </div>
                </div>
             </div>
             )}
         </div>
      )}


      {/* CASE 2: VIP SECTION (LOCKED) */}
      {activeSection === SectionType.VIP && premiumStatus.role === 'free' && (
         <div className="text-center py-16 animate-in fade-in duration-500">
             <div className="inline-flex items-center justify-center p-6 bg-slate-900 rounded-full mb-8 ring-1 ring-slate-800 shadow-2xl">
               <Lock size={64} className="text-slate-700" />
             </div>
             
             <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
               VIP Lounge <span className="text-slate-700">Locked</span>
             </h1>
             
             <p className="text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
               This area requires a valid access code. <br/>
               Please enter your code in the header or click below to get one.
             </p>

             <button 
                onClick={() => setShowUnlockModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
             >
                Get Unlock Code
             </button>

             {/* Configuration Guide (Visible as teaser) */}
             {renderConfigurationGuide()}
         </div>
      )}


      {/* CASE 3: VIP SECTION (UNLOCKED) */}
      {activeSection === SectionType.VIP && premiumStatus.role !== 'free' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex flex-col xl:flex-row justify-between items-end xl:items-start mb-8 gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                 <span className="flex items-center gap-2">
                   <Crown className="text-amber-400" fill="currentColor" />
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-200">
                     VIP Lounge
                   </span>
                 </span>
              </h1>
              <p className="text-slate-400 text-sm max-w-lg">
                High-value opportunities curated by our advanced AI model. Customize your strategy below.
              </p>
            </div>
            
            {/* VIP CONTROLS */}
            <div className="flex flex-wrap items-center gap-3 justify-end xl:self-center">
              
              {/* Load History Button */}
              {hasVipHistory && (
                  <button 
                     onClick={handleLoadVipHistory}
                     className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors h-10"
                     title="View today's saved VIP predictions"
                  >
                     <History size={16} className="text-amber-500" />
                     <span>Today's History</span>
                  </button>
              )}

              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 h-10 ring-1 ring-white/5 focus-within:ring-amber-500/50 focus-within:border-amber-500/50 transition-all">
                <Filter size={14} className="text-amber-500" />
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:inline">Market:</span>
                <select 
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none font-medium cursor-pointer [&>option]:bg-slate-900"
                >
                  <option value="Any">Any Best Value</option>
                  <option value="Safe Market">Safe Market (Low Risk)</option>
                  <option value="Home or Away Win">Home or Away Win (FT)</option>
                  <option value="Draw">Draw (FT)</option>
                  <option value="1up">1up (1st Half Winner)</option>
                  <option value="2up">2up (Early Payout)</option>
                  <option value="Build the Bet">Build the Bet (Combo)</option>
                  <option value="Over 2.5 Goals">Over 2.5 Goals</option>
                  <option value="Under 2.5 Goals">Under 2.5 Goals</option>
                  <option value="BTTS">Both Teams to Score (Yes/No)</option>
                  <option value="BTTS & Over 2.5">BTTS & Over 2.5 Goals</option>
                  <option value="Win & Over 2.5 Goals">Win & Over 2.5 Goals</option>
                  <option value="Correct Score">Correct Score</option>
                  <option value="HT/FT">HT/FT</option>
                  <option value="Over 1.5 Goals">Over 1.5 Goals</option>
                  <option value="Home Team Over 1.5 Goals">Home Team Over 1.5 Goals</option>
                  <option value="Away Team Over 1.5 Goals">Away Team Over 1.5 Goals</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 h-10 ring-1 ring-white/5 focus-within:ring-amber-500/50 focus-within:border-amber-500/50 transition-all">
                <Hash size={14} className="text-amber-500" />
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap hidden sm:inline">Matches:</span>
                <input
                  type="number"
                  min={1}
                  max={VIP_DAILY_LIMIT}
                  value={predictionCount}
                  onChange={handleCountChange}
                  onBlur={handleCountBlur}
                  className="w-14 bg-transparent text-sm text-white focus:outline-none text-center appearance-none font-bold placeholder-slate-600"
                  placeholder="6"
                />
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading || (activeSection === SectionType.VIP && vipLimitReached)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors h-10 ${
                  loading || vipLimitReached
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                {loading ? 'Scanning...' : vipLimitReached ? 'Daily Limit' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Configuration Guide (VIP Context) */}
          {renderConfigurationGuide()}
          <div className="mb-8"></div>

          {/* Content Area */}
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-red-500/20">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <p className="text-slate-300 mb-4">{error}</p>
              <button 
                onClick={() => loadPredictions(activeSection, getSkeletonCount(), selectedMarket, true)}
                className="px-6 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-full transition"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(getSkeletonCount())].map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer"></div>
                  <div className="flex justify-between mb-6">
                    <div className="h-4 w-20 bg-slate-800 rounded"></div>
                    <div className="h-4 w-12 bg-slate-800 rounded"></div>
                  </div>
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-12 w-12 rounded-full bg-slate-800"></div>
                    <div className="h-12 w-12 rounded-full bg-slate-800"></div>
                  </div>
                  <div className="h-20 bg-slate-800 rounded-xl mb-4"></div>
                  <div className="h-4 w-full bg-slate-800 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {predictions.map((pred, index) => (
                  <PredictionCard 
                    key={`${pred.homeTeam}-${index}`} 
                    prediction={pred} 
                    type={activeSection} 
                  />
                ))}
            </div>
          )}

          {!loading && predictions.length === 0 && !error && (
            <div className="text-center py-20 text-slate-500">
              {hasSearched 
                ? 'No suitable matches found based on your filters. Try selecting "Any Best Value".'
                : 'Select your market and count above, then click "Refresh" to generate VIP predictions.'}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;