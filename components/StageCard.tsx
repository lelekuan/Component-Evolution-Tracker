
import React from 'react';
import { ProjectStage, ComponentRecord } from '../types';

interface StageCardProps {
  stage: ProjectStage;
  records: ComponentRecord[];
}

const StageCard: React.FC<StageCardProps> = ({ stage, records }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
        <h3 className="text-white font-bold text-sm tracking-widest uppercase">-{stage}-</h3>
        <span className="text-slate-400 text-xs">{records.length} Config Group(s)</span>
      </div>
      <div className="p-4 space-y-4">
        {records.map((record, idx) => (
          <div key={idx} className="flex flex-col md:flex-row md:items-start gap-4 pb-4 last:pb-0 border-b last:border-0 border-slate-100">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  {record.configs.join(', ')}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-lg font-bold text-slate-800">{record.partNumber}</span>
                <span className="text-sm text-slate-500 italic">{record.description}</span>
              </div>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(record.partNumber)}
              className="text-slate-400 hover:text-blue-500 transition-colors self-start md:self-center"
              title="Copy Part Number"
            >
              <i className="fa-regular fa-copy"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageCard;
