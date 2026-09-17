export type CardFilter = Record<string, Filter[]>;

export interface Filter {
  label: string;
  id: string;
}
