import { MessageStripType } from '@fundamental-ngx/core';
import { VerificationInfo } from 'models/verification-info';

export interface MessageStripConfig {
  type: MessageStripType;
  text: string;
  noIcon: boolean;
  dismissible: boolean;
}

export interface ActionsConfig {
  additionalActions: ActionConfig[];
  globalActions: GlobalAccountActionConfig[];
}

export interface ActionConfig {
  id: string;
  glyph: string;
  displayName: string;
  condition: string;
  executionPayload?: ExecutionPayload;
  requiredPolicies?: string[];
  confirmationPopup?: ActionPopupConfig;
  actionSuccessMessage?: string;
}

export interface GlobalAccountActionConfig {
  id: string;
  glyph: string;
  displayName: string;
  condition: string;
  actionConfig?: GlobalActionConfig;
  requiredPolicies?: string[];
}

export interface GlobalActionConfig {
  type: string;
  path: string;
}

export interface ActionPopupConfig {
  title: string;
  text: string;
  type: string;
  acceptButton: string;
  cancelButton: string;
}

export interface ExecutionPayload {
  payload: string;
}

export interface StatusConfig {
  mapping: StatusMapping;
  tooltipDataPath?: string;
  tooltipDefaultMessage?: string;
}

export interface StatusMapping {
  critical: string[];
  positive: string[];
  negative: string[];
  informative: string[];
  default: string[];
}

export interface Contact {
  displayName: string;
  email?: string;
  role?: string[];
  contactLink?: string;
}

export type ColorCategory =
  '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

export interface Label {
  title: string;
  color: ColorCategory;
  glyph?: string;
}

export interface MarketplaceEntry {
  metadata: {
    name: string;
  };
  spec: {
    apiBindingName?: string;
    apiExport: {
      metadata: string;
      spec: {
        permissionClaims: {
          group: string;
          identityHash: string;
          resource: string;
          verbs: string[];
          defaultSelector?: PermissionClaimSelector | null;
        }[];
      };
    };
    providerMetadata: ProviderMetadata;
  };
}

export interface PermissionClaimSelector {
  matchAll?: boolean;
  matchExpressions?: PermissionClaimSelectorRequirement[];
  matchLabels?: Record<string, string>;
}

export interface PermissionClaimSelectorRequirement {
  key: string;
  operator: string;
  values?: string[] | null;
}

export interface ProviderMetadata {
  spec: {
    displayName: string;
    description?: string;
    type?: string;
    category?: string;

    data?: string | ProviderMetadataSpecData;
    contacts?: Contact[];
    documentation?: Documentation[];
    icon?: Icon;
    detailViewExtensions?: DetailViewExtension[];

    links?: Link[];
    preferredSupportChannels?: Link[];
    helpCenterData?: Documentation[];

    // not supported yet
    image?: string; // data:image/x;base64,
    creationTimestamp?: string;
    labels?: Label[];
    mainLink?: Link;
    provider?: string;
    serviceLevel?: ServiceLevel;
  };
}

export interface ProviderMetadataSpecData extends Record<string, unknown> {
  verification?: VerificationInfo;
}

export interface Link {
  name: string;
  displayName?: string;
  url: string;
  default?: boolean;
}

export interface DetailViewExtension {
  url: string;
}

export enum ServiceLevel {
  VeryHigh = 'veryHigh24x7',
  High = 'high24x5',
  MediumOne = 'mediumOne16x5',
  MediumTwo = 'mediumTwo12x5',
  Low = 'low8x5',
}

export interface Documentation {
  displayName?: string;
  url?: string;
}

export interface Icon {
  light: Image;
  dark: Image;
}

export interface Image {
  url?: string;
  data?: string;
}

export interface ServiceInstanceStatusValue {
  label: string;
}

export enum ServiceStatus {
  READY = 'READY',
  IN_DELETION = 'IN_DELETION',
}

export interface InstallProviderInput {
  marketPlaceEntry: MarketplaceEntry;
  installationData?: Record<string, unknown>;
}

export interface UpdateProviderInput {
  providerInput: ProviderInput;
  instanceId: string;
  installationData: Record<string, unknown>;
}

export interface ProviderInput {
  id: string;
}

export interface ProviderMetadataFilter {
  installableIn?: string[];
  excludeHiddenExtensions?: boolean;
  excludeHiddenInGlobalCatalogExtensions?: boolean;
}
