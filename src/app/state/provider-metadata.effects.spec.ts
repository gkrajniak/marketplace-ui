import {
  loadProviderMetadata,
  retrievedProviderMetadata,
} from './provider-metadata.action';
import { ProviderMetadataEffects } from './provider-metadata.effects';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MarketplaceEntry } from 'models/provider-metadata';
import { MockProvider } from 'ng-mocks';
import { ReplaySubject, of, throwError } from 'rxjs';
import { GraphqlService } from 'services/graphql.service';
import { requestFailed } from 'state/common.action';
import { retrievedProviders } from 'state/providers.actions';

const buildMarketplaceEntry = (): MarketplaceEntry => ({
  metadata: { name: 'test-provider' },
  spec: {
    apiExport: {
      metadata: JSON.stringify({
        annotations: { 'kcp.io/path': '/workspaces/test' },
        name: 'test-api-export',
      }),
      spec: { permissionClaims: [] },
    },
    providerMetadata: {
      spec: {
        displayName: 'Test Provider',
        description: 'A test provider',
        tags: [],
      },
    },
  },
});

describe('ProviderMetadataEffects', () => {
  let effects: ProviderMetadataEffects;
  let actions$: ReplaySubject<Action>;
  let graphqlService: GraphqlService;

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        MockProvider(GraphqlService, {
          getMarketplaceEntries: vi.fn(),
        }),
      ],
    });

    effects = TestBed.inject(ProviderMetadataEffects);
    graphqlService = TestBed.inject(GraphqlService);
  });

  describe('loadProviderMetadata', () => {
    it('should dispatch requestFailed when providerName is missing', () => {
      actions$.next(loadProviderMetadata({}));

      let emittedAction: Action | undefined;
      effects.loadProviderMetadata.subscribe(
        (action) => (emittedAction = action),
      );

      expect(emittedAction).toEqual(
        expect.objectContaining({
          type: requestFailed.type,
          dialogTitle: 'Failed to retrieve provider metadata',
          goBack: false,
        }),
      );
    });

    it('should retrieve all visible marketplace entries', () => {
      const entry = buildMarketplaceEntry();
      vi.spyOn(graphqlService, 'getMarketplaceEntries').mockReturnValue(
        of([entry]),
      );

      actions$.next(loadProviderMetadata({ providerName: 'test-provider' }));

      let emittedAction: Action | undefined;
      effects.loadProviderMetadata.subscribe(
        (action) => (emittedAction = action),
      );

      expect(graphqlService.getMarketplaceEntries).toHaveBeenCalledOnce();
    });

    it('should expose all providers before the selected provider', () => {
      const entry = buildMarketplaceEntry();

      vi.spyOn(graphqlService, 'getMarketplaceEntries').mockReturnValue(
        of([entry]),
      );

      actions$.next(loadProviderMetadata({ providerName: 'test-provider' }));

      const emittedActions: Action[] = [];
      effects.loadProviderMetadata.subscribe((action) =>
        emittedActions.push(action),
      );

      expect(emittedActions).toEqual([
        retrievedProviders({ providers: [entry] }),
        retrievedProviderMetadata({ marketplaceEntry: entry }),
      ]);
    });

    it('should emit requestFailed on GraphQL error', () => {
      const error = new HttpErrorResponse({
        error: 'GraphQL error',
        status: 500,
      });
      vi.spyOn(graphqlService, 'getMarketplaceEntries').mockReturnValue(
        throwError(() => error),
      );

      actions$.next(loadProviderMetadata({ providerName: 'test-provider' }));

      let emittedAction: Action | undefined;
      effects.loadProviderMetadata.subscribe(
        (action) => (emittedAction = action),
      );

      expect(emittedAction).toEqual(
        requestFailed({
          goBack: false,
          error,
          dialogTitle: 'Failed to retrieve provider metadata',
        }),
      );
    });
  });
});
