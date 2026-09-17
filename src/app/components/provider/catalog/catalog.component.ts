import { CatalogItemComponent } from './catalog-item/catalog-item.component';
import {
  getFilteredDataByInfoLabels,
  getFilteredDataBySearchTerm,
  getSortedDataByInstallStatus,
  getSortedDataByTitle,
  getSuggestions,
} from './catalog.component.service';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FormLabelComponent } from '@fundamental-ngx/core/form';
import {
  LayoutPanelBodyComponent,
  LayoutPanelComponent,
  LayoutPanelDescriptionComponent,
  LayoutPanelFooterComponent,
  LayoutPanelHeadComponent,
  LayoutPanelHeaderComponent,
  LayoutPanelTitleDirective,
} from '@fundamental-ngx/core/layout-panel';
import {
  MultiComboboxSelectionChangeEvent,
  SuggestionItem,
} from '@fundamental-ngx/platform';
import { MultiComboboxComponent } from '@fundamental-ngx/platform/form';
import { SearchFieldComponent } from '@fundamental-ngx/platform/search-field';
import { EmptyCatalogComponent } from 'components/provider/catalog/empty-catalog/empty-catalog.component';
import {
  CardFilter,
  CatalogDataItem,
  Filter,
  InfoLabelFilter,
  UiConfigFilter,
} from 'models/index';
import { CatalogFiltersUtils } from 'services/catalog-filters.utils';
import { PmLuigiContextService } from 'services/luigi';

@Component({
  selector: 'app-core-catalog',
  imports: [
    LayoutPanelComponent,
    LayoutPanelHeaderComponent,
    LayoutPanelHeadComponent,
    LayoutPanelTitleDirective,
    LayoutPanelDescriptionComponent,
    LayoutPanelBodyComponent,
    FormLabelComponent,
    MultiComboboxComponent,
    SearchFieldComponent,
    LayoutPanelFooterComponent,
    CatalogItemComponent,
    EmptyCatalogComponent,
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit, OnChanges {
  private route = inject(ActivatedRoute);
  private pmLuigiContextService = inject(PmLuigiContextService);

  readonly title = input('Catalog', {
    transform: (value: undefined | string) => value ?? 'Catalog',
  });

  /**
   * Subtitle text displayed below the catalog title.
   */
  readonly subtitle = input<string>();

  /**
   * List of catalog items to display.
   */
  @Input() data: CatalogDataItem[] = [];

  /**
   * Placeholder text for the search input field.
   */
  readonly searchPlaceholder = input('Search');

  /**
   * Disables the search input field when set to `true`.
   */
  readonly disableSearch = input(false);

  /**
   * Initial search filter value.
   */
  readonly initialFilter = input('');

  /**
   * Title displayed when no search results are found.
   */
  readonly noItemsFoundTitle = input('No results found');

  /**
   * Enables suggestions when typing in the search input.
   */
  readonly enableSuggestions = input(false);

  /**
   * If `true`, sorts the catalog items alphabetically.
   * Otherwise, items are sorted by installation status.
   */
  readonly sortAlphabetically = input(false);

  /**
   * Filters catalog items based on the provided info label filters.
   */
  @Input() infoLabelFilters?: InfoLabelFilter[];

  /**
   * Emits when an item in the catalog is clicked.
   * The event payload is the clicked item.
   */
  readonly itemClicked = output<CatalogDataItem>();

  /**
   * Emits when the search input value changes.
   * The event payload is the updated search term.
   */
  readonly inputChanged = output<string>();

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((queryParams: ParamMap) => {
        this.infoLabelFilters = this.buildInfoLabelFilters(queryParams);
      });

    this.pmLuigiContextService
      .contextObservable()
      .pipe(takeUntilDestroyed())
      .subscribe(({ context }) => {
        this.filterConfigs = context.uiConfig?.filters ?? [];
        this.buildFilterOptions();
        this.filterData();
      });
  }

  buildInfoLabelFilters(queryParams?: ParamMap): InfoLabelFilter[] | undefined {
    if (!queryParams?.keys.length) {
      return undefined;
    }

    return queryParams.keys.map((label) => {
      const stringValues = decodeURIComponent(queryParams.get(label) || '');
      return {
        label,
        values: stringValues.split(',').map((v) => v.trim()),
      };
    });
  }

  filteredData: CatalogDataItem[] = [];
  filterConfigs: UiConfigFilter[] = [];
  filterOptions: Record<string, Filter[]> = {};
  searchTerm = '';
  suggestions: SuggestionItem[] = new Array<SuggestionItem>();
  filter: CardFilter = {};

  ngOnChanges(changes: SimpleChanges) {
    const infoLabelChange = changes['infoLabelFilters'];
    const dataChange = changes['data'];
    if (
      infoLabelChange ||
      (dataChange && dataChange.previousValue !== dataChange.currentValue)
    ) {
      if (dataChange) {
        this.buildFilterOptions();
      }
      this.filterData();
    }
  }

  ngOnInit() {
    this.searchTerm = this.initialFilter();
    this.buildFilterOptions();
    this.filterData();
    if (this.enableSuggestions()) {
      this.createSuggestions();
    }
  }

  private buildFilterOptions(): void {
    const options: Record<string, Filter[]> = {};
    for (const config of this.filterConfigs) {
      options[config.label] = CatalogFiltersUtils.getFilterOptions(
        this.data,
        config.providerMetadataPath,
      );
      this.filter[config.label] ??= [];
    }
    this.filterOptions = options;
  }

  private filterData() {
    let filteredData: CatalogDataItem[] = [...this.data];
    if (this.sortAlphabetically()) {
      filteredData = getSortedDataByTitle(filteredData);
    } else {
      filteredData = getSortedDataByInstallStatus(filteredData);
    }

    if (this.infoLabelFilters?.length) {
      filteredData = getFilteredDataByInfoLabels(
        filteredData,
        this.infoLabelFilters,
      );
    }

    this.filteredData = getFilteredDataBySearchTerm(
      filteredData,
      this.searchTerm,
    );

    this.filterCards();
  }

  itemClickedHandler(item: CatalogDataItem) {
    this.itemClicked.emit(item);
  }

  createSuggestions(): void {
    this.suggestions = getSuggestions(this.filteredData);
  }

  onInputChange(searchTerm = '') {
    this.searchTerm = searchTerm;

    this.inputChanged.emit(this.searchTerm);
    this.filterData();
  }

  filterCards(): void {
    this.filteredData = this.filteredData.filter((el) =>
      this.filterConfigs.every((config) =>
        CatalogFiltersUtils.matches(
          this.filter[config.label],
          CatalogFiltersUtils.getByPath(
            el.providerMetadata,
            config.providerMetadataPath,
          ),
        ),
      ),
    );
  }

  setFilter(label: string, event: MultiComboboxSelectionChangeEvent): void {
    this.filter[label] = event.selectedItems;
    this.filterData();
  }
}
