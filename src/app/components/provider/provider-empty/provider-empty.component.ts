import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IllustratedMessageActionsComponent,
  IllustratedMessageComponent,
  IllustratedMessageFigcaptionComponent,
  IllustratedMessageTextDirective,
  IllustratedMessageTitleDirective,
} from '@fundamental-ngx/core/illustrated-message';

@Component({
  selector: 'app-provider-empty',
  imports: [
    IllustratedMessageComponent,
    IllustratedMessageFigcaptionComponent,
    IllustratedMessageTitleDirective,
    IllustratedMessageTextDirective,
    IllustratedMessageActionsComponent,
  ],
  templateUrl: './provider-empty.component.html',
  styleUrl: './provider-empty.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderEmptyComponent {
  readonly title = input.required<string>();
  readonly msg = input<string>();

  sceneConfig = {
    scene: {
      url: 'assets/images/sapIllus-Scene-NoEntries.svg',
      id: 'sapIllus-Scene-NoEntries',
    },
    dialog: {
      url: 'assets/images/sapIllus-Dialog-NoEntries.svg',
      id: 'sapIllus-Dialog-NoEntries',
    },
  };
}
