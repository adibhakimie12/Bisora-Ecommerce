export interface VariantOptionDraftState {
  id: string;
  name: string;
  values: string[];
  pendingValue: string;
}

export function updateVariantOptionDraft(
  drafts: VariantOptionDraftState[],
  index: number,
  field: 'name' | 'pendingValue',
  value: string,
) {
  return drafts.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [field]: value } : entry));
}
