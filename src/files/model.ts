import { Readable } from 'stream';

export enum BucketsNames {}

export enum SignatureTypes {
  PASSIVE = 'passive',
  ACTIVE = 'active',
  PASSIVEACTIVE = 'passive and active',
  TORPEDO = 'torpedo',
}

export enum SonarSystem {
  DEMON = 'demon',
  LOFAR = 'lofar',
}

export enum ExerciseTypes {
  FSA = 'fsa',
  SPOTRECC = 'sporrecc',
}

export enum FeaturesList {
  NUMBER_OF_BLADES = 'numberOfBlades',
}

export type Metadata =
  | FSAMetadata
  | SonogramMetadata
  | SpotreccRecordMetadata
  | SpotreccImageMetadata;

interface RecordMetadata {
  record_length: number;
  difficulty_level: number;
  exercise_type: ExerciseTypes;
}

export interface ImageMetadata {
  exercise_type: ExerciseTypes;
}

export interface FSAMetadata extends RecordMetadata {
  channels_number: number;
  sonograms_names: string[];
  targets_ids_list: string[];
  operation: string;
  source_id: string;
  is_in_italy: boolean; //
  aux: boolean;
  is_backround_vessels: boolean;
  signature_type: SignatureTypes; //
  sonar_system: SonarSystem;
}

export interface SonogramMetadata extends ImageMetadata {
  sonogram_type: SonarSystem;
  fft: number;
  bw: number;
}

export interface SpotreccRecordMetadata extends RecordMetadata {
  targets_ids?: string[];
  notable_features: FeaturesList[];
}

export interface SpotreccImageMetadata extends ImageMetadata {
  targets_ids?: string[];
  notable_features: FeaturesList[];
}

export interface SonolistStream {
  fileName: string;
  // metadata: Partial<SonogramMetadata>;
  fileStream: Readable;
}
