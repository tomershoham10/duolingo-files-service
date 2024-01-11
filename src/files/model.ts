enum Transmissions {
  PASSIVE = 'passive',
  ACTIVE = 'active',
  BOTH = 'both'
}

enum SonarSystem {
  DEMON = 'demon',
  LOFAR = 'lofar'
}

export interface RecordMetadata {
  record_length: number;
  sonograms_ids: string[];
  difficulty_level: number;
  targets_ids_list: string[];
  operation: string;
  source: string;
  is_in_italy: boolean;
  transmition: Transmissions;
  channels_number: number;
  sonar_system: SonarSystem;
  is_backround_vessels: boolean;
  aux: boolean;
}

export interface SonogramMetadata {
  sonograms_ids: string[];
  record_length: number;
  difficulty_level: number;
  targets_ids_list: string[];
  operation: string;
  source: string;
  is_in_italy: boolean;
  transmition: Transmissions;
  channels_number: number;
  sonar_system: SonarSystem;
  is_backround_vessels: boolean;
  aux: boolean;
}