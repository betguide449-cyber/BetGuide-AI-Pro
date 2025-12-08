import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, CreditCard, Smartphone } from 'lucide-react';

interface UnlockModalProps {
  onClose: () => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const momoNumber = "0536635799";

  const handleCopy = () => {
    navigator.clipboard.writeText(momoNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition">
            <X size={20} />
          </button>
          <h3 className="text-xl font-bold flex items-center gap-2">
             🔑 Get VIP Unlock Code
          </h3>
          <p className="text-emerald-100 text-sm mt-1">Unlock unlimited high-confidence predictions.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Packages */}
          <div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Select Package</h4>
            <div className="grid grid-cols-3 gap-3">
              <a 
                href={`https://wa.me/233536635799?text=Hello,+I+paid+$2/20GH+for+50+Predictions,+please+send+my+VIP+unlock+code`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-slate-700 rounded-lg p-3 text-center transition-all cursor-pointer group"
              >
                <div className="text-white font-bold">$2 / 20GH</div>
                <div className="text-slate-500 group-hover:text-emerald-400 text-[10px] font-medium">50 Predictions</div>
              </a>
              <a 
                href={`https://wa.me/233536635799?text=Hello,+I+paid+$10/120GH+for+100+Predictions,+please+send+my+VIP+unlock+code`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-slate-700 rounded-lg p-3 text-center transition-all cursor-pointer group"
              >
                <div className="text-white font-bold">$10 / 120GH</div>
                <div className="text-slate-500 group-hover:text-emerald-400 text-[10px] font-medium">100 Predictions</div>
              </a>
              <a 
                href={`https://wa.me/233536635799?text=Hello,+I+paid+$25/300GH+for+350+Predictions,+please+send+my+VIP+unlock+code`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-slate-700 rounded-lg p-3 text-center transition-all cursor-pointer group"
              >
                <div className="text-white font-bold">$25 / 300GH</div>
                <div className="text-slate-500 group-hover:text-emerald-400 text-[10px] font-medium">350 Predictions</div>
              </a>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
               <div className="flex items-center gap-2 mb-2 text-white font-medium">
                 <Smartphone size={18} className="text-amber-400" />
                 <span>Mobile Money (Ghana Only)</span>
               </div>
               <div className="flex items-center justify-between bg-slate-900 rounded-lg p-3 border border-slate-800">
                 <span className="font-mono text-lg text-slate-300 tracking-wide">{momoNumber}</span>
                 <button 
                   onClick={handleCopy}
                   className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-md transition-colors"
                 >
                   {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                 </button>
               </div>
               <p className="text-xs text-slate-500 mt-2">Send payment via MTN MoMo and send screenshot via WhatsApp.</p>
             </div>

             <a href="#" className="flex items-center justify-center gap-2 w-full p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700">
                <CreditCard size={18} />
                <span>Pay with Visa Card</span>
             </a>
          </div>

          {/* WhatsApp Button */}
          <a 
            href="https://wa.me/233536635799?text=Hello,+I+want+my+VIP+unlock+code" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20"
          >
            <MessageCircle size={20} fill="currentColor" />
            <span>Send Proof on WhatsApp</span>
          </a>

        </div>
      </div>
    </div>
  );
};

export default UnlockModal;