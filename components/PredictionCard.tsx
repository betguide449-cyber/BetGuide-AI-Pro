import React from 'react';
import { Prediction, SectionType } from '../types';
import { ArrowRight, TrendingUp, Clock } from 'lucide-react';

interface PredictionCardProps {
  prediction: Prediction;
  type: SectionType;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, type }) => {
  const isVip = type === SectionType.VIP;

  // Dynamic styling based on confidence
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
    if (conf >= 60) return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case 'medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      case 'high': return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
      default: return 'text-slate-400 border-slate-600';
    }
  };

  return (
    <div className={`relative group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${
      isVip 
        ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.1)]' 
        : 'bg-slate-900 border border-slate-800 hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]'
    }`}>
      {isVip && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-lg ring-4 ring-slate-950">
          <TrendingUp size={10} strokeWidth={3} /> Premium Pick
        </div>
      )}

      {/* Header: League & Time */}
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
          {prediction.league}
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-800">
          <Clock size={12} /> {prediction.kickoffTime}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 text-center group-hover:scale-105 transition-transform duration-300">
          <div className="w-14 h-14 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-3 text-xl font-bold text-slate-300 shadow-inner ring-1 ring-white/5">
            {prediction.homeTeam.charAt(0)}
          </div>
          <h3 className="text-sm font-bold text-slate-200 leading-tight px-1">{prediction.homeTeam}</h3>
        </div>
        <div className="px-2 text-slate-600 flex flex-col items-center">
            <span className="text-[10px] text-slate-600 font-medium mb-1">VS</span>
          <div className="bg-slate-800 rounded-full p-1.5">
            <ArrowRight size={14} className="text-slate-500" />
          </div>
        </div>
        <div className="flex-1 text-center group-hover:scale-105 transition-transform duration-300">
          <div className="w-14 h-14 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-3 text-xl font-bold text-slate-300 shadow-inner ring-1 ring-white/5">
            {prediction.awayTeam.charAt(0)}
          </div>
          <h3 className="text-sm font-bold text-slate-200 leading-tight px-1">{prediction.awayTeam}</h3>
        </div>
      </div>

      {/* Prediction Box */}
      <div className={`rounded-2xl p-4 mb-5 text-center backdrop-blur-sm ${isVip ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-emerald-500/5 border border-emerald-500/10'}`}>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Recommended Bet</p>
        <div className={`text-lg font-black mb-2 ${isVip ? 'text-amber-100' : 'text-emerald-50'}`}>{prediction.prediction}</div>
        <div className="flex justify-center items-center gap-2">
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${isVip ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>
                {prediction.odds.toFixed(2)}
            </span>
             <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${getRiskColor(prediction.riskLevel)}`}>
                {prediction.riskLevel}
            </span>
        </div>
      </div>

      {/* Analysis & Confidence */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">AI Probability</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence}%
            </span>
        </div>
        <div className="w-full bg-slate-800/50 rounded-full h-1.5 mb-4 overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isVip ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`} 
                style={{ width: `${prediction.confidence}%` }}
            ></div>
        </div>
        
        <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-slate-700/50 pl-3">
          {prediction.analysis}
        </p>
      </div>
    </div>
  );
};

export default PredictionCard;
