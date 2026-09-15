import { gql } from 'apollo-angular';

export const createAPIBindingMutation = gql`
  mutation (
    $generateName: String!
    $apiExportPath: String!
    $apiExportName: String!
    $permissionClaims: [ApisKcpIoV1alpha2APIBindingSpecPermissionClaims_Input]
  ) {
    apis_kcp_io {
      v1alpha2 {
        createAPIBinding(
          object: {
            metadata: { generateName: $generateName }
            spec: {
              reference: {
                export: { name: $apiExportName, path: $apiExportPath }
              }
              permissionClaims: $permissionClaims
            }
          }
        ) {
          metadata {
            name
          }
        }
      }
    }
  }
`;

export const deleteAPIBindingMutation = gql`
  mutation ($name: String!) {
    apis_kcp_io {
      v1alpha2 {
        deleteAPIBinding(name: $name)
      }
    }
  }
`;

export const getMarketplaceEntriesQuery = gql`
  {
    marketplace_platform_mesh_io {
      v1alpha1 {
        MarketplaceEntries {
          items {
            metadata {
              name
            }
            spec {
              apiBindingName
              apiExport {
                metadata
                spec {
                  permissionClaims {
                    group
                    identityHash
                    resource
                    verbs
                    defaultSelector {
                      matchAll
                      matchExpressions {
                        key
                        operator
                        values
                      }
                      matchLabels
                    }
                  }
                }
              }
              providerMetadata {
                spec {
                  category
                  type
                  serviceLevel
                  contacts {
                    displayName
                    email
                    role
                  }
                  displayName
                  description
                  data
                  documentation {
                    displayName
                    url
                  }
                  icon {
                    light {
                      url
                      data
                    }
                    dark {
                      url
                      data
                    }
                  }
                  labels {
                    title
                    color
                    glyph
                  }
                  mainLink {
                    displayName
                    url
                  }
                  preferredSupportChannels {
                    url
                    displayName
                  }
                  detailViewExtensions {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
