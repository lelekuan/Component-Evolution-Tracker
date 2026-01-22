
import React, { useState } from 'react';
import { LocationHistory, ProjectStage, ComponentRecord } from '../types';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LocationHistory[];
  onSave: (newData: LocationHistory[]) => void;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, data, onSave }) => {
  const [editingLoc, setEditingLoc] = useState<LocationHistory | null>(null);
  const [newLocName, setNewLocName] = useState('');

  if (!isOpen) return null;

  const handleAddLocation = () => {
    if (!newLocName) return;
    const newEntry: LocationHistory = {
      location: newLocName.toUpperCase(),
      project: 'P7LH',
      stages: {}
    };
    onSave([...data, newEntry]);
    setNewLocName('');
  };

  const handleAddPart = (stage: ProjectStage) => {
    if (!editingLoc) return;
    const newPart: ComponentRecord = {
      partNumber: "NEW-PART-PN",
      description: "New Component Description",
      configs: ["Main"]
    };
    
    const updatedLoc = {
      ...editingLoc,
      stages: {
        ...editingLoc.stages,
        [stage]: [...(editingLoc.stages[stage] || []), newPart]
      }
    };
    
    const newData = data.map(d => d.location === editingLoc.location ? updatedLoc : d);
    onSave(newData);
    setEditingLoc(updatedLoc);
  };

  const handleExport = () => {
    const dataStr = "export const MOCK_DATA = " + JSON.stringify(data, null, 2) + ";";
    const blob = new Blob([dataStr], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mockData.ts';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Database Manager</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Maintain Locations & Part Numbers</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-400">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar: Location List */}
          <div className="w-full md:w-64 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New Loc..." 
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                />
                <button onClick={handleAddLocation} className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-700">
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {data.map(loc => (
                <button 
                  key={loc.location}
                  onClick={() => setEditingLoc(loc)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    editingLoc?.location === loc.location ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {loc.location}
                </button>
              ))}
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
            {editingLoc ? (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Currently Editing</span>
                    <h3 className="text-4xl font-black text-slate-900">{editingLoc.location}</h3>
                  </div>
                  <button 
                    onClick={() => onSave(data.filter(d => d.location !== editingLoc.location))}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Delete Location
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {Object.values(ProjectStage).map(stage => (
                    <div key={stage} className="border border-slate-100 rounded-2xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{stage}</span>
                        <button 
                          onClick={() => handleAddPart(stage)}
                          className="text-[10px] font-black bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 shadow-sm"
                        >
                          + Add Part
                        </button>
                      </div>
                      <div className="p-4 space-y-4">
                        {(editingLoc.stages[stage] || []).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No components defined for this stage.</p>
                        ) : (
                          editingLoc.stages[stage]?.map((part, idx) => (
                            <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase">Part Number</label>
                                  <input 
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                                    value={part.partNumber}
                                    onChange={(e) => {
                                      const newStages = { ...editingLoc.stages };
                                      newStages[stage]![idx].partNumber = e.target.value;
                                      onSave(data.map(d => d.location === editingLoc.location ? { ...editingLoc, stages: newStages } : d));
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase">Configs (csv)</label>
                                  <input 
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                                    value={part.configs.join(', ')}
                                    onChange={(e) => {
                                      const newStages = { ...editingLoc.stages };
                                      newStages[stage]![idx].configs = e.target.value.split(',').map(s => s.trim());
                                      onSave(data.map(d => d.location === editingLoc.location ? { ...editingLoc, stages: newStages } : d));
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase">Description</label>
                                <input 
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                                  value={part.description}
                                  onChange={(e) => {
                                    const newStages = { ...editingLoc.stages };
                                    newStages[stage]![idx].description = e.target.value;
                                    onSave(data.map(d => d.location === editingLoc.location ? { ...editingLoc, stages: newStages } : d));
                                  }}
                                />
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
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <i className="fa-solid fa-edit text-6xl mb-6"></i>
                <p className="text-xl font-bold">Select a location to start maintaining data</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-between bg-slate-50">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
          >
            <i className="fa-solid fa-file-export"></i>
            Export mockData.ts
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagementModal;
