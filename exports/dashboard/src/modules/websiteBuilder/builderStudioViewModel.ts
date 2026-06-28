export type ActiveSurface = 'header' | 'footer' | 'branding' | 'section';
export type EditorTab = 'content' | 'layout' | 'style';
export type SectionKind = 'hero' | 'categories' | 'featured-products' | 'promotion-banner' | 'testimonials' | 'footer';

export interface BuilderPanelGroup {
  id: string;
  title: string;
}

export function getBuilderSelectionLabel(activeSurface: ActiveSurface, sectionLabel: string) {
  if (activeSurface === 'header') return 'Header & Navigation';
  if (activeSurface === 'footer') return 'Footer Builder';
  if (activeSurface === 'branding') return 'Theme Settings';
  return sectionLabel;
}

export function buildBuilderPanelGroups(input: {
  activeSurface: ActiveSurface;
  editorTab: EditorTab;
  sectionKind?: SectionKind;
}): BuilderPanelGroup[] {
  if (input.activeSurface === 'header') {
    return [
      { id: 'logo', title: 'Logo' },
      { id: 'announcement', title: 'Announcement' },
      { id: 'behavior', title: 'Header Behavior' },
    ];
  }

  if (input.activeSurface === 'branding') {
    return [
      { id: 'theme', title: 'Theme Tokens' },
      { id: 'layout', title: 'Global Layout' },
      { id: 'background', title: 'Background Defaults' },
    ];
  }

  if (input.activeSurface === 'footer') {
    return [
      { id: 'content', title: 'Footer Content' },
      { id: 'columns', title: 'Columns' },
      { id: 'newsletter', title: 'Newsletter' },
    ];
  }

  if (input.editorTab === 'content') {
    return [
      { id: 'content', title: 'Content' },
      { id: 'media', title: 'Media' },
      { id: 'links', title: 'Links' },
    ];
  }

  if (input.editorTab === 'layout') {
    return [
      { id: 'layout', title: 'Layout' },
      { id: 'spacing', title: 'Spacing' },
      { id: 'width', title: 'Width' },
    ];
  }

  return [
    { id: 'style', title: 'Style' },
    { id: 'background', title: 'Background' },
    { id: 'advanced', title: 'Advanced' },
  ];
}
