
import { LocationHistory, ProjectStage } from './types';

export const MOCK_DATA: LocationHistory[] = [
  {
    location: "RF883",
    stages: {
      [ProjectStage.P1B]: [
        {
          partNumber: "118S00495",
          description: "RES,TK,226KOHM,1%,1/20W,0201",
          configs: ["FBU", "Mini", "Main"]
        }
      ],
      [ProjectStage.EVT]: [
        {
          partNumber: "118S00495",
          description: "RES,TK,226KOHM,1%,1/20W,0201",
          configs: ["FBU"]
        },
        {
          partNumber: "118S01040",
          description: "RES,TK,232K OHM,1%,1/20W,0201",
          configs: ["Mini"]
        },
        {
          partNumber: "118S00495",
          description: "RES,TK,226KOHM,1%,1/20W,0201",
          configs: ["Main"]
        }
      ]
    }
  },
  {
    location: "C1024",
    stages: {
      [ProjectStage.P1B]: [
        {
          partNumber: "076S00123",
          description: "CAP, CER, 10UF, 10V, X5R, 0402",
          configs: ["Main", "Mini"]
        }
      ],
      [ProjectStage.EVT]: [
        {
          partNumber: "076S00123",
          description: "CAP, CER, 10UF, 10V, X5R, 0402",
          configs: ["Main", "Mini", "FBU"]
        }
      ],
      [ProjectStage.DVT]: [
        {
          partNumber: "076S00999",
          description: "CAP, CER, 22UF, 6.3V, X5R, 0402",
          configs: ["Main", "Mini", "FBU"]
        }
      ]
    }
  }
];
