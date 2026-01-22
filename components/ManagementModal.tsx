
import React, { useState, useMemo } from 'react';
import { LocationHistory, ProjectStage, ComponentRecord } from '../types';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LocationHistory[];
  onSave: (newData: LocationHistory[]) => void;
  onReset: () => void;
  authenticatedProject: 'P7LH' | 'P7MH';
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, data, onSave, onReset, authenticatedProject }) => {
  const [editingLoc, setEditingLoc] = useState<LocationHistory | null>(null);
  const [newLocName, setNewLocName] = useState('');

  // Filter data to only show locations for the authenticated project
  const projectSpecificData = useMemo(() => {
    return data.filter(d => d.project === authenticatedProject);
  }, [data, authenticatedProject]);

  if (!isOpen) return null;

  const handleAddLocation = () => {
    if (!newLocName) return;
    const cleanName = newLocName.toUpperCase().trim();
    // Check against global data to avoid cross-project duplicates if necessary, 
    // but here we check against projectSpecific for UI consistency.
    if (data.find(d => d.location === cleanName)) {
      alert("Location already exists in the database!");
      return;
    }
    const newEntry: LocationHistory = {
      location: cleanName,
      project: authenticatedProject,
      stages: {}
    };
    onSave([...data, newEntry]);
    setNewLocName('');
  };

  const handleUpdatePart = (stage: ProjectStage, partIdx: number, field: keyof ComponentRecord, value: string) => {
    if (!editingLoc) return;

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
    link.download = `mockData_${authenticatedProject}_${new Date().toISOString().split('T')[0]}.ts`;
    link.click();
  };

  const handleReset = () => {
    if (window.confirm("DANGER: This will revert ALL projects to default. Local changes will be lost.")) {
      onReset();
      setEditingLoc(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
               <i className="fa-solid fa-screwdriver-wrench"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Database Manager <span className="text-blue-600 ml-2">[{authenticatedProject}]</span></h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Authorized Project Maintenance Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 uppercase tracking-widest transition-all">
              Factory Reset DB
            </button>
            <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-400">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-6 border-b border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Create New Location for {authenticatedProject}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. R1000" 
                  className="flex-1 px-4 py-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold shadow-sm"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                />
                <button onClick={handleAddLocation} className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-800 shadow-md transition-all active:scale-95">
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
              <p className="px-4 py-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">Location List ({projectSpecificData.length})</p>
              {projectSpecificData.map(loc => (
                <button 
                  key={loc.location}
                  onClick={() => setEditingLoc(loc)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all flex justify-between items-center group ${
                    editingLoc?.location === loc.location ? 'bg-white shadow-xl text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{loc.location}</span>
                  <i className={`fa-solid fa-chevron-right text-[10px] transition-transform ${editingLoc?.location === loc.location ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100'}`}></i>
                </button>
              ))}
            </div>
          </div>

          {/* Workspace */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
            {editingLoc ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Active Profile</span>
                    <h3 className="text-6xl font-black text-slate-900 tracking-tighter">{editingLoc.location}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      if(window.confirm(`Delete ${editingLoc.location}? This cannot be undone.`)) {
                        onSave(data.filter(d => d.location !== editingLoc.location));
                        setEditingLoc(null);
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-3 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-100 uppercase tracking-widest transition-all"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    Remove Entry
                  </button>
                </div>

                <div className="space-y-12">
                  {Object.values(ProjectStage).map(stage => (
                    <div key={stage} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-4">
                          <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black italic shadow-lg">{stage}</span>
                          <div>
                            <span className="text-xs font-black text-slate-900 uppercase block leading-none">Stage Timeline</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Engineering Milestone</span>
                          </div>
                        </h4>
                        <button 
                          onClick={() => handleAddPart(stage)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 shadow-sm transition-all"
                        >
                          + ADD COMPONENT
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {(!editingLoc.stages[stage] || editingLoc.stages[stage]?.length === 0) ? (
                          <div className="py-12 border-4 border-dashed border-slate-50 rounded-[2.5rem] flex items-center justify-center bg-slate-50/20">
                             <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em] italic">No Engineering Records Found</p>
                          </div>
                        ) : (
                          editingLoc.stages[stage]?.map((part, idx) => (
                            <div key={`${stage}-${idx}`} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-2xl hover:border-blue-200 transition-all duration-300 relative">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Part Number</label>
                                  <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                                    value={part.partNumber}
                                    onChange={(e) => handleUpdatePart(stage, idx, 'partNumber', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Configuration Tags (Split by comma)</label>
                                  <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                                    value={part.configs.join(', ')}
                                    onChange={(e) => handleUpdatePart(stage, idx, 'configs', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Engineering Description</label>
                                <input 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-medium"
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
                                  className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                                >
                                  Delete Component
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
                <div className="w-40 h-40 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                   <i className="fa-solid fa-keyboard text-5xl text-slate-200"></i>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Database Authenticated</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                  Select a location for <span className="text-slate-900 font-bold">{authenticatedProject}</span> to start maintaining lifecycle history.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-10 py-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-black text-slate-900">Sync Changes Globally</p>
            <p className="text-[10px] text-slate-500 font-medium max-w-xs leading-relaxed">
              Export the source file and overwrite <span className="font-bold text-slate-800">mockData.ts</span> in your GitHub repository to finalize updates.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleExport}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              <i className="fa-solid fa-cloud-arrow-down text-blue-400"></i>
              Export Source File
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
            >
              Exit Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementModal;
