
import { LocationHistory, ProjectStage } from './types';

export const MOCK_DATA: LocationHistory[] = [
  {
    "location": "RL709",
    "project": "P7LH",
    "stages": {
      // Corrected: ProjectStage.P1B has the value "P1b"
      "P1b": [
        {
          "partNumber": "116S00000",
          "description": "OLD RES,TK,4.7K OHM",
          "configs": ["All"],
          "noted": "Initial prototype value"
        }
      ],
      "EVT": [
        {
          "partNumber": "116S00039",
          "description": "RES,TK,5.1K OHM,5%,1/16W,0402",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "RL708",
    "project": "P7LH",
    "stages": {
      // Corrected: ProjectStage.P1B has the value "P1b"
      "P1b": [
        {
          "partNumber": "116S00000",
          "description": "OLD RES,TK,1K OHM",
          "configs": ["All"]
        }
      ],
      "EVT": [
        {
          "partNumber": "116S00046",
          "description": "RES,TK,1.3K OHM,5%,1/16W,0402",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "RL710",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "116S00046",
          "description": "RES,TK,1.3K OHM,5%,1/16W,0402",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "RL713",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "116S00046",
          "description": "RES,TK,1.3K OHM,5%,1/16W,0402",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "RE130",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "116S00060",
          "description": "RES,TK,3K OHM,5%,1/16W,0402",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RE113",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RE114",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RE117",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RE124",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RE125",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RE127",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RV005",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RL608",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "RL609",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00073",
          "description": "RES,TK,0 OHM,1A MAX,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "RV000",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00095",
          "description": "RES,TK,100K OHM,5%,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RV002",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00095",
          "description": "RES,TK,100K OHM,5%,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "RL711",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00099",
          "description": "RES,TK,2.2K OHM,5%,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "RL712",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "117S00099",
          "description": "RES,TK,2.2K OHM,5%,1/20W,0201",
          "configs": ["All"],
          "noted": "Debug BOM; Not in W/O ENET"
        }
      ]
    }
  },
  {
    "location": "CE110",
    "project": "P7LH",
    "stages": {
      // Corrected: ProjectStage.P1B has the value "P1b"
      "P1b": [
        {
          "partNumber": "138S00071",
          "description": "CAP,CER,X5R,4UF",
          "configs": ["All"]
        }
      ],
      "EVT": [
        {
          "partNumber": "138S00071",
          "description": "CAP,CER,X5R,4UF,20%,6.3V,0201,T=0.55MM",
          "configs": ["All"],
          "noted": "Debug BOM"
        },
        {
          "partNumber": "138S00116",
          "description": "CAP,X5R,4UF,20%,6.3V,0201,TY",
          "configs": ["All"],
          "noted": "Second source added"
        }
      ]
    }
  },
  {
    "location": "U5250",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "311S0633",
          "description": "IC,LEVEL TRANS,2-BIT,BI-DIR,W/ESD,DSBGA8",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  },
  {
    "location": "J5200",
    "project": "P7LH",
    "stages": {
      "EVT": [
        {
          "partNumber": "516S00115",
          "description": "CONN,PLUG,B2B,12+2P,P=0.35MM,H=0.6MM",
          "configs": ["All"],
          "noted": "Debug BOM"
        }
      ]
    }
  }
];
