import { FeaturesList, SignatureTypes, SonarSystem } from '../files/model.js';

type MetaKeys = {
  [key: string]: string;
};

export const getFormattedMetadata = (metaKeys: MetaKeys) => {
  const convertedMetadata: Partial<any> = {};

  for (const key in metaKeys) {
    if (Object.prototype.hasOwnProperty.call(metaKeys, key)) {
      switch (key) {
        // numbers
        case 'record_length':
        case 'difficulty_level':
        case 'channels_number':
        case 'fft':
        case 'bw':
          convertedMetadata[key] = parseFloat(metaKeys[key]);
          break;

        // string[]
        case 'sonograms_names':
        case 'targets_ids_list':
          convertedMetadata[key] = metaKeys[key]
            .split(', ')
            .filter((item) => item.length > 0);
          break;

        // string
        case 'operation':
        case 'source_id':
          convertedMetadata[key] = metaKeys[key];
          break;

        // boolean
        case 'is_in_italy':
        case 'is_backround_vessels':
        case 'aux':
          convertedMetadata[key] = metaKeys[key] === 'true';
          break;

        // SignatureTypes
        case 'signature_type':
          convertedMetadata[key] =
            SignatureTypes[metaKeys[key] as keyof typeof SignatureTypes];
          break;

        // SonarSystem
        case 'sonar_system':
        case 'sonogram_type':
          convertedMetadata[key] =
            SonarSystem[metaKeys[key] as keyof typeof SonarSystem];
          break;

        // FeaturesList
        case 'notable_features':
          convertedMetadata[key] =
            FeaturesList[metaKeys[key] as keyof typeof FeaturesList];
          break;

        default:
          break;
      }
    }
  }

  return convertedMetadata;
};
