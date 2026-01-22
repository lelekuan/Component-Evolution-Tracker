
import React, { useState, useMemo, useRef } from 'react';
import { LocationHistory, ProjectStage, ComponentRecord } from '../types';
import * as XLSX from 'xlsx';

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
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // 只顯示目前登入專案的位號
  const projectSpecificData = useMemo(() => {
    return data.filter(d => d.project === authenticatedProject);
  }, [data, authenticatedProject]);

  if (!isOpen) return null;

  // 輔助函式：同時更新全域資料與目前編輯中的位號
  const updateDatabase = (newData: LocationHistory[]) => {
    onSave(newData);
    if (editingLoc) {
      const refreshed = newData.find(d => d.location === editingLoc.location && d.project === authenticatedProject);
      setEditingLoc(refreshed || null);
    }
  };

  const handleAddLocation = () => {
    const cleanName = newLocName.toUpperCase().trim();
    if (!cleanName) return;
    if (data.find(d => d.location === cleanName && d.project === authenticatedProject)) {
      alert("This location already exists in " + authenticatedProject);
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
      if (loc.location === editingLoc.location && loc.project === authenticatedProject) {
        const newStages = { ...loc.stages };
        const stageParts = [...(newStages[stage] || [])];
        const updatedPart = { ...stageParts[partIdx] };

        if (field === 'configs') {
          updatedPart.configs = value.split(',').map(s => s.trim()).filter(s => s !== "");
        } else {
          (updatedPart[field] as any) = value;
        }

        stageParts[partIdx] = updatedPart;
        newStages[stage] = stageParts;
        return { ...loc, stages: newStages };
      }
      return loc;
    });

    updateDatabase(newData);
  };

  const handleAddPart = (stage: ProjectStage) => {
    if (!editingLoc) return;
    const newData = data.map(loc => {
      if (loc.location === editingLoc.location && loc.project === authenticatedProject) {
        const newStages = { ...loc.stages };
        const newPart: ComponentRecord = { partNumber: "NEW-PN", description: "New Component", configs: ["Main"] };
        newStages[stage] = [...(newStages[stage] || []), newPart];
        return { ...loc, stages: newStages };
      }
      return loc;
    });
    updateDatabase(newData);
  };

  const handleDeletePart = (stage: ProjectStage, partIdx: number) => {
    if (!editingLoc) return;
    const newData = data.map(loc => {
      if (loc.location === editingLoc.location && loc.project === authenticatedProject) {
        const newStages = { ...loc.stages };
        newStages[stage] = (newStages[stage] || []).filter((_, i) => i !== partIdx);
        return { ...loc, stages: newStages };
      }
      return loc;
    });
    updateDatabase(newData);
  };

  const handleExport = () => {
    const dataStr = `import { LocationHistory, ProjectStage } from './types';\n\nexport const MOCK_DATA: LocationHistory[] = ${JSON.stringify(data, null, 2)};`;
    const blob = new Blob([dataStr], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockData_sync_${new Date().toISOString().split('T')[0]}.ts`;
    link.click();
  };

  const processImportedData = (importedEntries: LocationHistory[]) => {
    // 嚴格檢查專案標籤
    const validEntries = importedEntries.filter(entry => entry.project === authenticatedProject);
    const wrongProjectCount = importedEntries.length - validEntries.length;

    if (validEntries.length === 0) {
      alert(`Error: No entries matched the current project [${authenticatedProject}]. Check your file's 'Project' column.`);
      return;
    }

    let updatedData = [...data];
    validEntries.forEach(newEntry => {
      const index = updatedData.findIndex(d => d.location === newEntry.location && d.project === authenticatedProject);
      if (index !== -1) {
        updatedData[index] = newEntry;
      } else {
        updatedData.push(newEntry);
      }
    });

    onSave(updatedData);
    alert(`Successfully imported ${validEntries.length} items for ${authenticatedProject}.${wrongProjectCount > 0 ? `\n(Skipped ${wrongProjectCount} items from other projects)` : ''}`);
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result;
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];

        const locMap: Record<string, LocationHistory> = {};

        rows.forEach(row => {
          const loc = (row.Location || row.location || "").toString().trim().toUpperCase();
          const proj = (row.Project || row.project || "").toString().trim().toUpperCase();
          const stageStr = (row.Stage || row.stage || "").toString().trim();
          const pn = (row['Part Number'] || row.partNumber || row.PN || "").toString().trim();
          const desc = (row.Description || row.description || "").toString().trim();
          const cfgStr = (row.Configs || row.configs || "Main").toString();

          if (!loc || !proj || !pn) return;

          // 驗證 Stage 是否合法
          if (!Object.values(ProjectStage).includes(stageStr as any)) {
            console.warn(`Invalid stage [${stageStr}] for location ${loc}. Skipping row.`);
            return;
          }

          if (!locMap[loc]) {
            locMap[loc] = { location: loc, project: proj as any, stages: {} };
          }

          const stage = stageStr as ProjectStage;
          if (!locMap[loc].stages[stage]) {
            locMap[loc].stages[stage] = [];
          }

          locMap[loc].stages[stage]?.push({
            partNumber: pn,
            description: desc,
            configs: cfgStr.split(',').map(s => s.trim()).filter(s => s !== "")
          });
        });

        processImportedData(Object.values(locMap));
      } catch (err) {
        alert("Excel Parsing Failed. Please ensure your file matches the template headers.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (excelFileInputRef.current) excelFileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
               <i className="fa-solid fa-database"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Database Manager <span className="text-blue-600 ml-2">[{authenticatedProject}]</span></h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Multi-Format Engineering Data Maintenance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.confirm("Factory reset will clear local storage. Proceed?") && onReset()} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-100 uppercase transition-all">Reset All</button>
            <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-400"><i className="fa-solid fa-xmark text-xl"></i></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-6 border-b border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Quick Add Location</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. R100" 
                  className="flex-1 px-4 py-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none" 
                  value={newLocName} 
                  onChange={(e)=>setNewLocName(e.target.value)} 
                  onKeyDown={(e)=>e.key==='Enter'&&handleAddLocation()} 
                />
                <button onClick={handleAddLocation} className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all"><i className="fa-solid fa-plus"></i></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
              {projectSpecificData.length === 0 ? (
                <p className="text-[10px] text-slate-300 p-4 italic">No locations in database.</p>
              ) : (
                projectSpecificData.map(loc => (
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
                ))
              )}
            </div>
          </div>

          {/* Editor Workspace */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
            {editingLoc ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-400">
                <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Active Editor</span>
                    <h3 className="text-6xl font-black text-slate-900 tracking-tighter">{editingLoc.location}</h3>
                  </div>
                  <button 
                    onClick={() => window.confirm(`Delete ${editingLoc.location}?`) && (onSave(data.filter(d => !(d.location === editingLoc.location && d.project === authenticatedProject))), setEditingLoc(null))}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                  >
                    <i className="fa-solid fa-trash mr-2"></i>Delete Entry
                  </button>
                </div>

                <div className="space-y-12">
                  {Object.values(ProjectStage).map(stage => (
                    <div key={stage} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic">{stage}</span>
                          <span className="text-xs font-black text-slate-900 uppercase">Phase Records</span>
                        </div>
                        <button onClick={() => handleAddPart(stage)} className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">+ Add Component</button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {!editingLoc.stages[stage] || editingLoc.stages[stage]?.length === 0 ? (
                          <div className="py-8 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center bg-slate-50/30">
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">No records for this stage</span>
                          </div>
                        ) : (
                          editingLoc.stages[stage]?.map((part, idx) => (
                            <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 group relative hover:shadow-lg transition-shadow">
                              <button onClick={() => handleDeletePart(stage, idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-circle-xmark"></i></button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Part Number</label>
                                  <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500" value={part.partNumber} onChange={(e)=>handleUpdatePart(stage,idx,'partNumber',e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Configs (e.g. Main, FBU)</label>
                                  <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" value={part.configs.join(', ')} onChange={(e)=>handleUpdatePart(stage,idx,'configs',e.target.value)} />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Description</label>
                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-blue-500" value={part.description} onChange={(e)=>handleUpdatePart(stage,idx,'description',e.target.value)} />
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
                <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-200 border border-slate-100">
                  <i className="fa-solid fa-file-import text-4xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Select or Import Data</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  Start by choosing a location on the left or use the <span className="font-bold text-slate-700">Excel Upload</span> to batch import your project BOM.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-slate-900 uppercase mb-1">Excel Format</p>
                    <p className="text-[9px] text-slate-500">Headers: Location, Project, Stage, Part Number, Description, Configs.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-slate-900 uppercase mb-1">Safety</p>
                    <p className="text-[9px] text-slate-500">Items from other projects will be automatically skipped during import.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black text-slate-900 italic">Engineering Sync Engine</p>
            <p className="text-[10px] text-slate-500">Update the global database using local source files.</p>
          </div>
          <div className="flex gap-3">
            <input type="file" accept=".xlsx, .xls" ref={excelFileInputRef} onChange={handleExcelUpload} className="hidden" />
            <input type="file" accept=".json" ref={jsonFileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if(!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const json = JSON.parse(ev.target?.result as string);
                  processImportedData(Array.isArray(json) ? json : [json]);
                } catch(err) { alert("JSON file error"); }
              };
              reader.readAsText(file);
              if(jsonFileInputRef.current) jsonFileInputRef.current.value='';
            }} className="hidden" />
            
            <button onClick={() => excelFileInputRef.current?.click()} className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm">
              <i className="fa-solid fa-file-excel text-green-600"></i> Excel Upload
            </button>
            <button onClick={() => jsonFileInputRef.current?.click()} className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 shadow-sm">
              <i className="fa-solid fa-code text-blue-500"></i> JSON Import
            </button>
            <button onClick={handleExport} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2">
              <i className="fa-solid fa-cloud-arrow-down text-amber-400"></i> Export .ts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementModal;
