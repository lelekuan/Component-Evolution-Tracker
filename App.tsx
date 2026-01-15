
import React, { useState, useMemo, useCallback } from 'react';
import { MOCK_DATA } from './mockData';
import { LocationHistory, ProjectStage } from './types';
import StageCard from './components/StageCard';
import { analyzeChanges } from './services/geminiService';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationHistory | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Search logic for Location or Part Number
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return MOCK_DATA.filter(item => {
      const matchLoc = item.location.toLowerCase().includes(term);
      const matchPN = Object.values(item.stages).some(records => 
        records?.some(r => r.partNumber.toLowerCase().includes(term))
      );
      return matchLoc || matchPN;
    });
  }, [searchTerm]);

  const handleSelect = (loc: LocationHistory) => {
    setSelectedLocation(loc);
    setAiAnalysis(null);
    setSearchTerm('');
  };

  const runAiAnalysis = async () => {
    if (!selectedLocation) return;
    setIsAnalyzing(true);
    const result = await analyzeChanges(selectedLocation);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fa-solid fa-microchip text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold">Component Evolution</h1>
              <p className="text-xs text-slate-400">Hardware Engineering Lifecycle Tool</p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              placeholder="Search Location (RFxxx) or Part Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute mt-1 w-full bg-white rounded-md shadow-2xl z-50 border border-slate-200 max-h-60 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(res)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between items-center border-b last:border-0 border-slate-100"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{res.location}</span>
                      <p className="text-xs text-slate-500">
                        Available in: {Object.keys(res.stages).join(', ')}
                      </p>
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {!selectedLocation ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <i className="fa-solid fa-search text-6xl mb-4 opacity-20"></i>
            <p className="text-lg">Enter a location or part number to see evolution history</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
               <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <h4 className="font-bold text-slate-700 mb-2">Try searching for:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <code className="bg-slate-100 px-1 rounded">RF883</code> (Location)</li>
                    <li>• <code className="bg-slate-100 px-1 rounded">118S00495</code> (Part Number)</li>
                    <li>• <code className="bg-slate-100 px-1 rounded">C1024</code> (Capacitor Location)</li>
                  </ul>
               </div>
               <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <h4 className="font-bold text-slate-700 mb-2">Capabilities:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Track stage-by-stage changes</li>
                    <li>• Multi-config support (FBU/Mini/Main)</li>
                    <li>• AI-powered impact analysis</li>
                  </ul>
               </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Component Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <nav className="flex mb-2" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 md:space-x-3 text-xs text-slate-500">
                    <li className="inline-flex items-center">
                      <button onClick={() => setSelectedLocation(null)} className="hover:text-blue-600">Home</button>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <i className="fa-solid fa-chevron-right mx-2 opacity-30"></i>
                        <span className="font-bold text-slate-700">Location: {selectedLocation.location}</span>
                      </div>
                    </li>
                  </ol>
                </nav>
                <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                  {selectedLocation.location}
                  <span className="text-sm font-normal bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                </h2>
              </div>
              
              <button 
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                ) : (
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                )}
                AI Evolution Analysis
              </button>
            </div>

            {/* AI Analysis Section */}
            {aiAnalysis && (
              <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold">
                  <i className="fa-solid fa-brain"></i>
                  <h4>Gemini AI Insight</h4>
                </div>
                <div className="prose prose-sm text-slate-700">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{aiAnalysis}</pre>
                </div>
              </div>
            )}

            {/* Stage Timeline */}
            <div className="relative border-l-2 border-slate-200 ml-3 pl-8 space-y-2">
              {(Object.keys(selectedLocation.stages) as ProjectStage[]).reverse().map((stage) => (
                <div key={stage} className="relative">
                  {/* Dot on line */}
                  <div className="absolute -left-[41px] top-4 w-4 h-4 rounded-full bg-slate-200 border-4 border-slate-50 z-10"></div>
                  <StageCard stage={stage} records={selectedLocation.stages[stage] || []} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 p-6 text-center text-slate-500 text-sm">
        <p>© 2024 Component Evolution Tracker • Engineering Support</p>
      </footer>
    </div>
  );
};

export default App;
