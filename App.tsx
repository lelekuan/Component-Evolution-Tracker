
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_DATA as INITIAL_DATA } from './mockData';
import { LocationHistory, ProjectStage, ComponentRecord } from './types';
import StageCard from './components/StageCard';
import ComparisonView from './components/ComparisonView';
import ManagementModal from './components/ManagementModal';
import { analyzeChanges } from './services/geminiService';

const App: React.FC = () => {
  const [data, setData] = useState<LocationHistory[]>(() => {
    const saved = localStorage.getItem('component_tracker_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved data", e);
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('component_tracker_data', JSON.stringify(data));
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
  const [globalDiffs, setGlobalDiffs] = useState<LocationHistory[] | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredData = useMemo(() => {
    if (projectFilter === 'All') return data;
    return data.filter(item => item.project === projectFilter);
  }, [projectFilter, data]);

  // 進階搜尋：區分位號與料號
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return { locations: [], partNumbers: [] };

    const locs = filteredData.filter(item => item.location.toLowerCase().includes(term));
    
    // 收集所有匹配的料號
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
      partNumbers: Array.from(pns).slice(0, 10) // 限制料號顯示數量
    };
  }, [searchTerm, filteredData]);

  // 取得特定料號的全域使用情況
  const partUsageReport = useMemo(() => {
    if (!selectedPartNumber) return null;
    
    const report: Record<ProjectStage, string[]> = {} as any;
    Object.values(ProjectStage).forEach(s => report[s] = []);

    let description = "";

    filteredData.forEach(item => {
      Object.entries(item.stages).forEach(([stage, recs]) => {
        const stageEnum = stage as ProjectStage;
        const matches = (recs || []).filter(r => r.partNumber === selectedPartNumber);
        if (matches.length > 0) {
          if (!report[stageEnum].includes(item.location)) {
            report[stageEnum].push(item.location);
          }
          if (!description) description = matches[0].description;
        }
      });
    });

    return { partNumber: selectedPartNumber, description, usage: report };
  }, [selectedPartNumber, filteredData]);

  const handleSelectLocation = (loc: LocationHistory) => {
    setSelectedLocation(loc);
    setSelectedPartNumber(null);
    setAiAnalysis(null);
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

  const handleResetDatabase = () => {
    localStorage.removeItem('component_tracker_data');
    setData(INITIAL_DATA);
    setSelectedLocation(null);
    setSelectedPartNumber(null);
  };

  const runAiAnalysis = async () => {
    if (!selectedLocation) return;
    setIsAnalyzing(true);
    const result = await analyzeChanges(selectedLocation);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const checkIfChanged = (loc: LocationHistory, stageA = ProjectStage.P1B, stageB = ProjectStage.EVT) => {
    const sA = loc.stages[stageA] || [];
    const sB = loc.stages[stageB] || [];
    if (sA.length !== sB.length) return true;
    const sAPNs = sA.map(r => r.partNumber).sort().join(',');
    const sBPNs = sB.map(r => r.partNumber).sort().join(',');
    return sAPNs !== sBPNs;
  };

  const runGlobalCompare = () => {
    const diffs = data.filter(loc => checkIfChanged(loc, globalStages.a, globalStages.b));
    setGlobalDiffs(diffs);
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

  // 定義順序：遞減 (從 MP 到 P1a)
  const orderedStages = useMemo(() => {
    return Object.values(ProjectStage).reverse();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <button onClick={handleOpenAdmin} className="fixed bottom-8 right-8 z-[60] bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white">
        <i className="fa-solid fa-database text-xl"></i>
      </button>

      {authProject && <ManagementModal isOpen={isAdminOpen} onClose={() => { setIsAdminOpen(false); setAuthProject(null); }} data={data} onSave={setData} onReset={handleResetDatabase} authenticatedProject={authProject} />}

      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50 border-b border-slate-700">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedLocation(null); setSelectedPartNumber(null); setGlobalDiffs(null); }}>
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
             {/* 首頁原本內容 (省略以維持簡潔，保留關鍵邏輯) */}
             <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center max-w-4xl w-full">
                <h2 className="text-3xl font-black text-slate-900 mb-4">Engineering Database</h2>
                <p className="text-slate-500 mb-10">Search by Location (e.g. R500) or Part Number to track evolution.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-arrow-down-wide-short text-blue-600"></i></div>
                    <h3 className="font-bold text-slate-800 mb-2">MP to P1a Order</h3>
                    <p className="text-xs text-slate-400">View timelines in descending order, showing newest builds first.</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-map-location-dot text-amber-600"></i></div>
                    <h3 className="font-bold text-slate-800 mb-2">Part Usage Tracking</h3>
                    <p className="text-xs text-slate-400">Find exactly where a specific part number is used across all stages.</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-code-compare text-green-600"></i></div>
                    <h3 className="font-bold text-slate-800 mb-2">Stage Delta</h3>
                    <p className="text-xs text-slate-400">Audit changes between any two project milestones instantly.</p>
                  </div>
                </div>
             </div>
          </div>
        ) : selectedPartNumber ? (
          // 料號全域使用報告視圖
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-10">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 block">Part Usage Report</span>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight">{partUsageReport?.partNumber}</h2>
                <p className="text-slate-500 italic mt-2">{partUsageReport?.description}</p>
              </div>
              <button onClick={() => setSelectedPartNumber(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Close Report</button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {orderedStages.map(stage => {
                const locations = partUsageReport?.usage[stage] || [];
                return (
                  <div key={stage} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex">
                    <div className="w-24 bg-slate-800 text-white flex flex-col items-center justify-center p-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Phase</span>
                      <span className="text-xl font-black italic">{stage}</span>
                    </div>
                    <div className="flex-1 p-8">
                      {locations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {locations.map(loc => (
                            <button key={loc} onClick={() => {
                              const target = data.find(d => d.location === loc && d.project === projectFilter);
                              if(target) handleSelectLocation(target);
                            }} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                              {loc}
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
          // 位號歷史視圖 (Location History)
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-200 pb-10">
              <div>
                <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 tracking-tight">
                  {selectedLocation!.location}
                </h2>
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
                  return (
                    <div key={stage} className="relative">
                      <div className="absolute -left-[54px] top-6 w-7 h-7 rounded-full bg-white border-4 border-blue-600 z-10 shadow-md"></div>
                      <StageCard stage={stage} records={records} isChanged={checkIfChanged(selectedLocation!)} />
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
