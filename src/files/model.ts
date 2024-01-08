enum Transmissions {
  PASSIVE = 'passive',
  ACTIVE = 'active',
  BOTH = 'both'
}

enum SonarSystem {
  DEMON = 'demon',
  LOFAR = 'lofar'
}

export interface FileMetadata {
  recordLength: number;
  difficultyLevel: number;
  targetsIds_list: string[];
  operation: string;
  source: string;
  is_in_italy: boolean;
  transmition: Transmissions;
  channels_number: number;
  sonar_syster: SonarSystem;
  is_backround_vessels: boolean;
  aux: boolean;
}