
import React from 'react';
import { ComponentRecord, ProjectStage } from '../types';

interface ComparisonViewProps {
  stageA: ProjectStage;
  recordsA: ComponentRecord[];
  stageB: ProjectStage;
  recordsB: ComponentRecord[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ stageA, recordsA, stageB, recordsB }) => {
  const isDifferent = (pn: string, listToCompare: ComponentRecord[]) => {
    return !listToCompare.some(r => r.partNumber === pn);
  };

  const renderList = (stageName: string, records: ComponentRecord[], otherRecords: ComponentRecord[], otherStageName: string) => {
    const isPresent = records.length > 0;
    const isOtherPresent = otherRecords.length > 0;

    return (
      <div className="flex-1 min-w-[300px]">
        <div className={`px-4 py-2 rounded-t-lg border-x border-t flex justify-between items-center ${
          isPresent ? 'bg-slate-100 border-slate-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <span className={`text-xs font-black uppercase tracking-widest ${isPresent ? 'text-slate-500' : 'text-rose-600'}`}>
            Stage: {stageName}
          </span>
          {!isPresent && (
            <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase">Not Present</span>
          )}
        </div>
        <div className={`bg-white border rounded-b-lg divide-y divide-slate-100 min-h-[200px] ${
          isPresent ? 'border-slate-200' : 'border-rose-200'
        }`}>
          {!isPresent ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <i className="fa-solid fa-ghost text-rose-200 text-4xl"></i>
              <p className="text-rose-400 font-bold text-sm italic">This location was not defined in {stageName}</p>
              {isOtherPresent && (
                <p className="text-[10px] text-slate-400 font-medium">It only exists in {otherStageName}</p>
              )}
            </div>
          ) : (
            records.map((r, idx) => {
              const changed = isDifferent(r.partNumber, otherRecords);
              return (
                <div key={idx} className={`p-4 transition-colors ${changed ? 'bg-amber-50/50' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                      {r.configs.join(', ')}
                    </span>
                    {changed && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                        {isOtherPresent ? 'Part Revised' : 'Unique to this stage'}
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-bold text-slate-800">{r.partNumber}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {renderList(stageA, recordsA, recordsB, stageB)}
      <div className="hidden md:flex items-center justify-center text-slate-300">
        <i className="fa-solid fa-right-left text-xl"></i>
      </div>
      {renderList(stageB, recordsB, recordsA, stageA)}
    </div>
  );
};

export default ComparisonView;
