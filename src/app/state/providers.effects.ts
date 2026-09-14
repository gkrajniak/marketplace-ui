import { loadProviders, retrievedProviders } from './providers.actions';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { GraphqlService } from 'services/graphql.service';

@Injectable({ providedIn: 'root' })
export class ProvidersEffects {
  private actions = inject(Actions);
  private graphqlService = inject(GraphqlService);

  loadProviders = createEffect(() =>
    this.actions.pipe(ofType(loadProviders)).pipe(
      mergeMap(() =>
        this.graphqlService.getMarketplaceEntries().pipe(
          map((providers) =>
            retrievedProviders({
              providers,
            }),
          ),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );
}
