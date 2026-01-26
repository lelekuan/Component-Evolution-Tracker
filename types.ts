
export enum ProjectStage {
  P1A = 'P1a',
  P1B = 'P1b',
  EVT = 'EVT',
  OVB = 'OVB', // 原本是 DVT，在此更名為 OVB
  PVT = 'PVT',
  MP = 'MP'
  // 如果要新增更多階段，直接在此加入即可，例如：
  // PILOT = 'Pilot'
}

export interface ComponentRecord {
  partNumber: string;
  description: string;
  configs: string[]; // e.g., ['FBU', 'Mini', 'Main']
  noted?: string; // Additional engineering notes
}

export interface LocationHistory {
  location: string;
  project: 'P7LH' | 'P7MH';
  stages: {
    [key in ProjectStage]?: ComponentRecord[];
  };
}

export interface SearchResult {
  location: string;
  history: LocationHistory;
}
