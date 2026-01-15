
import React from 'react';
import { ComponentRecord, ProjectStage } from '../types';

interface ComparisonViewProps {
  stageA: ProjectStage;
  recordsA: ComponentRecord[];
  stageB: ProjectStage;
  recordsB: ComponentRecord[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ stageA, recordsA, stageB, recordsB }) => {
  // Helper to check if a record in list B is different from list A
  const isDifferent = (pn: string, listToCompare: ComponentRecord[]) => {
    return !listToCompare.some(r => r.partNumber === pn);
  };

  const renderList = (stageName: string, records: ComponentRecord[], otherRecords: ComponentRecord[]) => (
    <div className="flex-1 min-w-[300px]">
      <div className="bg-slate-100 px-4 py-2 rounded-t-lg border-x border-t border-slate-200">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stage: {stageName}</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-b-lg divide-y divide-slate-100">
        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic text-sm">No records in this stage</div>
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
                      Unique to {stageName}
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

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {renderList(stageA, recordsA, recordsB)}
      <div className="hidden md:flex items-center justify-center text-slate-300">
        <i className="fa-solid fa-right-left text-xl"></i>
      </div>
      {renderList(stageB, recordsB, recordsA)}
    </div>
  );
};

export default ComparisonView;
