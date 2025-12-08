import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Power, Plus, ShieldAlert } from 'lucide-react';
import { VipCode } from '../types';

interface AdminPanelProps {
  firebaseDb: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ firebaseDb }) => {
  const [codes, setCodes] = useState<Record<string, VipCode>>({});
  const [newCode, setNewCode] = useState('');
  const [newPredictions, setNewPredictions] = useState(30);
  const [loading, setLoading] = useState(false);

  const fetchCodes = () => {
    if (!firebaseDb) return;
    setLoading(true);
    firebaseDb.ref('codes').once('value').then((snapshot: any) => {
      setCodes(snapshot.val() || {});
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCodes();
  }, [firebaseDb]);

  const handleCreateCode = async () => {
    if (!newCode || !newPredictions) return;
    
    // Check if exists
    const snapshot = await firebaseDb.ref(`codes/${newCode}`).once('value');
    if (snapshot.exists()) {
      alert("Code already exists!");
      return;
    }

    await firebaseDb.ref(`codes/${newCode}`).set({
      predictions: Number(newPredictions),
      active: true,
      assignedTo: null,
      usedPredictions: 0,
      createdAt: Date.now()
    });

    setNewCode('');
    fetchCodes();
    alert("Code created successfully");
  };

  const toggleStatus = (codeStr: string, currentStatus: boolean) => {
    firebaseDb.ref(`codes/${codeStr}`).update({ active: !currentStatus }).then(() => {
      fetchCodes();
    });
  };

  const deleteCode = (codeStr: string) => {
    if (confirm(`Delete code ${codeStr} permanently?`)) {
      firebaseDb.ref(`codes/${codeStr}`).remove().then(() => {
        fetchCodes();
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-8 shadow-2xl">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <ShieldAlert className="text-emerald-500" />
        <h2 className="text-xl font-bold text-white">Admin Control Panel</h2>
      </div>

      {/* Create Code */}
      <div className="flex flex-wrap gap-4 mb-8 bg-slate-950 p-4 rounded-lg border border-slate-800">
        <input
          type="text"
          placeholder="New Code (e.g. VIP50)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
        />
        <input
          type="number"
          placeholder="Predictions"
          value={newPredictions}
          onChange={(e) => setNewPredictions(Number(e.target.value))}
          className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
        />
        <button
          onClick={handleCreateCode}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Create
        </button>
        <button
          onClick={fetchCodes}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Codes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-sm">
              <th className="p-3 rounded-tl-lg">Code</th>
              <th className="p-3">Predictions</th>
              <th className="p-3">Assigned To</th>
              <th className="p-3">Used</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-300">
            {Object.entries(codes).length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No codes found.</td>
              </tr>
            ) : (
              Object.entries(codes).map(([code, rawData]) => {
                const data = rawData as VipCode;
                return (
                  <tr key={code} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-400">{code}</td>
                    <td className="p-3">{data.predictions}</td>
                    <td className="p-3 font-mono text-xs text-slate-500 max-w-[150px] truncate" title={data.assignedTo || ""}>
                      {data.assignedTo || "Unassigned"}
                    </td>
                    <td className="p-3">{data.usedPredictions || 0} / {data.predictions}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${data.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {data.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => toggleStatus(code, data.active)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                        title={data.active ? "Deactivate" : "Activate"}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => deleteCode(code)}
                        className="p-2 bg-rose-900/20 hover:bg-rose-900/40 rounded text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;