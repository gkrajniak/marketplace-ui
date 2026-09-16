import { CatalogDataItem, Filter } from 'models/index';

export class CatalogFiltersUtils {
  static getByPath = (obj: unknown, path: string): unknown => {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc === null || acc === undefined) {
        return undefined;
      }
      const value = typeof acc === 'string' ? this.tryParse(acc) : acc;
      return (value as Record<string, unknown> | undefined)?.[key];
    }, obj);
  };

  static getFilterOptions = (
    data: CatalogDataItem[],
    providerMetadataPath: string,
  ): Filter[] => {
    const values = data
      .map((item) => this.getByPath(item.providerMetadata, providerMetadataPath))
      .filter((value): value is string => typeof value === 'string' && !!value);

    return Array.from(new Set(values))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ id: value, label: value }));
  };

  static matches = (selected: Filter[] | undefined, value: unknown): boolean =>
    !selected?.length || selected.some((f) => f.id === value);

  private static tryParse = (value: string): unknown => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };
}
