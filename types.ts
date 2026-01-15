
export enum ProjectStage {
  P1A = 'P1a',
  P1B = 'P1b',
  EVT = 'EVT',
  DVT = 'DVT',
  PVT = 'PVT',
  MP = 'MP'
}

export interface ComponentRecord {
  partNumber: string;
  description: string;
  configs: string[]; // e.g., ['FBU', 'Mini', 'Main']
}

export interface LocationHistory {
  location: string;
  stages: {
    [key in ProjectStage]?: ComponentRecord[];
  };
}

export interface SearchResult {
  location: string;
  history: LocationHistory;
}
