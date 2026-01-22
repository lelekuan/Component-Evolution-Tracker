
import React from 'react';
import { ProjectStage, ComponentRecord } from '../types';

interface StageCardProps {
  stage: ProjectStage;
  records: ComponentRecord[];
  isChanged?: boolean;
}

const StageCard: React.FC<StageCardProps> = ({ stage, records, isChanged }) => {
  return (
    <div className={`bg-white rounded-lg border shadow-sm overflow-hidden mb-6 transition-all ${
      isChanged ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
    }`}>
      <div className={`${isChanged ? 'bg-amber-500' : 'bg-slate-800'} px-4 py-2 flex justify-between items-center`}>
        <h3 className="text-white font-bold text-sm tracking-widest uppercase">-{stage}-</h3>
        {isChanged && (
          <span className="bg-white text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
            <i className="fa-solid fa-triangle-exclamation mr-1"></i> Part Changed
          </span>
        )}
      </div>
      <div className="p-4 space-y-4">
        {records.map((record, idx) => (
          <div key={idx} className="flex flex-col md:flex-row md:items-start gap-4 pb-4 last:pb-0 border-b last:border-0 border-slate-100">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isChanged ? 'text-amber-700 bg-amber-50' : 'text-blue-600 bg-blue-50'
                }`}>
                  {record.configs.join(', ')}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className={`font-mono text-lg font-bold ${isChanged ? 'text-amber-600' : 'text-slate-800'}`}>
                  {record.partNumber}
                </span>
                <span className="text-sm text-slate-500 italic">{record.description}</span>
              </div>
              {record.noted && (
                <p className="mt-2 text-[10px] text-slate-900 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded inline-block">
                  <i className="fa-solid fa-comment-dots mr-1.5 opacity-50"></i>
                  {record.noted}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageCard;
