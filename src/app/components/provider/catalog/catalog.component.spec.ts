import { CatalogComponent } from './catalog.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { ILuigiContextTypes } from '@luigi-project/client-support-angular';
import { CatalogDataItem, NodeContext, UiConfigFilter } from 'models/index';
import { MockProvider } from 'ng-mocks';
import { Subject, of } from 'rxjs';
import { IContextMessage, PmLuigiContextService } from 'services/luigi';
import { mock } from 'vitest-mock-extended';

describe('CoreCatalogComponent', () => {
  let component: CatalogComponent;
  let fixture: ComponentFixture<CatalogComponent>;
  let contextSubject: Subject<IContextMessage>;

  const emitFilters = (filters: UiConfigFilter[]) =>
    contextSubject.next({
      contextType: ILuigiContextTypes.UPDATE,
      context: { uiConfig: { filters } } as NodeContext,
    });

  beforeEach(async () => {
    contextSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
          },
        },
        MockProvider(PmLuigiContextService, {
          contextObservable: () => contextSubject,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('buildInfoLabelFilters', () => {
    it('should return undefined when queryParams is undefined', () => {
      expect(component.buildInfoLabelFilters(undefined)).toBeUndefined();
    });

    it('should return undefined when queryParams has no keys', () => {
      const emptyParamMap: ParamMap = {
        keys: [],
        get: () => null,
        has: () => false,
        getAll: () => [],
      };
      expect(component.buildInfoLabelFilters(emptyParamMap)).toBeUndefined();
    });

    it('should build a single info label filter from a param with one value', () => {
      const paramMap = convertToParamMap({ provider: 'hyperspace' });
      const result = component.buildInfoLabelFilters(paramMap);
      expect(result).toEqual([{ label: 'provider', values: ['hyperspace'] }]);
    });

    it('should build info label filters splitting by comma', () => {
      const paramMap = convertToParamMap({
        provider: 'hyperspace%2Cdxp',
      });
      const result = component.buildInfoLabelFilters(paramMap);
      expect(result).toEqual([
        { label: 'provider', values: ['hyperspace', 'dxp'] },
      ]);
    });

    it('should build multiple info label filters from multiple params', () => {
      const paramMap = convertToParamMap({
        provider: 'hyperspace%2Cdxp',
        category: 'Software',
      });
      const result = component.buildInfoLabelFilters(paramMap);
      expect(result).toEqual([
        { label: 'provider', values: ['hyperspace', 'dxp'] },
        { label: 'category', values: ['Software'] },
      ]);
    });
  });

  describe('ngOnInit', () => {
    it('should apply initialFilter to searchTerm', () => {
      fixture.componentRef.setInput('initialFilter', 'mySearch');
      component.ngOnInit();
      expect(component.searchTerm).toBe('mySearch');
    });

    it('should populate suggestions when enableSuggestions is true', () => {
      component.data = [
        { title: 'Item 1', description: 'Description 1' },
        { title: 'Item 2', description: 'Description 2' },
      ];
      fixture.componentRef.setInput('enableSuggestions', true);
      component.ngOnInit();
      expect(component.suggestions).toEqual([
        { value: 'Item 1' },
        { value: 'Item 2' },
      ]);
    });

    it('should not populate suggestions when enableSuggestions is false', () => {
      component.data = [{ title: 'Item 1' }];
      fixture.componentRef.setInput('enableSuggestions', false);
      component.ngOnInit();
      expect(component.suggestions).toEqual([]);
    });

    it('should have no filters when uiConfig has none', () => {
      component.data = [];
      component.ngOnInit();
      expect(component.filterConfigs).toEqual([]);
      expect(component.filterOptions).toEqual({});
    });
  });

  describe('uiConfig filters', () => {
    beforeEach(() => {
      component.data = [
        {
          title: 'kro',
          providerMetadata: {
            spec: {
              displayName: 'kro',
              tags: [],
              data: { category: 'Sandbox', provider: 'kro.run' },
            },
          },
        },
        {
          title: 'ABC',
          providerMetadata: {
            spec: {
              displayName: 'ABC',
              tags: [],
              data: { category: 'Managed Services', provider: 'ABC Corp' },
            },
          },
        },
      ];
    });

    it('should build filter options from the uiConfig filters on context emission', () => {
      emitFilters([
        { label: 'Category', providerMetadataPath: 'spec.data.category' },
        { label: 'Provider', providerMetadataPath: 'spec.data.provider' },
      ]);

      expect(component.filterConfigs).toEqual([
        { label: 'Category', providerMetadataPath: 'spec.data.category' },
        { label: 'Provider', providerMetadataPath: 'spec.data.provider' },
      ]);
      expect(component.filterOptions['Category']).toEqual([
        { id: 'Managed Services', label: 'Managed Services' },
        { id: 'Sandbox', label: 'Sandbox' },
      ]);
      expect(component.filterOptions['Provider']).toEqual([
        { id: 'ABC Corp', label: 'ABC Corp' },
        { id: 'kro.run', label: 'kro.run' },
      ]);
    });

    it('should build a single filter when only one is configured', () => {
      emitFilters([
        { label: 'Category', providerMetadataPath: 'spec.data.category' },
      ]);

      expect(component.filterConfigs.length).toBe(1);
      expect(Object.keys(component.filterOptions)).toEqual(['Category']);
    });

    it('should filter items by the selected value', () => {
      emitFilters([
        { label: 'Category', providerMetadataPath: 'spec.data.category' },
      ]);

      component.setFilter('Category', {
        selectedItems: [{ id: 'Sandbox', label: 'Sandbox' }],
      } as never);

      expect(component.filteredData.map((item) => item.title)).toEqual([
        'kro',
      ]);
    });

    it('should show all items when no value is selected', () => {
      emitFilters([
        { label: 'Category', providerMetadataPath: 'spec.data.category' },
      ]);

      component.setFilter('Category', { selectedItems: [] } as never);

      expect(component.filteredData.map((item) => item.title)).toEqual([
        'kro',
        'ABC',
      ]);
    });
  });

  describe('ngOnChanges', () => {
    it('should re-filter data when infoLabelFilters changes', () => {
      component.data = [
        {
          title: 'interesting title',
          additionalInfo: [{ label: 'content', value: 'interesting' }],
        },
        {
          title: 'Boring title',
          additionalInfo: [{ label: 'content', value: 'boring' }],
        },
      ];
      component.ngOnInit();
      const beforeCount = component.filteredData.length;

      component.infoLabelFilters = [
        { label: 'content', values: ['interesting'] },
      ];
      component.ngOnChanges({
        infoLabelFilters: {
          previousValue: undefined,
          currentValue: component.infoLabelFilters,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(beforeCount).toBe(2);
      expect(component.filteredData.length).toBe(1);
      expect(component.filteredData[0].title).toBe('interesting title');
    });

    it('should re-filter when data changes', () => {
      component.data = [];
      component.ngOnInit();

      const newData: CatalogDataItem[] = [
        { title: 'Alpha' },
        { title: 'Beta' },
      ];
      component.data = newData;
      component.ngOnChanges({
        data: {
          previousValue: [],
          currentValue: newData,
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.filteredData.length).toBe(2);
    });
  });

  describe('onInputChange', () => {
    it('should update searchTerm and emit inputChanged', () => {
      vi.spyOn(component.inputChanged, 'emit');
      component.onInputChange('hello');
      expect(component.searchTerm).toBe('hello');
      expect(component.inputChanged.emit).toHaveBeenCalledWith('hello');
    });

    it('should default to empty string when no argument provided', () => {
      vi.spyOn(component.inputChanged, 'emit');
      component.onInputChange();
      expect(component.searchTerm).toBe('');
      expect(component.inputChanged.emit).toHaveBeenCalledWith('');
    });
  });

  describe('itemClickedHandler', () => {
    it('should emit itemClicked with the item', () => {
      const item = mock<CatalogDataItem>();
      vi.spyOn(component.itemClicked, 'emit');
      component.itemClickedHandler(item);
      expect(component.itemClicked.emit).toHaveBeenCalledWith(item);
    });
  });
});
