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

export interface VariantOptionRepair {
  title: string;
  description: string;
  actionLabel: string;
  colorValues: string[];
  sharedValues: string[];
  options: VariantOptionDraftState[];
}

const standardOptionNames = new Set(['color', 'colour', 'size', 'material', 'style', 'option']);
const apparelSizeValues = new Set([
  '2xs',
  'xs',
  's',
  'm',
  'l',
  'xl',
  '2xl',
  'xxl',
  '3xl',
  'xxxl',
  '4xl',
  '5xl',
  'free size',
  'freesize',
  'one size',
  'onesize',
]);

export function buildVariantOptionRepair(options: VariantOptionDraftState[]): VariantOptionRepair | null {
  const activeOptions = options.filter((option) => option.name.trim() && option.values.length > 0);
  if (activeOptions.length < 2) return null;

  const swappedRepair = buildSwappedColorRepair(activeOptions);
  if (swappedRepair) return swappedRepair;

  const mergeRepair = buildRogueColorRepair(activeOptions);
  if (mergeRepair) return mergeRepair;

  return null;
}

export function findClosestVariantKey(variantName: string, keys: string[]) {
  const targetParts = splitVariantName(variantName);
  let bestMatch = '';
  let bestScore = 0;

  for (const key of keys) {
    const parts = splitVariantName(key);
    if (parts[0]?.toLowerCase() !== targetParts[0]?.toLowerCase()) continue;

    const prefixScore = targetParts.reduce((score, part, index) => (
      parts[index]?.toLowerCase() === part.toLowerCase() ? score + 2 : score
    ), 0);
    const overlapScore = targetParts.filter((part) =>
      parts.some((candidate) => candidate.toLowerCase() === part.toLowerCase()),
    ).length;
    const score = prefixScore + overlapScore;

    if (score > bestScore) {
      bestMatch = key;
      bestScore = score;
    }
  }

  return bestMatch || undefined;
}

export function splitVariantName(variantName: string) {
  return variantName.split('/').map((part) => part.trim()).filter(Boolean);
}

function buildSwappedColorRepair(activeOptions: VariantOptionDraftState[]): VariantOptionRepair | null {
  const sharedSignature = activeOptions[0]?.values.map(normalizeText).join('|') ?? '';
  const sameValues = activeOptions.every((option) => option.values.map(normalizeText).join('|') === sharedSignature);
  if (!sameValues) return null;

  const colorValues = uniqueTextValues(activeOptions.map((option) => toTitleCase(option.name)));
  const sharedValues = uniqueTextValues(activeOptions[0]?.values ?? []);
  if (colorValues.length < 2 || sharedValues.length === 0) return null;

  return {
    title: 'Color setup looks swapped',
    description: `Convert ${colorValues.join(', ')} into Color values and keep ${sharedValues.join(', ')} as Size.`,
    actionLabel: 'Fix color variants',
    colorValues,
    sharedValues,
    options: [
      { id: 'option-color-fixed', name: 'Color', values: colorValues, pendingValue: '' },
      {
        id: 'option-size-fixed',
        name: inferSharedOptionName(sharedValues),
        values: sharedValues,
        pendingValue: '',
      },
    ],
  };
}

function buildRogueColorRepair(activeOptions: VariantOptionDraftState[]): VariantOptionRepair | null {
  const colorOption = activeOptions.find((option) => ['color', 'colour'].includes(normalizeText(option.name)));
  const sizeOption = activeOptions.find((option) => normalizeText(option.name) === 'size');
  if (!colorOption || !sizeOption) return null;

  const sizeSignature = sizeOption.values.map(normalizeText).join('|');
  const rogueOptions = activeOptions.filter((option) => {
    const name = normalizeText(option.name);
    if (standardOptionNames.has(name)) return false;
    return option.values.map(normalizeText).join('|') === sizeSignature;
  });
  if (rogueOptions.length === 0) return null;

  const colorValues = uniqueTextValues([...colorOption.values, ...rogueOptions.map((option) => toTitleCase(option.name))]);
  const sharedValues = uniqueTextValues(sizeOption.values);

  return {
    title: 'Move color into Color values',
    description: `Move ${rogueOptions.map((option) => toTitleCase(option.name)).join(', ')} into Color values instead of making another option group.`,
    actionLabel: 'Move into Color',
    colorValues,
    sharedValues,
    options: activeOptions
      .filter((option) => !rogueOptions.some((rogue) => rogue.id === option.id))
      .map((option) => (
        option.id === colorOption.id ? { ...option, values: colorValues, pendingValue: '' } : option
      )),
  };
}

function uniqueTextValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function inferSharedOptionName(values: string[]) {
  const looksLikeSize = values.every((value) => {
    const normalizedValue = normalizeText(value);
    return /^\d+(\.\d+)?$/.test(normalizedValue) || apparelSizeValues.has(normalizedValue);
  });

  return looksLikeSize ? 'Size' : 'Option';
}

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}
