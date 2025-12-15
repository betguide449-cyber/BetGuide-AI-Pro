import React from 'react';
import { Prediction, SectionType } from '../types';
import { TrendingUp, Clock, Target, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PredictionCardProps {
  prediction: Prediction;
  type: SectionType;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, type }) => {
  const isVip = type === SectionType.VIP;

  // Confidence calculations
  const confidenceColor = prediction.confidence >= 80 ? 'text-emerald-400' : prediction.confidence >= 60 ? 'text-amber-400' : 'text-rose-400';
  const confidenceBg = prediction.confidence >= 80 ? 'bg-emerald-500' : prediction.confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500';

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return <Shield size={12} className="text-emerald-400" />;
      case 'medium': return <CheckCircle2 size={12} className="text-amber-400" />;
      case 'high': return <AlertTriangle size={12} className="text-rose-400" />;
      default: return null;
    }
  };

  return (
    <div className={`group relative flex flex-col h-full rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
      isVip 
        ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/20 hover:border-amber-500/40 shadow-lg shadow-black/40' 
        : 'bg-slate-900/60 backdrop-blur-md border border-white/5 hover:border-emerald-500/30 shadow-lg shadow-black/20'
    }`}>
      
      {/* VIP Badge */}
      {isVip && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
           <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(245,158,11,0.4)] flex items-center gap-1 border border-white/20">
             <TrendingUp size={10} strokeWidth={3} /> Premium
           </div>
        </div>
      )}

      {/* Card Header: League & Time */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
           <div className={`w-1 h-4 rounded-full ${isVip ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]" title={prediction.league}>
             {prediction.league}
           </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-black/20 px-2 py-1 rounded-md">
           <Clock size={12} />
           <span>{prediction.kickoffTime}</span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="px-5 py-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 text-center group-hover:scale-105 transition-transform duration-300">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center shadow-inner">
               <span className="text-lg font-bold text-slate-300">{prediction.homeTeam.charAt(0)}</span>
             </div>
             <span className="text-xs font-bold text-slate-200 leading-tight line-clamp-2 h-8 flex items-center justify-center">
               {prediction.homeTeam}
             </span>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center gap-1">
             <span className="text-[10px] font-black text-slate-600 tracking-wider">VS</span>
             <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 text-center group-hover:scale-105 transition-transform duration-300">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center shadow-inner">
               <span className="text-lg font-bold text-slate-300">{prediction.awayTeam.charAt(0)}</span>
             </div>
             <span className="text-xs font-bold text-slate-200 leading-tight line-clamp-2 h-8 flex items-center justify-center">
               {prediction.awayTeam}
             </span>
          </div>
        </div>

        {/* Prediction Main Block */}
        <div className="relative overflow-hidden rounded-xl bg-slate-950/50 border border-white/5 p-4 mb-4 text-center">
           <div className={`absolute top-0 left-0 w-1 h-full ${isVip ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
           <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
             <Target size={12} /> AI Prediction
           </p>
           <div className={`text-base font-black ${isVip ? 'text-amber-100' : 'text-emerald-50'} mb-2`}>
             {prediction.prediction}
           </div>
           
           <div className="flex justify-center items-center gap-2">
             <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-mono font-bold bg-white/5 border border-white/5 ${isVip ? 'text-amber-400' : 'text-emerald-400'}`}>
                @{prediction.odds.toFixed(2)}
             </span>
             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 uppercase">
                {getRiskIcon(prediction.riskLevel)}
                {prediction.riskLevel}
             </span>
           </div>
        </div>

        {/* Confidence & Analysis */}
        <div className="space-y-3">
           <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Confidence Model</span>
              <span className={`text-xs font-bold ${confidenceColor}`}>{prediction.confidence}%</span>
           </div>
           
           <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
             <div 
               className={`h-full rounded-full ${confidenceBg} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`}
               style={{ width: `${prediction.confidence}%`, opacity: 0.8 }}
             ></div>
           </div>

           <p className="text-[11px] leading-relaxed text-slate-400 line-clamp-2 min-h-[2.5em] pl-2 border-l-2 border-slate-800">
              {prediction.analysis}
           </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;