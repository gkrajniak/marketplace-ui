import { AdditionalInfo } from './additional-info';
import { Badge } from './badge';
import { Label, ProviderMetadata } from './provider-metadata';
import { VerificationInfo } from 'models/verification-info';

export interface CatalogDataItem {
  title?: string;
  description?: string;
  badge?: Badge;
  provider?: string;
  image?: string;
  glyph?: string;
  additionalInfo?: AdditionalInfo[];
  labels?: Label[];
  verification?: VerificationInfo;
  testId?: string;
  providerMetadata?: ProviderMetadata;
}
