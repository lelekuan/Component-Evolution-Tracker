
import React, { useState } from 'react';
import { LocationHistory, ProjectStage, ComponentRecord } from '../types';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LocationHistory[];
  onSave: (newData: LocationHistory[]) => void;
  onReset: () => void;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, data, onSave, onReset }) => {
  const [editingLoc, setEditingLoc] = useState<LocationHistory | null>(null);
  const [newLocName, setNewLocName] = useState('');

  if (!isOpen) return null;

  const handleAddLocation = () => {
    if (!newLocName) return;
    const cleanName = newLocName.toUpperCase().trim();
    if (data.find(d => d.location === cleanName)) {
      alert("Location already exists!");
      return;
    }
    const newEntry: LocationHistory = {
      location: cleanName,
      project: 'P7LH',
      stages: {}
    };
    onSave([...data, newEntry]);
    setNewLocName('');
  };

  const handleUpdatePart = (stage: ProjectStage, partIdx: number, field: keyof ComponentRecord, value: string) => {
    if (!editingLoc) return;

    // Deep clone to ensure React state update triggers
    const newData = data.map(loc => {
      if (loc.location !== editingLoc.location) return loc;

      const newStages = { ...loc.stages };
      const stageParts = [...(newStages[stage] || [])];
      
      const updatedPart = { ...stageParts[partIdx] };
      if (field === 'configs') {
        updatedPart.configs = value.split(',').map(s => s.trim());
      } else {
        (updatedPart[field] as string) = value;
      }
      
      stageParts[partIdx] = updatedPart;
      newStages[stage] = stageParts;
      
      const updatedLoc = { ...loc, stages: newStages };
      // Also update the local editing state
      setTimeout(() => setEditingLoc(updatedLoc), 0);
      return updatedLoc;
    });

    onSave(newData);
  };

  const handleAddPart = (stage: ProjectStage) => {
    if (!editingLoc) return;
    const newPart: ComponentRecord = {
      partNumber: "NEW-PART-PN",
      description: "New Component Description",
      configs: ["Main"]
    };
    
    const newData = data.map(loc => {
      if (loc.location !== editingLoc.location) return loc;
      const newStages = { ...loc.stages };
      newStages[stage] = [...(newStages[stage] || []), newPart];
      const updatedLoc = { ...loc, stages: newStages };
      setTimeout(() => setEditingLoc(updatedLoc), 0);
      return updatedLoc;
    });
    
    onSave(newData);
  };

  const handleExport = () => {
    const dataStr = "import { LocationHistory, ProjectStage } from './types';\n\nexport const MOCK_DATA: LocationHistory[] = " + JSON.stringify(data, null, 2) + ";";
    const blob = new Blob([dataStr], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mockData.ts';
    link.click();
  };

  const handleReset = () => {
    if (window.confirm("Are you sure? This will delete ALL local changes and revert to the original mockData.ts.")) {
      onReset();
      setEditingLoc(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Database Manager</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Local Browser Storage Active</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-100 uppercase tracking-widest transition-colors">
              Reset DB
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-400">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-72 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-5 border-b border-slate-100">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Create New Location</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. R1234" 
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                />
                <button onClick={handleAddLocation} className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center hover:bg-blue-700 shadow-md transition-all active:scale-95">
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {data.map(loc => (
                <button 
                  key={loc.location}
                  onClick={() => setEditingLoc(loc)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center group ${
                    editingLoc?.location === loc.location ? 'bg-white shadow-md text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span>{loc.location}</span>
                  <i className={`fa-solid fa-chevron-right text-[10px] transition-transform ${editingLoc?.location === loc.location ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100'}`}></i>
                </button>
              ))}
            </div>
          </div>

          {/* Workspace */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
            {editingLoc ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-end border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Entry Profile</span>
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{editingLoc.location}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      if(window.confirm("Delete this location?")) {
                        onSave(data.filter(d => d.location !== editingLoc.location));
                        setEditingLoc(null);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 uppercase tracking-widest transition-all"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    Remove Entry
                  </button>
                </div>

                <div className="space-y-10">
                  {Object.values(ProjectStage).map(stage => (
                    <div key={stage} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic">{stage}</span>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Lifecycle Stage</span>
                        </h4>
                        <button 
                          onClick={() => handleAddPart(stage)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                        >
                          + ADD COMPONENT
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {(!editingLoc.stages[stage] || editingLoc.stages[stage]?.length === 0) ? (
                          <div className="py-8 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center">
                             <p className="text-xs text-slate-300 font-bold uppercase tracking-widest italic">No Records for this stage</p>
                          </div>
                        ) : (
                          editingLoc.stages[stage]?.map((part, idx) => (
                            <div key={`${stage}-${idx}`} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4 group hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Part Number</label>
                                  <input 
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                    value={part.partNumber}
                                    onChange={(e) => handleUpdatePart(stage, idx, 'partNumber', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Configs (Main, Build B...)</label>
                                  <input 
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                    value={part.configs.join(', ')}
                                    onChange={(e) => handleUpdatePart(stage, idx, 'configs', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <input 
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                  value={part.description}
                                  onChange={(e) => handleUpdatePart(stage, idx, 'description', e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end pt-2">
                                <button 
                                  onClick={() => {
                                    const newData = data.map(loc => {
                                      if (loc.location !== editingLoc.location) return loc;
                                      const newStages = { ...loc.stages };
                                      newStages[stage] = (newStages[stage] || []).filter((_, i) => i !== idx);
                                      const updatedLoc = { ...loc, stages: newStages };
                                      setTimeout(() => setEditingLoc(updatedLoc), 0);
                                      return updatedLoc;
                                    });
                                    onSave(newData);
                                  }}
                                  className="text-[9px] font-black text-red-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                                >
                                  Delete Part
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                   <i className="fa-solid fa-i-cursor text-4xl text-slate-200"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Editor Ready</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                  Select a location from the left panel to begin updating engineering records.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-600">Sync with GitHub Codebase:</p>
            <p className="text-[10px] text-slate-400">Export file, then overwrite <strong>mockData.ts</strong> in your repo.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              <i className="fa-solid fa-download"></i>
              Export mockData.ts
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
            >
              Close Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementModal;
