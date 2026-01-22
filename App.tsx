
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_DATA as INITIAL_DATA } from './mockData';
import { LocationHistory, ProjectStage, ComponentRecord } from './types';
import StageCard from './components/StageCard';
import ComparisonView from './components/ComparisonView';
import ManagementModal from './components/ManagementModal';
import { analyzeChanges } from './services/geminiService';

const App: React.FC = () => {
  // Persistence Logic: Load from localStorage or fallback to mockData
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
  const [projectFilter, setProjectFilter] = useState<'All' | 'P7LH' | 'P7MH'>('All');
  const [viewMode, setViewMode] = useState<'timeline' | 'compare'>('timeline');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Local Detail Comparison State
  const [compareStages, setCompareStages] = useState<{ a: ProjectStage; b: ProjectStage }>({
    a: ProjectStage.P1B,
    b: ProjectStage.EVT
  });

  // Global Comparison State
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

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return filteredData.filter(item => 
      item.location.toLowerCase().includes(term) || 
      Object.values(item.stages).some((recs: any) => 
        recs?.some((r: ComponentRecord) => r.partNumber.toLowerCase().includes(term))
      )
    );
  }, [searchTerm, filteredData]);

  const handleSelect = (loc: LocationHistory) => {
    setSelectedLocation(loc);
    setAiAnalysis(null);
    setSearchTerm('');
    setGlobalDiffs(null);
    setViewMode('timeline');
  };

  const handleResetDatabase = () => {
    localStorage.removeItem('component_tracker_data');
    setData(INITIAL_DATA);
    setSelectedLocation(null);
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

  // Sync selectedLocation if underlying data changes in admin panel
  useEffect(() => {
    if (selectedLocation) {
      const updated = data.find(d => d.location === selectedLocation.location);
      if (updated) setSelectedLocation(updated);
      else setSelectedLocation(null);
    }
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Admin Floating Action Button */}
      <button 
        onClick={() => setIsAdminOpen(true)}
        className="fixed bottom-8 right-8 z-[60] bg-slate-900 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white"
      >
        <i className="fa-solid fa-database text-xl group-hover:hidden"></i>
        <i className="fa-solid fa-pen-to-square text-xl hidden group-hover:block"></i>
        <span className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest shadow-xl pointer-events-none">Database Manager</span>
      </button>

      <ManagementModal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        data={data}
        onSave={(newData) => setData(newData)}
        onReset={handleResetDatabase}
      />

      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50 border-b border-slate-700">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedLocation(null); setGlobalDiffs(null); }}>
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-inner">
              <i className="fa-solid fa-microchip text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Component Evolution</h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase font-mono">Hardware Engineering Platform</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
            {/* NEW: Explicit Management Button in Header */}
            <button 
              onClick={() => setIsAdminOpen(true)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-black uppercase tracking-widest text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-database"></i>
              Manage DB
            </button>

            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              {['All', 'P7LH', 'P7MH'].map((p) => (
                <button
                  key={p}
                  onClick={() => setProjectFilter(p as any)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    projectFilter === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white text-sm focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                placeholder={`Search Loc / PN...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-2xl z-50 border border-slate-200 max-h-80 overflow-y-auto ring-1 ring-black ring-opacity-5 text-slate-900">
                  {searchResults.map((res, i) => (
                    <button key={i} onClick={() => handleSelect(res)} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex justify-between items-center border-b border-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-900">{res.location}</span>
                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase">{res.project}</span>
                          {checkIfChanged(res) && <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Changed</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate italic">EVT Status: {res.stages[ProjectStage.EVT]?.length || 0} Config(s)</p>
                      </div>
                      <i className="fa-solid fa-arrow-right text-slate-300 text-xs"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {!selectedLocation ? (
          /* Landing Page Layout */
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700 gap-10">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center max-w-4xl w-full">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner border border-blue-100">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Engineering Lifecycle Database</h2>
              <p className="text-slate-500 mb-12 text-base leading-relaxed max-w-xl mx-auto">
                Comprehensive tracking of hardware component variations across stages. 
                Identify material shifts and configuration differences instantly.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left mb-12">
                {/* NEW: Primary Action Card for Management */}
                <button 
                  onClick={() => setIsAdminOpen(true)}
                  className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 hover:scale-105 hover:shadow-2xl transition-all group text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl rotate-12 group-hover:rotate-0 transition-transform">
                    <i className="fa-solid fa-database"></i>
                  </div>
                  <h4 className="font-bold text-xs mb-4 uppercase tracking-widest flex items-center gap-2 text-blue-400">
                    <i className="fa-solid fa-pen-to-square"></i> Maintain
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-bold">
                    Go to <span className="text-white underline decoration-blue-500 underline-offset-4">Database Manager</span> to edit locations & PN history.
                  </p>
                </button>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
                  <h4 className="font-bold text-slate-800 text-xs mb-4 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-magnifying-glass text-blue-500 group-hover:scale-110 transition-transform"></i> Searchable
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Instantly query by <span className="font-bold text-slate-700">Location</span> or <span className="font-bold text-slate-700">Part Number</span>.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-green-300 hover:shadow-md transition-all group">
                  <h4 className="font-bold text-slate-800 text-xs mb-4 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-code-compare text-green-500 group-hover:scale-110 transition-transform"></i> Comparisons
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Compare any <span className="font-bold text-slate-700">two milestones</span> side-by-side using the evolution tool below.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all group overflow-hidden">
                  <h4 className="font-bold text-slate-800 text-xs mb-4 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-tags text-purple-500 group-hover:scale-110 transition-transform"></i> Indexed ({filteredData.length})
                  </h4>
                  <div className="max-h-24 overflow-y-auto space-y-2 custom-scrollbar pr-1 text-[11px] font-bold">
                    {filteredData.slice(0, 10).map(item => (
                      <button key={item.location} onClick={() => handleSelect(item)} className="block w-full text-left text-slate-400 hover:text-blue-600 truncate underline decoration-slate-200 decoration-1 underline-offset-2 transition-colors">
                        {item.location}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Global Stage Comparison Tool Section */}
              <div className="mt-16 pt-16 border-t border-slate-100 text-left">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fa-solid fa-layer-group"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Global Evolution Audit</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyze changes across all locations</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Source Stage</label>
                      <select 
                        value={globalStages.a}
                        onChange={(e) => setGlobalStages(prev => ({ ...prev, a: e.target.value as ProjectStage }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      >
                        {Object.values(ProjectStage).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Target Stage</label>
                      <select 
                        value={globalStages.b}
                        onChange={(e) => setGlobalStages(prev => ({ ...prev, b: e.target.value as ProjectStage }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                      >
                        {Object.values(ProjectStage).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={runGlobalCompare}
                      className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                    >
                      Compare Stages
                    </button>
                  </div>

                  {globalDiffs && (
                    <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">
                          Results: {globalDiffs.length} Location(s) with Differences
                        </h4>
                        <button onClick={() => setGlobalDiffs(null)} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase">Clear</button>
                      </div>
                      
                      {globalDiffs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {globalDiffs.map((loc) => (
                            <button 
                              key={loc.location} 
                              onClick={() => handleSelect(loc)}
                              className="group bg-white border border-slate-200 p-4 rounded-2xl text-left hover:border-blue-500 hover:shadow-lg transition-all flex items-center justify-between"
                            >
                              <div>
                                <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase block mb-1 w-fit">{loc.project}</span>
                                <span className="font-bold text-slate-900">{loc.location}</span>
                              </div>
                              <div className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <i className="fa-solid fa-bolt"></i>
                                Changed
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center text-slate-400">
                          <i className="fa-solid fa-circle-check text-green-500 text-2xl mb-4"></i>
                          <p className="font-bold">No material differences found between {globalStages.a} and {globalStages.b}.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            {/* Component Detail Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-200 pb-10">
              <div>
                <nav className="flex mb-4" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
                    <li className="inline-flex items-center">
                      <button onClick={() => { setSelectedLocation(null); setGlobalDiffs(null); }} className="hover:text-blue-600 transition-colors">Home</button>
                    </li>
                    <i className="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
                    <li><span className="text-slate-500">{selectedLocation.project}</span></li>
                    <i className="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
                    <li><span className="text-blue-600">LOC: {selectedLocation.location}</span></li>
                  </ol>
                </nav>
                <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 tracking-tight">
                  {selectedLocation.location}
                  {checkIfChanged(selectedLocation) && (
                    <span className="text-[11px] font-black bg-amber-500 text-white px-3 py-1 rounded-full uppercase shadow-sm">Part Changed</span>
                  )}
                </h2>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setViewMode(viewMode === 'timeline' ? 'compare' : 'timeline')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl shadow-sm transition-all font-bold text-xs border ${
                    viewMode === 'compare' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <i className={`fa-solid ${viewMode === 'timeline' ? 'fa-code-compare' : 'fa-clock-rotate-left'}`}></i>
                  {viewMode === 'timeline' ? 'Compare Delta' : 'Back to Timeline'}
                </button>
                <button 
                  onClick={runAiAnalysis}
                  disabled={isAnalyzing}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5 transition-all font-bold text-xs disabled:opacity-50"
                >
                  {isAnalyzing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                  Engineering Insight
                </button>
              </div>
            </div>

            {/* AI Insights Panel */}
            {aiAnalysis && (
              <div className="mb-10 bg-indigo-50 border-l-4 border-indigo-600 p-8 rounded-r-[2rem] shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-5 text-indigo-900 font-black text-xs uppercase tracking-widest">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <i className="fa-solid fa-brain text-indigo-600"></i>
                  </div>
                  <h4>Gemini Evolution Summary</h4>
                </div>
                <div className="prose prose-sm text-slate-700 max-w-none">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm antialiased">{aiAnalysis}</pre>
                </div>
              </div>
            )}

            {/* Stages Section */}
            {viewMode === 'timeline' ? (
              <div className="relative border-l-4 border-slate-100 ml-6 pl-10 space-y-10">
                {Object.values(ProjectStage).map((stage) => {
                  const records = selectedLocation.stages[stage];
                  if (!records || records.length === 0) return null;
                  return (
                    <div key={stage} className="relative">
                      <div className="absolute -left-[54px] top-6 w-7 h-7 rounded-full bg-white border-4 border-blue-600 z-10 shadow-md"></div>
                      <StageCard 
                        stage={stage} 
                        records={records} 
                        isChanged={checkIfChanged(selectedLocation)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Stage Selectors UI */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col gap-1 flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Milestone A</label>
                    <select 
                      value={compareStages.a}
                      onChange={(e) => setCompareStages(prev => ({ ...prev, a: e.target.value as ProjectStage }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {Object.values(ProjectStage).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className="text-slate-300 mt-4 md:mt-0">
                    <i className="fa-solid fa-right-left text-lg"></i>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Milestone B</label>
                    <select 
                      value={compareStages.b}
                      onChange={(e) => setCompareStages(prev => ({ ...prev, b: e.target.value as ProjectStage }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {Object.values(ProjectStage).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                
                <ComparisonView 
                  stageA={compareStages.a}
                  recordsA={selectedLocation.stages[compareStages.a] || []}
                  stageB={compareStages.b}
                  recordsB={selectedLocation.stages[compareStages.b] || []}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 p-8 text-center shadow-inner mt-auto">
        <div className="max-w-4xl mx-auto opacity-50 flex flex-col items-center gap-3">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.3em] font-black">
            © 2024 Component Evolution Tracking System • Engineering Platform v1.1
          </p>
          <div className="h-0.5 w-12 bg-slate-200 rounded-full"></div>
          <p className="text-[9px] text-slate-400 font-medium">Query & Maintain component part number shifts across project stages.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
