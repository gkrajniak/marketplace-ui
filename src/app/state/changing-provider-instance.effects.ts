import {
  unInstallProviderInstance,
  uninstalledProviderInstanceSuccessfully,
} from './changing-provider-instance.actions';
import { loadProviders } from './providers.actions';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LuigiGoBackAction } from 'models/luigi-go-back';
import { map, mergeMap, tap } from 'rxjs/operators';
import { GraphqlService } from 'services/graphql.service';
import { LuigiClient } from 'services/luigi';
import { NotificationService } from 'services/notification.service';

@Injectable({ providedIn: 'root' })
export class ProviderInstanceEffects {
  private actions = inject(Actions);
  private graphqlService = inject(GraphqlService);
  private luigiClient = inject(LuigiClient);
  private notificationService = inject(NotificationService);

  unInstallProviderInstance = createEffect(() =>
    this.actions.pipe(
      ofType(unInstallProviderInstance),
      mergeMap(({ providerName }) => {
        return this.graphqlService.unInstallExtension(providerName).pipe(
          map(() =>
            uninstalledProviderInstanceSuccessfully({
              providerName,
            }),
          ),
        );
      }),
    ),
  );

  uninstallCompleteSuccessfully = createEffect(() =>
    this.actions.pipe(
      ofType(uninstalledProviderInstanceSuccessfully),
      tap(() => {
        this.notificationService.openSuccessToast(
          `Provider Instance Uninstalled`,
        );

        this.luigiClient
          .linkManager()
          .goBack({ action: LuigiGoBackAction.PROVIDER_INSTANCE_UNINSTALLED });
      }),
      map(() => loadProviders()),
    ),
  );
}
