import { featuredThemeId, themeLibraryPresets, type ThemeLibraryPreset } from './themeLibrary';

const THEME_LIBRARY_STORAGE_KEY = 'bisora-website-builder-themes';

function parseThemes(value: string | null): ThemeLibraryPreset[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as ThemeLibraryPreset[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function mergeWithPresets(savedThemes: ThemeLibraryPreset[] | null) {
  if (!savedThemes) return themeLibraryPresets;
  const savedById = new Map(savedThemes.map((theme) => [theme.id, theme]));

  return themeLibraryPresets.map((preset) => ({
    ...preset,
    status: savedById.get(preset.id)?.status ?? preset.status,
    updatedAt: savedById.get(preset.id)?.updatedAt ?? preset.updatedAt,
  }));
}

export function loadThemeLibrary(storage: Pick<Storage, 'getItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage) {
  return mergeWithPresets(parseThemes(storage?.getItem(THEME_LIBRARY_STORAGE_KEY) ?? null));
}

export function saveThemeLibrary(themes: ThemeLibraryPreset[], storage: Pick<Storage, 'setItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage) {
  storage?.setItem(THEME_LIBRARY_STORAGE_KEY, JSON.stringify(themes));
}

export function getPublishedTheme(themes: ThemeLibraryPreset[] = loadThemeLibrary()) {
  return themes.find((theme) => theme.status === 'Published') ?? themes.find((theme) => theme.id === featuredThemeId) ?? themes[0];
}
