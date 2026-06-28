import { featuredThemeId, themeOrder, type ThemeLibraryPreset } from './themeLibrary';

export interface ThemeLibraryCardModel extends ThemeLibraryPreset {
  isPublished: boolean;
  isInstalled: boolean;
  statusNote: string;
}

export function buildThemeLibraryCards(themes: ThemeLibraryPreset[]): ThemeLibraryCardModel[] {
  const orderIndex = new Map<string, number>(themeOrder.map((id, index) => [id, index]));

  return [...themes]
    .sort((left, right) => (orderIndex.get(left.id) ?? 999) - (orderIndex.get(right.id) ?? 999))
    .map((theme) => ({
      ...theme,
      isPublished: theme.status === 'Published',
      isInstalled: theme.status !== 'Draft',
      statusNote:
        theme.status === 'Published'
          ? 'This is the current live storefront theme.'
          : theme.status === 'Installed'
            ? 'Installed and ready to customize.'
            : 'Install this theme to start customizing it.',
    }))
    .sort((left, right) => {
      if (left.id === featuredThemeId) return -1;
      if (right.id === featuredThemeId) return 1;
      return 0;
    });
}

export function installThemeById(themes: ThemeLibraryPreset[], id: string): ThemeLibraryPreset[] {
  return themes.map((theme) =>
    theme.id === id && theme.status === 'Draft'
      ? { ...theme, status: 'Installed', updatedAt: 'Installed just now' }
      : theme,
  );
}

export function publishThemeById(themes: ThemeLibraryPreset[], id: string): ThemeLibraryPreset[] {
  return themes.map((theme) => {
    if (theme.id === id) {
      return { ...theme, status: 'Published', updatedAt: 'Published just now' };
    }

    if (theme.status === 'Published') {
      return { ...theme, status: 'Installed', updatedAt: 'Moved back to installed library' };
    }

    return theme;
  });
}
