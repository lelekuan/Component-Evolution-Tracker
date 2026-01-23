
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_DATA as INITIAL_DATA } from './mockData';
import { LocationHistory, ProjectStage, ComponentRecord } from './types';
import StageCard from './components/StageCard';
import ComparisonView from './components/ComparisonView';
import ManagementModal from './components/ManagementModal';

// 每當 mockData.ts 有大幅度更新，請手動增加這個版本號 (例如 v1 -> v2)
const CURRENT_DATA_VERSION = "v2024-05-22-01";

type ChangeType = 'added' | 'removed' | 'modified' | 'none';

interface GlobalDiffResult {
  location: LocationHistory;
  type: ChangeType;
}

const App: React.FC = () => {
  const [data, setData] = useState<LocationHistory[]>(() => {
    const savedVersion = localStorage.getItem('component_tracker_version');
    const savedData = localStorage.getItem('component_tracker_data');

    // 如果版本不符，或者完全沒有存過資料，就讀取最新的 INITIAL_DATA
    if (savedVersion !== CURRENT_DATA_VERSION || !savedData) {
      localStorage.setItem('component_tracker_version', CURRENT_DATA_VERSION);
      localStorage.setItem('component_tracker_data', JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }

    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error("Failed to parse saved data", e);
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('component_tracker_data', JSON.stringify(data));
    localStorage.setItem('component_tracker_version', CURRENT_DATA_VERSION);
  }, [data]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationHistory | null>(null);
  const [selectedPartNumber, setSelectedPartNumber] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<'All' | 'P7LH' | 'P7MH'>('All');
  const [viewMode, setViewMode] = useState<'timeline' | 'compare'>('timeline');
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [authProject, setAuthProject] = useState<'P7LH' | 'P7MH' | null>(null);
  
  const [compareStages, setCompareStages] = useState<{ a: ProjectStage; b: ProjectStage }>({
    a: ProjectStage.P1B,
    b: ProjectStage.EVT
  });

  const [globalStages, setGlobalStages] = useState<{ a: ProjectStage; b: ProjectStage }>({
    a: ProjectStage.P1B,
    b: ProjectStage.EVT
  });
  const [globalDiffs, setGlobalDiffs] = useState<GlobalDiffResult[] | null>(null);

  const filteredData = useMemo(() => {
    if (projectFilter === 'All') return data;
    return data.filter(item => item.project === projectFilter);
  }, [projectFilter, data]);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return { locations: [], partNumbers: [] };

    const locs = filteredData.filter(item => item.location.toLowerCase().includes(term));
    const pns: Set<string> = new Set();
    filteredData.forEach(item => {
      Object.values(item.stages).forEach((recs: any) => {
        recs?.forEach((r: ComponentRecord) => {
          if (r.partNumber.toLowerCase().includes(term)) {
            pns.add(r.partNumber);
          }
        });
      });
    });

    return {
      locations: locs,
      partNumbers: Array.from(pns).slice(0, 10)
    };
  }, [searchTerm, filteredData]);

  const chronologicalStages = useMemo(() => Object.values(ProjectStage), []);

  const partUsageReport = useMemo(() => {
    if (!selectedPartNumber) return null;
    
    const report: Record<ProjectStage, { location: string; status: 'added' | 'removed' | 'stable' }[]> = {} as any;
    Object.values(ProjectStage).forEach(s => report[s] = []);
    
    let description = "";
    const usageByStage: Record<ProjectStage, string[]> = {} as any;
    Object.values(ProjectStage).forEach(s => usageByStage[s] = []);

    filteredData.forEach(item => {
      Object.entries(item.stages).forEach(([stage, recs]) => {
        const stageEnum = stage as ProjectStage;
        const matches = (recs || []).filter(r => r.partNumber === selectedPartNumber);
        if (matches.length > 0) {
          usageByStage[stageEnum].push(item.location);
          if (!description) description = matches[0].description;
        }
      });
    });

    chronologicalStages.forEach((stage, idx) => {
      const currentLocs = usageByStage[stage];
      const prevLocs = idx > 0 ? usageByStage[chronologicalStages[idx - 1]] : [];

      currentLocs.forEach(loc => {
        if (!prevLocs.includes(loc)) {
          report[stage].push({ location: loc, status: 'added' });
        } else {
          report[stage].push({ location: loc, status: 'stable' });
        }
      });

      prevLocs.forEach(loc => {
        if (!currentLocs.includes(loc)) {
          report[stage].push({ location: loc, status: 'removed' });
        }
      });
    });

    return { partNumber: selectedPartNumber, description, usage: report };
  }, [selectedPartNumber, filteredData, chronologicalStages]);

  const getChangeType = (loc: LocationHistory, stageA: ProjectStage, stageB: ProjectStage): ChangeType => {
    const sA = loc.stages[stageA] || [];
    const sB = loc.stages[stageB] || [];
    
    const existsA = sA.length > 0;
    const existsB = sB.length > 0;

    if (!existsA && !existsB) return 'none';
    if (!existsA && existsB) return 'added';
    if (existsA && !existsB) return 'removed';
    
    const sAPNs = sA.map(r => `${r.partNumber}-${r.configs.join(',')}`).sort().join('|');
    const sBPNs = sB.map(r => `${r.partNumber}-${r.configs.join(',')}`).sort().join('|');
    
    return sAPNs !== sBPNs ? 'modified' : 'none';
  };

  const handleSelectLocation = (loc: LocationHistory) => {
    setSelectedLocation(loc);
    setSelectedPartNumber(null);
    setSearchTerm('');
    setGlobalDiffs(null);
    setViewMode('timeline');
  };

  const handleSelectPartNumber = (pn: string) => {
    setSelectedPartNumber(pn);
    setSelectedLocation(null);
    setSearchTerm('');
    setGlobalDiffs(null);
  };

  const handleOpenAdmin = () => {
    const pwd = window.prompt("Enter Project Code (P7LH/P7MH):");
    if (!pwd) return;
    const upperPwd = pwd.toUpperCase().trim();
    if (upperPwd === 'P7LH' || upperPwd === 'P7MH') {
      setAuthProject(upperPwd as 'P7LH' | 'P7MH');
      setIsAdminOpen(true);
    } else {
      alert("Invalid Project Code.");
    }
  };

  const orderedStages = useMemo(() => Object.values(ProjectStage).reverse(), []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC]">
      <button onClick={handleOpenAdmin} className="fixed bottom-8 right-8 z-[60] bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white">
        <i className="fa-solid fa-database text-xl"></i>
      </button>

      {authProject && <ManagementModal isOpen={isAdminOpen} onClose={() => { setIsAdminOpen(false); setAuthProject(null); }} data={data} onSave={setData} onReset={() => {localStorage.removeItem('component_tracker_data'); setData(INITIAL_DATA);}} authenticatedProject={authProject} />}

      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50 border-b border-slate-700">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedLocation(null); setSelectedPartNumber(null); setGlobalDiffs(null); setSearchTerm(''); }}>
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-inner"><i className="fa-solid fa-microchip text-xl"></i></div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Component Evolution</h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase font-mono">Engineering Hub</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              {['All', 'P7LH', 'P7MH'].map((p) => (
                <button key={p} onClick={() => setProjectFilter(p as any)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${projectFilter === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{p}</button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <input type="text" className="block w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white text-sm focus:ring-2 focus:ring-blue-500 placeholder-slate-500" placeholder="Search Loc or PN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><i className="fa-solid fa-magnifying-glass text-xs"></i></div>
              
              {(searchResults.locations.length > 0 || searchResults.partNumbers.length > 0) && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-2xl z-50 border border-slate-200 max-h-96 overflow-y-auto text-slate-900">
                  {searchResults.locations.length > 0 && (
                    <div className="p-2 border-b border-slate-100 bg-slate-50"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Locations</span></div>
                  )}
                  {searchResults.locations.map((res, i) => (
                    <button key={`loc-${i}`} onClick={() => handleSelectLocation(res)} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center border-b border-slate-50">
                      <span className="font-bold text-sm">{res.location}</span>
                      <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase">{res.project}</span>
                    </button>
                  ))}
                  {searchResults.partNumbers.length > 0 && (
                    <div className="p-2 border-b border-slate-100 bg-slate-50"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Part Numbers</span></div>
                  )}
                  {searchResults.partNumbers.map((pn, i) => (
                    <button key={`pn-${i}`} onClick={() => handleSelectPartNumber(pn)} className="w-full text-left px-4 py-3 hover:bg-amber-50 flex justify-between items-center border-b border-slate-50">
                      <span className="font-mono text-sm font-bold text-amber-700">{pn}</span>
                      <i className="fa-solid fa-list-check text-amber-300 text-[10px]"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {!selectedLocation && !selectedPartNumber ? (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <i className="fa-solid fa-magnifying-glass text-blue-500"></i>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Searchable</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Instantly query by <span className="font-black text-slate-700">Location, PN,</span> or <span className="font-black text-slate-700">Notes.</span>
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <i className="fa-solid fa-lock text-amber-500"></i>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Secure</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Access maintenance via project codes <span className="font-black text-slate-700">P7LH</span> or <span className="font-black text-slate-700">P7MH.</span>
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <i className="fa-solid fa-arrows-rotate text-green-500"></i>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Comparisons</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Compare any <span className="font-black text-slate-700">two milestones</span> side-by-side using the evolution tool below.
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <i className="fa-solid fa-tag text-purple-500"></i>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Indexed ({data.length})</h3>
                </div>
                <div className="space-y-1.5 max-h-16 overflow-y-auto">
                  {data.slice(0, 10).map(loc => (
                    <button key={loc.location} onClick={() => handleSelectLocation(loc)} className="block text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors">
                      {loc.location}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-20">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="fa-solid fa-layer-group text-xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Global Evolution Audit</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyze changes across all locations</p>
                </div>
              </div>

              <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Stage (A)</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={globalStages.a} onChange={(e) => setGlobalStages({...globalStages, a: e.target.value as ProjectStage})}>
                      {Object.values(ProjectStage).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Stage (B)</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={globalStages.b} onChange={(e) => setGlobalStages({...globalStages, b: e.target.value as ProjectStage})}>
                      {Object.values(ProjectStage).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      const results = data
                        .map(loc => ({ location: loc, type: getChangeType(loc, globalStages.a, globalStages.b) }))
                        .filter(res => res.type !== 'none');
                      setGlobalDiffs(results);
                    }} 
                    className="bg-[#0F172A] text-white rounded-2xl py-4 px-10 font-black text-xs uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl h-[58px]"
                  >
                    Compare Stages
                  </button>
                </div>

                {globalDiffs && (
                  <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900">Found {globalDiffs.length} Change(s)</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {globalDiffs.map(res => (
                        <button key={res.location.location} onClick={() => handleSelectLocation(res.location)} className={`text-left p-6 rounded-2xl border-2 transition-all group ${
                          res.type === 'added' ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-400' :
                          res.type === 'removed' ? 'bg-rose-50 border-rose-100 hover:border-rose-400' :
                          'bg-amber-50 border-amber-100 hover:border-amber-400'
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-slate-900 text-xl">{res.location.location}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                              res.type === 'added' ? 'bg-emerald-600 text-white' :
                              res.type === 'removed' ? 'bg-rose-600 text-white' :
                              'bg-amber-500 text-white'
                            }`}>
                              {res.type === 'added' ? 'Added to B' : res.type === 'removed' ? 'Removed from B' : 'Modified'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                            {res.type === 'added' ? 'New location in target' : res.type === 'removed' ? 'Location dropped in target' : 'Part revisions detected'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : selectedPartNumber ? (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-10">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 block">Part Usage Report</span>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight">{partUsageReport?.partNumber}</h2>
                <p className="text-slate-500 italic mt-2">{partUsageReport?.description}</p>
              </div>
              <button onClick={() => setSelectedPartNumber(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-900 hover:text-white transition-all">Close Report</button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {orderedStages.map(stage => {
                const usages = partUsageReport?.usage[stage] || [];
                const addedCount = usages.filter(u => u.status === 'added').length;
                const removedCount = usages.filter(u => u.status === 'removed').length;
                
                return (
                  <div key={stage} className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden flex transition-all ${addedCount || removedCount ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'}`}>
                    <div className={`w-24 flex flex-col items-center justify-center p-4 text-white ${addedCount || removedCount ? 'bg-slate-700' : 'bg-slate-800'}`}>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Phase</span>
                      <span className="text-xl font-black italic">{stage}</span>
                    </div>
                    <div className="flex-1 p-8">
                      {usages.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {usages.map((usage, idx) => (
                            <button 
                              key={`${usage.location}-${idx}`} 
                              onClick={() => {
                                const target = data.find(d => d.location === usage.location);
                                if(target) handleSelectLocation(target);
                              }} 
                              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 group relative ${
                                usage.status === 'added' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white' 
                                  : usage.status === 'removed'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 border-dashed opacity-70 line-through grayscale-[0.3] hover:opacity-100'
                                  : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-600 hover:text-white'
                              }`}
                            >
                              {usage.location}
                              {usage.status === 'added' && (
                                <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black">+ ADDED</span>
                              )}
                              {usage.status === 'removed' && (
                                <span className="text-[8px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-black">- REMOVED</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300 italic">Not utilized in this stage</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-200 pb-10">
              <div>
                <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 tracking-tight">{selectedLocation!.location}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-2">{selectedLocation!.project} Evolution Timeline</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setViewMode(viewMode === 'timeline' ? 'compare' : 'timeline')} className={`px-6 py-3 rounded-xl shadow-sm font-bold text-xs border ${viewMode === 'compare' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}>
                  {viewMode === 'timeline' ? 'Compare Delta' : 'Back to Timeline'}
                </button>
              </div>
            </div>
            {viewMode === 'timeline' ? (
              <div className="relative border-l-4 border-slate-100 ml-6 pl-10 space-y-10">
                {orderedStages.map((stage) => {
                  const records = selectedLocation!.stages[stage];
                  if (!records || records.length === 0) return null;
                  
                  const currentIdx = chronologicalStages.indexOf(stage);
                  const isChanged = currentIdx > 0 ? getChangeType(selectedLocation!, stage, chronologicalStages[currentIdx - 1]) !== 'none' : false;

                  return (
                    <div key={stage} className="relative">
                      <div className={`absolute -left-[54px] top-6 w-7 h-7 rounded-full bg-white border-4 ${isChanged ? 'border-amber-400' : 'border-blue-600'} z-10 shadow-md`}></div>
                      <StageCard stage={stage} records={records} isChanged={isChanged} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <ComparisonView stageA={compareStages.a} recordsA={selectedLocation!.stages[compareStages.a] || []} stageB={compareStages.b} recordsB={selectedLocation!.stages[compareStages.b] || []} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
