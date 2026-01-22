
import React from 'react';
import { ProjectStage, ComponentRecord } from '../types';

interface StageCardProps {
  stage: ProjectStage;
  records: ComponentRecord[];
  isChanged?: boolean;
}

const StageCard: React.FC<StageCardProps> = ({ stage, records, isChanged }) => {
  return (
    <div className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden mb-6 transition-all duration-300 ${
      isChanged ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'
    }`}>
      <div className={`${isChanged ? 'bg-amber-500' : 'bg-slate-900'} px-6 py-4 flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-lg tracking-widest uppercase">-{stage}-</span>
        </div>
        {isChanged && (
          <span className="bg-white text-amber-600 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-2 shadow-sm animate-pulse">
            <i className="fa-solid fa-triangle-exclamation"></i> Part Revision
          </span>
        )}
      </div>
      <div className="p-8 space-y-6">
        {records.map((record, idx) => (
          <div key={idx} className="flex flex-col md:flex-row md:items-start gap-6 pb-6 last:pb-0 border-b last:border-0 border-slate-50">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {record.configs.map(cfg => (
                  <span key={cfg} className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${
                    isChanged ? 'text-amber-700 bg-amber-50' : 'text-blue-600 bg-blue-50'
                  }`}>
                    {cfg}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-baseline gap-4">
                <span className={`font-mono text-xl font-black ${isChanged ? 'text-amber-600' : 'text-slate-900'}`}>
                  {record.partNumber}
                </span>
                <span className="text-sm text-slate-400 font-medium">{record.description}</span>
              </div>
              {record.noted && (
                <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-600 font-bold bg-slate-50 border border-slate-100 p-3 rounded-xl italic">
                  <i className="fa-solid fa-quote-left text-[9px] text-slate-300 mt-1"></i>
                  {record.noted}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageCard;
