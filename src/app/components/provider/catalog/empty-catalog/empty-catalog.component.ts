import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IllustratedMessageActionsComponent,
  IllustratedMessageComponent,
  IllustratedMessageFigcaptionComponent,
  IllustratedMessageTitleDirective,
} from '@fundamental-ngx/core';

@Component({
  selector: 'app-empty-catalog',
  imports: [
    IllustratedMessageComponent,
    IllustratedMessageFigcaptionComponent,
    IllustratedMessageTitleDirective,
    IllustratedMessageActionsComponent,
  ],
  templateUrl: './empty-catalog.component.html',
  styleUrl: './empty-catalog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCatalogComponent {
  /**
   * The title of the empty catalog
   */
  readonly title = input<string>();

  sceneConfig = {
    scene: {
      url: './assets/sapIllus-Scene-NoSearchResults.svg',
      id: 'sapIllus-Scene-NoSearchResults',
    },
    dialog: {
      url: './assets/sapIllus-Dialog-NoSearchResults.svg',
      id: 'sapIllus-Dialog-NoSearchResults',
    },
  };
}
