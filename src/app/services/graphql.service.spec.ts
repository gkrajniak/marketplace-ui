import { GraphqlService } from './graphql.service';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  MarketplaceEntry,
  NodeContext,
  PermissionClaimSelector,
  PermissionClaimSelectorRequirement,
  ProviderMetadataFilter,
} from 'models/index';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ApolloFactory } from 'services/apollo-factory';
import { LuigiClient } from 'services/luigi';
import { luigiContextSelector } from 'services/luigi/state';
import { type Mock } from 'vitest';
import { mock } from 'vitest-mock-extended';

const mockMarketplaceEntry: MarketplaceEntry = {
  metadata: { name: 'test-provider' },
  spec: {
    apiBindingName: 'test-provider-abc12',
    apiExport: {
      metadata: JSON.stringify({
        annotations: { 'kcp.io/path': '/workspaces/test' },
        name: 'test-api-export',
      }),
      spec: {
        permissionClaims: [
          {
            defaultSelector: {
              __typename: 'PermissionClaimSelector',
              matchLabels: { 'example.io/credential': 'true' },
            } as PermissionClaimSelector,
            group: 'example.io',
            identityHash: 'abc123',
            resource: 'configs',
            verbs: ['get', 'create', 'update', 'patch'],
          },
          {
            defaultSelector: null,
            group: '',
            identityHash: '',
            resource: 'events',
            verbs: ['*'],
          },
          {
            defaultSelector: {
              __typename: 'PermissionClaimSelector',
              matchAll: false,
              matchExpressions: [
                {
                  __typename: 'LabelSelectorRequirement',
                  key: 'example.io/environment',
                  operator: 'In',
                  values: ['development'],
                } as PermissionClaimSelectorRequirement,
                {
                  __typename: 'LabelSelectorRequirement',
                  key: 'example.io/ready',
                  operator: 'Exists',
                  values: null,
                } as PermissionClaimSelectorRequirement,
              ],
            } as PermissionClaimSelector,
            group: '',
            identityHash: '',
            resource: 'namespaces',
            verbs: ['get', 'list', 'watch'],
          },
          {
            defaultSelector: {
              __typename: 'PermissionClaimSelector',
              matchAll: true,
            } as PermissionClaimSelector,
            group: '',
            identityHash: '',
            resource: 'configmaps',
            verbs: ['get'],
          },
        ],
      },
    },
    providerMetadata: {
      spec: {
        displayName: 'Test Provider',
        description: 'A test provider',
        tags: [],
      },
    },
  },
};

const mockLuigiContext: NodeContext = {
  token: 'mock-token',
  accountId: 'acc-1',
  userId: 'user-1',
  entityType: 'project',
  portalBaseUrl: 'https://portal.example.com',
  portalContext: {} as any,
  serviceProviderConfig: {},
  entityName: 'my-project',
  entityId: 'proj-123',
  entity: {},
  analyticsTrackerConfig: {},
  entityContext: {},
  parentNavigationContexts: [],
  entityPath: '',
  accountPath: '',
};

