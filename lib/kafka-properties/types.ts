export type PropertyImportance = 'high' | 'medium' | 'low' | string;

export type PropertyRow = {
  name: string;
  type: string;
  defaultValue: string;
  importance: PropertyImportance;
  purpose: string;
  incomplete?: boolean;
};

export type TocItem = {id: string; label: string};

export type MustSetRow = {property: string; target: string; why: string};
