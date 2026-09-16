import { CatalogFiltersUtils } from './catalog-filters.utils';
import { CatalogDataItem } from 'models/index';

describe('CatalogFiltersUtils', () => {
  describe('getByPath', () => {
    it('should return undefined when the root object is undefined', () => {
      expect(CatalogFiltersUtils.getByPath(undefined, 'spec.data.category')).toBeUndefined();
    });

    it('should resolve a plain nested path', () => {
      const obj = { spec: { category: 'Sandbox' } };
      expect(CatalogFiltersUtils.getByPath(obj, 'spec.category')).toBe('Sandbox');
    });

    it('should parse a JSON string encountered along the path', () => {
      const obj = {
        spec: { data: JSON.stringify({ category: 'Sandbox', provider: 'ACME' }) },
      };
      expect(CatalogFiltersUtils.getByPath(obj, 'spec.data.category')).toBe(
        'Sandbox',
      );
      expect(CatalogFiltersUtils.getByPath(obj, 'spec.data.provider')).toBe(
        'ACME',
      );
    });

    it('should resolve against an already-parsed object at the JSON segment', () => {
      const obj = { spec: { data: { category: 'Sandbox' } } };
      expect(CatalogFiltersUtils.getByPath(obj, 'spec.data.category')).toBe(
        'Sandbox',
      );
    });

    it('should return undefined for a missing intermediate segment', () => {
      const obj = { spec: {} };
      expect(CatalogFiltersUtils.getByPath(obj, 'spec.data.category')).toBeUndefined();
    });

    it('should return undefined when a JSON string segment fails to parse', () => {
      const obj = { spec: { data: 'not json' } };
      expect(CatalogFiltersUtils.getByPath(obj, 'spec.data.category')).toBeUndefined();
    });
  });

  describe('getFilterOptions', () => {
    it('should return an empty list when there is no data', () => {
      expect(CatalogFiltersUtils.getFilterOptions([], 'spec.data.category')).toEqual([]);
    });

    it('should derive unique, sorted options from the resolved path', () => {
      const data: CatalogDataItem[] = [
        { providerMetadata: { spec: { displayName: 'a', tags: [], data: { category: 'Sandbox' } } } },
        { providerMetadata: { spec: { displayName: 'b', tags: [], data: { category: 'Tooling' } } } },
        { providerMetadata: { spec: { displayName: 'c', tags: [], data: { category: 'Sandbox' } } } },
        { providerMetadata: { spec: { displayName: 'd', tags: [] } } },
      ];

      expect(
        CatalogFiltersUtils.getFilterOptions(data, 'spec.data.category'),
      ).toEqual([
        { id: 'Sandbox', label: 'Sandbox' },
        { id: 'Tooling', label: 'Tooling' },
      ]);
    });
  });

  describe('matches', () => {
    it('should return true when no filter is selected', () => {
      expect(CatalogFiltersUtils.matches([], 'Sandbox')).toBe(true);
      expect(CatalogFiltersUtils.matches(undefined, 'Sandbox')).toBe(true);
    });

    it('should return true when the value matches a selected option', () => {
      expect(
        CatalogFiltersUtils.matches(
          [{ id: 'Sandbox', label: 'Sandbox' }],
          'Sandbox',
        ),
      ).toBe(true);
    });

    it('should return false when the value matches no selected option', () => {
      expect(
        CatalogFiltersUtils.matches(
          [{ id: 'Sandbox', label: 'Sandbox' }],
          'Tooling',
        ),
      ).toBe(false);
    });

    it('should return true when any of multiple selected options match', () => {
      expect(
        CatalogFiltersUtils.matches(
          [
            { id: 'Sandbox', label: 'Sandbox' },
            { id: 'Tooling', label: 'Tooling' },
          ],
          'Tooling',
        ),
      ).toBe(true);
    });
  });
});
