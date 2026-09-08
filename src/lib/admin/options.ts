export type SelectOption = { value: string; label: string };

export const EMPTY_OPTION: SelectOption = { value: "", label: "—" };

export function withEmpty(options: SelectOption[]): SelectOption[] {
  return [EMPTY_OPTION, ...options];
}
