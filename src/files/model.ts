import { Readable } from "stream";

export enum SignatureTypes {
  PASSIVE = 'passive',
  ACTIVE = 'active',
  PASSIVEACTIVE = 'passive and active',
  TORPEDO = 'torpedo',
}

export enum SonarSystem {
  DEMON = 'demon',
  LOFAR = 'lofar'
}

// export interface RecordMetadata {
//   record_length: number;
//   sonograms_ids: string[];
//   difficulty_level: number;
//   targets_ids_list: string[];
//   operation: string;
//   source: string;
//   is_in_italy: boolean;
//   transmition: Transmissions;
//   channels_number: number;
//   sonar_system: SonarSystem;
//   is_backround_vessels: boolean;
//   aux: boolean;
// }

export interface RecordMetadata {
  record_length: number;
  difficulty_level: number; //
  channels_number: number;
  sonograms_ids: string[];
  targets_ids_list: string[];
  operation: string;
  source_id: string;
  is_in_italy: boolean; //
  aux: boolean;
  is_backround_vessels: boolean;
  signature_type: SignatureTypes; //
  sonar_system: SonarSystem;
}

export interface SonogramMetadata {
  sonogram_type: SonarSystem;
  fft: number;
  bw: number;
}

export interface SonolistStream {
  fileName: string;
  // metadata: Partial<SonogramMetadata>;
  fileStream: Readable;
}