
import { LocationHistory, ProjectStage } from './types';

// Precise mock data reflecting engineering shifts and multi-config variations
export const MOCK_DATA: LocationHistory[] = [
  {
    location: "RF883",
    project: "P7LH",
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
          configs: ["FBU", "Main"] 
        },
        { 
          partNumber: "118S01040", 
          description: "RES,TK,232K OHM,1%,1/20W,0201", 
          configs: ["Mini"] 
        }
      ]
    }
  },
  {
    location: "RF885",
    project: "P7LH",
    stages: {
      [ProjectStage.P1B]: [{ partNumber: "118S00373", description: "RES,TK,30.1K OHM,1%,1/20W,0201", configs: ["Main"] }],
      [ProjectStage.EVT]: [{ partNumber: "118S00521", description: "RES,TK,30K OHM,1%,1/20W,0201", configs: ["Main"] }]
    }
  },
  {
    location: "UN400",
    project: "P7LH",
    stages: {
      [ProjectStage.P1B]: [{ partNumber: "338S01216", description: "IC,PMU,KAZOO,D3252,A1,OTP-BC,LTPI,WCSP56", configs: ["Build A"] }],
      [ProjectStage.EVT]: [{ partNumber: "338S01281", description: "IC,PMU,KAZOO,D3252,A1,OTP-BC,PBO,WLCSP56", configs: ["Build B"] }]
    }
  },
  {
    location: "R2110",
    project: "P7LH",
    stages: {
      [ProjectStage.P1B]: [{ partNumber: "117S00073", description: "RES,TK,0 OHM,1A MAX,1/20W,0201", configs: ["Main"] }],
      [ProjectStage.EVT]: [{ partNumber: "117S00073", description: "RES,TK,0 OHM,1A MAX,1/20W,0201", configs: ["Main"] }]
    }
  },
  {
    location: "RC305",
    project: "P7LH",
    stages: {
      [ProjectStage.P1B]: [{ partNumber: "103S00578", description: "RES,TF,24.9K OHM,0.1%,1/20W,50PPM,0201", configs: ["Main"] }],
      [ProjectStage.EVT]: [{ partNumber: "103S00578", description: "RES,TF,24.9K OHM,0.1%,1/20W,50PPM,0201", configs: ["Main"] }]
    }
  },
  {
    location: "FP700",
    project: "P7LH",
    stages: {
      [ProjectStage.P1B]: [{ partNumber: "740S00056", description: "FUSE,6A,32V,13MOHM,0603", configs: ["Main"] }],
      [ProjectStage.EVT]: [{ partNumber: "740S0146", description: "FUSE 32V HIGH I2T 0603 FAST 6A", configs: ["Main"] }]
    }
  }
];
