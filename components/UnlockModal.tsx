import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, CreditCard, Smartphone, CheckCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 ring-1 ring-white/10">
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 p-8 border-b border-slate-800">
           <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all">
             <X size={20} />
           </button>
           <h3 className="text-2xl font-black text-white mb-2">
              Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">VIP Access</span>
           </h3>
           <p className="text-slate-400 text-sm">Choose a package to get your instant access code.</p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { price: "$2 / 20GH", count: "50", color: "from-blue-500 to-cyan-500" },
              { price: "$10 / 120GH", count: "100", color: "from-emerald-500 to-teal-500", recommended: true },
              { price: "$25 / 300GH", count: "350", color: "from-purple-500 to-indigo-500" }
            ].map((pkg) => (
              <a 
                key={pkg.count}
                href={`https://wa.me/233536635799?text=Hello,+I+paid+${pkg.price}+for+${pkg.count}+Predictions`}
                target="_blank"
                rel="noreferrer"
                className={`relative group flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${pkg.recommended ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
              >
                {pkg.recommended && (
                  <span className="absolute -top-3 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Best Value</span>
                )}
                <span className={`text-lg font-bold mb-1 ${pkg.recommended ? 'text-emerald-400' : 'text-white'}`}>{pkg.price}</span>
                <span className="text-xs text-slate-500 font-medium group-hover:text-slate-300">{pkg.count} Predictions</span>
              </a>
            ))}
          </div>

          {/* Payment Method */}
          <div>
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">How to Pay</h4>
             <div className="bg-slate-900 rounded-2xl p-1 border border-slate-800">
                <div className="flex items-center gap-4 p-4 border-b border-slate-800/50">
                   <div className="bg-amber-500/20 p-2 rounded-lg">
                      <Smartphone size={20} className="text-amber-500" />
                   </div>
                   <div className="flex-1">
                      <div className="text-sm font-bold text-slate-200">Mobile Money (MTN)</div>
                      <div className="text-xs text-slate-500">Tap copy icon to copy number</div>
                   </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl m-2">
                   <span className="font-mono text-lg font-bold text-emerald-400 tracking-wider">{momoNumber}</span>
                   <button 
                     onClick={handleCopy}
                     className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                   >
                     {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                     {copied ? 'Copied' : 'Copy'}
                   </button>
                </div>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
             <a 
               href="https://wa.me/233536635799?text=Hello,+I+have+sent+payment,+please+give+me+code" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 w-full p-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
             >
               <MessageCircle size={18} fill="currentColor" />
               <span>Send Payment Proof on WhatsApp</span>
             </a>
             
             <button className="flex items-center justify-center gap-2 w-full p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors border border-slate-700">
               <CreditCard size={18} />
               <span>Pay via Card (Coming Soon)</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;