describe('GraphqlService', () => {
  let service: GraphqlService;
  let mockStore: MockStore;
  let mockApolloQuery: Mock;
  let mockApolloMutate: Mock;
  let mockWsApolloMutate: Mock;
  let mockSendCustomMessage: Mock;

  beforeEach(() => {
    mockApolloQuery = vi.fn();
    mockApolloMutate = vi.fn();
    mockWsApolloMutate = vi.fn();
    mockSendCustomMessage = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        GraphqlService,
        provideMockStore({}),
        MockProvider(ApolloFactory, {
          marketplace: vi.fn().mockReturnValue({
            query: mockApolloQuery,
          }),
          workspace: vi.fn().mockReturnValue({
            mutate: mockWsApolloMutate,
          }),
        }),
        MockProvider(LuigiClient, {
          sendCustomMessage: mockSendCustomMessage,
          linkManager: vi.fn().mockReturnValue({}),
        }),
      ],
    });

    mockStore = TestBed.inject(MockStore);
    service = TestBed.inject(GraphqlService);
    mockStore.overrideSelector(luigiContextSelector, mockLuigiContext);
  });

  afterEach(() => {
    mockStore.resetSelectors();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createExtFilter', () => {
    it('should return filter with only excludeHiddenExtensions when no installableIn provided', () => {
      const filter = service.createExtFilter();
      expect(filter).toEqual({ excludeHiddenExtensions: true });
    });

    it('should include installableIn when provided', () => {
      const installableIn = ['scope1', 'scope2'];
      const filter = service.createExtFilter(installableIn);
      expect(filter).toEqual({ installableIn, excludeHiddenExtensions: true });
    });
  });

  describe('getMarketplaceEntries', () => {
    it('should query apollo with default filter when no arguments provided', () => {
      const entries = [mockMarketplaceEntry];
      mockApolloQuery.mockReturnValue(
        of({
          data: {
            marketplace_platform_mesh_io: {
              v1alpha1: {
                MarketplaceEntries: { items: entries },
              },
            },
          },
        }),
      );

      let result: MarketplaceEntry[] | undefined;
      service.getMarketplaceEntries().subscribe((res) => (result = res));
      mockStore.refreshState();

      expect(result).toEqual(entries);
      expect(mockApolloQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchPolicy: 'no-cache',
          variables: { filter: { excludeHiddenExtensions: true } },
        }),
      );
    });

    it('should use provided extFilter when given', () => {
      const customFilter: ProviderMetadataFilter = {
        installableIn: ['projectA'],
        excludeHiddenExtensions: true,
      };
      const entries: MarketplaceEntry[] = [];
      mockApolloQuery.mockReturnValue(
        of({
          data: {
            marketplace_platform_mesh_io: {
              v1alpha1: {
                MarketplaceEntries: { items: entries },
              },
            },
          },
        }),
      );

      let result: MarketplaceEntry[] | undefined;
      service
        .getMarketplaceEntries(undefined, customFilter)
        .subscribe((res) => (result = res));
      mockStore.refreshState();

      expect(mockApolloQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { filter: customFilter },
        }),
      );
    });
  });

  describe('installProviderInstance', () => {
    it('should mutate with correct variables and send custom message', () => {
      const linkManagerMock = { goBack: vi.fn() };
      const luigiClient = TestBed.inject(LuigiClient);
      luigiClient.linkManager = vi.fn().mockReturnValue(linkManagerMock);

      mockWsApolloMutate.mockReturnValue(of({ data: {} }));

      let completed = false;
      service
        .installProviderInstance(mockMarketplaceEntry)
        .subscribe(() => (completed = true));
      mockStore.refreshState();

      expect(mockWsApolloMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          mutation: expect.anything(),
          variables: expect.objectContaining({
            generateName: 'test-provider-',
            apiExportName: 'test-api-export',
            apiExportPath: '/workspaces/test',
            permissionClaims: [
              {
                state: 'Accepted',
                group: 'example.io',
                resource: 'configs',
                identityHash: 'abc123',
                verbs: ['get', 'create', 'update', 'patch'],
                selector: {
                  matchLabels: { 'example.io/credential': 'true' },
                },
              },
              {
                state: 'Accepted',
                group: '',
                resource: 'events',
                identityHash: '',
                verbs: ['*'],
                selector: { matchAll: true },
              },
              {
                state: 'Accepted',
                group: '',
                resource: 'namespaces',
                identityHash: '',
                verbs: ['get', 'list', 'watch'],
                selector: {
                  matchAll: false,
                  matchExpressions: [
                    {
                      key: 'example.io/environment',
                      operator: 'In',
                      values: ['development'],
                    },
                    {
                      key: 'example.io/ready',
                      operator: 'Exists',
                    },
                  ],
                },
              },
              {
                state: 'Accepted',
                group: '',
                resource: 'configmaps',
                identityHash: '',
                verbs: ['get'],
                selector: { matchAll: true },
              },
            ],
          }),
        }),
      );
      expect(mockSendCustomMessage).toHaveBeenCalled();
    });

    const entryWithClaims = (
      permissionClaims: MarketplaceEntry['spec']['apiExport']['spec']['permissionClaims'],
    ): MarketplaceEntry => ({
      ...mockMarketplaceEntry,
      spec: {
        ...mockMarketplaceEntry.spec,
        apiExport: {
          ...mockMarketplaceEntry.spec.apiExport,
          spec: { permissionClaims },
        },
      },
    });

    it('rejects an empty default selector instead of broadening it', () => {
      const entry = entryWithClaims([
        {
          defaultSelector: {},
          group: 'example.io',
          identityHash: '',
          resource: 'configs',
          verbs: ['get'],
        },
      ]);

      expect(() => service.installProviderInstance(entry)).toThrow(
        'Invalid defaultSelector for permission claim configs.example.io',
      );
      expect(mockWsApolloMutate).not.toHaveBeenCalled();
    });

    it('rejects a conflicting default selector instead of broadening it', () => {
      const entry = entryWithClaims([
        {
          defaultSelector: {
            matchAll: true,
            matchLabels: { 'example.io/credential': 'true' },
          },
          group: 'example.io',
          identityHash: '',
          resource: 'configs',
          verbs: ['get'],
        },
      ]);

      expect(() => service.installProviderInstance(entry)).toThrow(
        'Invalid defaultSelector for permission claim configs.example.io',
      );
      expect(mockWsApolloMutate).not.toHaveBeenCalled();
    });

    it('rejects a malformed match expression', () => {
      const entry = entryWithClaims([
        {
          defaultSelector: {
            matchExpressions: [
              {
                key: '',
                operator: 'In',
                values: ['development'],
              },
            ],
          },
          group: '',
          identityHash: '',
          resource: 'namespaces',
          verbs: ['get'],
        },
      ]);

      expect(() => service.installProviderInstance(entry)).toThrow(
        'Invalid defaultSelector for permission claim namespaces',
      );
      expect(mockWsApolloMutate).not.toHaveBeenCalled();
    });
  });

  describe('unInstallExtension', () => {
    it('should mutate with correct name and send custom message', () => {
      mockWsApolloMutate.mockReturnValue(of({ data: {} }));

      let completed = false;
      service
        .unInstallExtension('test-provider')
        .subscribe(() => (completed = true));
      mockStore.refreshState();

      expect(mockWsApolloMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ name: 'test-provider' }),
        }),
      );
      expect(mockSendCustomMessage).toHaveBeenCalled();
    });
  });
});
