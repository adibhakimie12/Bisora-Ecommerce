import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutTemplate,
  Megaphone,
  Palette,
  PanelLeft,
  Monitor,
  MousePointerClick,
  Plus,
  Rocket,
  Save,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Tablet,
  Trash2,
  Type,
  Upload,
  Video,
} from 'lucide-react';
import { getStorefrontTheme, storefrontThemes, type StorefrontTheme } from './themeCatalog';
import {
  addLandingBlock,
  createDefaultLandingPage,
  deleteLandingBlock,
  duplicateLandingBlock,
  getLandingPageLiveHref,
  getLandingPagePreviewHref,
  landingPageStorageKey,
  landingBlockTypes,
  moveLandingBlock,
  normalizeLandingPage,
  updateLandingBlock,
  updateLandingColumn,
  updateLandingPageMeta,
  validateLandingPageForPublish,
  type LandingBlock,
  type LandingBlockAlign,
  type LandingButtonAction,
  type LandingBlockTone,
  type LandingBlockType,
  type LandingColumnItem,
  type LandingColumnKind,
  type LandingPageDraft,
} from './pageBuilderModel';
import {
  createDefaultThemeDraft,
  createDefaultThemeWorkspace,
  getBuilderDevices,
  getCustomizeSections,
  installTheme,
  moveSectionSetting,
  normalizeSectionSettings,
  publishTheme,
  saveDraftChange,
  setSectionLayout,
  toggleSectionVisibility,
  type CustomizeSection,
  type BuilderDevice,
  type ThemeDraftContent,
  type ThemeSectionLayout,
  type ThemeSectionSetting,
  type ThemeWorkspace,
} from './themeBuilderModel';

type BuilderTab = 'overview' | 'themes' | 'installed' | 'pages' | 'forms' | 'menus' | 'preferences';
type BuilderView = { tab: BuilderTab } | { tab: 'customize'; themeId: string };

const workspaceStorageKey = 'bisora.websiteBuilder.themeWorkspace';
const draftStorageKey = 'bisora.websiteBuilder.themeDraft';

const tabs: Array<{ key: BuilderTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'themes', label: 'Themes' },
  { key: 'installed', label: 'Installed Themes' },
  { key: 'pages', label: 'Pages' },
  { key: 'forms', label: 'Forms' },
  { key: 'menus', label: 'Menus' },
  { key: 'preferences', label: 'Preferences' },
];

export function WebsiteBuilderModule({ section, themeId }: { section?: string; subSection?: string; themeId?: string }) {
  const activeView = resolveBuilderView(section, themeId);
  const [workspace, setWorkspace] = useState<ThemeWorkspace>(loadWorkspace);
  const [draftContent, setDraftContent] = useState<ThemeDraftContent>(loadDraft);
  const [landingPage, setLandingPage] = useState<LandingPageDraft>(loadLandingPage);
  const activeTheme = getStorefrontTheme(activeView.tab === 'customize' ? activeView.themeId : workspace.installedThemeId ?? workspace.liveThemeId);
  const demoHref = `#/frontend/theme-demo/${activeTheme.id}`;
  const installed = workspace.installedThemeId === activeTheme.id;
  const live = workspace.liveThemeId === activeTheme.id;

  useEffect(() => {
    localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    localStorage.setItem(draftStorageKey, JSON.stringify(draftContent));
  }, [draftContent]);

  useEffect(() => {
    localStorage.setItem(landingPageStorageKey, JSON.stringify(landingPage));
  }, [landingPage]);

  function handleInstall(nextThemeId = activeTheme.id) {
    setWorkspace((current) => installTheme(current, nextThemeId));
  }

  function handlePublish() {
    setWorkspace((current) => publishTheme(current.installedThemeId ? current : installTheme(current, activeTheme.id)));
  }

  function handleDraftChange(sectionLabel: string, nextDraft: ThemeDraftContent) {
    setDraftContent(nextDraft);
    setWorkspace((current) => saveDraftChange(current.installedThemeId ? current : installTheme(current, activeTheme.id), sectionLabel));
  }

  return (
    <div className="space-y-6">
      <BuilderHero workspace={workspace} live={live} />

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`#/website-builder/${tab.key}`}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                tab.key === activeView.tab ? 'bg-primary text-on-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </section>

      {activeView.tab === 'themes' && (
        <ThemesGallery
          onInstall={handleInstall}
          onPublish={handlePublish}
          workspace={workspace}
        />
      )}
      {activeView.tab === 'installed' && (
        <InstalledThemes
          demoHref={demoHref}
          installed={Boolean(workspace.installedThemeId)}
          live={live}
          theme={activeTheme}
          workspace={workspace}
          onInstall={handleInstall}
          onPublish={handlePublish}
        />
      )}
      {activeView.tab === 'customize' && (
        <CustomizeThemeView
          demoHref={demoHref}
          draftContent={draftContent}
          live={live}
          theme={activeTheme}
          themeId={activeView.themeId}
          workspace={workspace}
          onChangeDraft={handleDraftChange}
          onInstall={handleInstall}
        />
      )}
      {activeView.tab === 'pages' && <PagesBuilderView page={landingPage} onChangePage={setLandingPage} />}
      {activeView.tab !== 'themes' && activeView.tab !== 'installed' && activeView.tab !== 'customize' && activeView.tab !== 'pages' && <BuilderPlaceholder activeTab={activeView.tab} />}
    </div>
  );
}

function BuilderHero({ workspace, live }: { workspace: ThemeWorkspace; live: boolean }) {
  const installedTheme = getStorefrontTheme(workspace.installedThemeId ?? undefined);
  const liveTheme = getStorefrontTheme(workspace.liveThemeId ?? undefined);
  return (
    <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Website Builder</p>
          <h1 className="mt-2 text-3xl font-semibold text-on-surface">Theme Studio</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Pick a storefront template, install it as a draft, customize each part, then publish when it is ready for buyers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-surface-low px-4 py-2 text-sm text-on-surface-variant">Draft: {workspace.installedThemeId ? installedTheme.name : 'None'}</span>
          <span className={`rounded-full px-4 py-2 text-sm ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            Live: {workspace.liveThemeId ? liveTheme.name : 'Not published'}
          </span>
        </div>
      </div>
    </section>
  );
}

function ThemesGallery({
  onInstall,
  onPublish,
  workspace,
}: {
  onInstall: (themeId: string) => void;
  onPublish: () => void;
  workspace: ThemeWorkspace;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      {storefrontThemes.map((theme) => {
        const installed = workspace.installedThemeId === theme.id;
        const live = workspace.liveThemeId === theme.id;
        const demoHref = `#/frontend/theme-demo/${theme.id}`;
        return (
          <article key={theme.id} className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-white shadow-sm">
            <div className="relative aspect-[4/5] bg-cover bg-center" style={{ backgroundImage: `url(${theme.image})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4 flex gap-2">
                {installed && <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-on-surface">Installed</span>}
                {live && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Live</span>}
              </div>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs uppercase tracking-[0.28em] text-white/80">{theme.badge}</p>
                <h2 className="mt-2 text-3xl font-semibold">{theme.name}</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-6 text-on-surface-variant">{theme.template.mood}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {theme.template.editableFields.slice(0, 5).map((field) => (
                  <span key={field.key} className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">
                    {field.label}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <a href={demoHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim">
                  <Eye className="h-4 w-4" />
                  Demo
                </a>
                <button onClick={() => onInstall(theme.id)} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low">
                  <LayoutTemplate className="h-4 w-4" />
                  {installed ? 'Installed' : 'Install Theme'}
                </button>
                <a
                  href={`#/website-builder/customize/${theme.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface transition-colors hover:bg-surface-low"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Customize
                </a>
                {installed && (
                  <button onClick={onPublish} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-on-primary transition-colors hover:bg-primary-dim">
                    <Rocket className="h-4 w-4" />
                    {live ? 'Publish Updates' : 'Publish'}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function InstalledThemes({
  demoHref,
  installed,
  live,
  theme,
  workspace,
  onInstall,
  onPublish,
}: {
  demoHref: string;
  installed: boolean;
  live: boolean;
  theme: StorefrontTheme;
  workspace: ThemeWorkspace;
  onInstall: (themeId?: string) => void;
  onPublish: () => void;
}) {
  if (!installed) {
    return (
      <section className="rounded-3xl border border-dashed border-outline-variant/30 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-on-surface-variant">Installed Themes</p>
        <h2 className="mt-2 text-2xl font-semibold text-on-surface">No theme installed yet</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">Install a theme first. It will stay as a draft until you publish it.</p>
        <a href="#/website-builder/themes" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-on-primary">
          <LayoutTemplate className="h-4 w-4" />
          Browse Themes
        </a>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <img className="h-28 w-24 rounded-3xl object-cover" src={theme.image} alt={theme.name} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface-variant">Installed Theme</p>
            <h2 className="mt-1 text-2xl font-semibold text-on-surface">{theme.name}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Status: {workspace.draftDirty ? 'Draft changes saved' : workspace.status}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={demoHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface">
            <ExternalLink className="h-4 w-4" />
            View Website
          </a>
          <a href={`#/website-builder/customize/${theme.id}`} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm text-on-surface">
            <SlidersHorizontal className="h-4 w-4" />
            Customize
          </a>
          <button onClick={onPublish} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm text-on-primary">
            <Rocket className="h-4 w-4" />
            {live ? 'Publish Updates' : 'Publish'}
          </button>
        </div>
      </div>
    </section>
  );
}

function CustomizeThemeView({
  demoHref,
  draftContent,
  live,
  theme,
  themeId,
  workspace,
  onChangeDraft,
  onInstall,
}: {
  demoHref: string;
  draftContent: ThemeDraftContent;
  live: boolean;
  theme: StorefrontTheme;
  themeId: string;
  workspace: ThemeWorkspace;
  onChangeDraft: (sectionLabel: string, nextDraft: ThemeDraftContent) => void;
  onInstall: () => void;
}) {
  const sections = useMemo(() => getCustomizeSections(), []);
  const layoutSections = normalizeSectionSettings(draftContent.sections);
  const devices = useMemo(() => getBuilderDevices(), []);
  const [selectedKey, setSelectedKey] = useState(sections[1].key);
  const [selectedLayoutKey, setSelectedLayoutKey] = useState(layoutSections[0]?.key ?? 'hero');
  const [selectedDevice, setSelectedDevice] = useState<BuilderDevice>('desktop');
  const selectedSection = sections.find((section) => section.key === selectedKey) ?? sections[0];
  const selectedLayoutSection = layoutSections.find((section) => section.key === selectedLayoutKey) ?? layoutSections[0];
  const selectedDeviceConfig = devices.find((device) => device.key === selectedDevice) ?? devices[2];
  const installed = workspace.installedThemeId === themeId;
  const Preview = theme.Preview;

  function changeSectionDraft(nextDraft: ThemeDraftContent, sectionLabel = 'Sections') {
    onChangeDraft(sectionLabel, nextDraft);
  }

  return (
    <section className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_300px] 2xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      <aside className="rounded-2xl border border-outline-variant/20 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
          <PanelLeft className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-on-surface">Customize</p>
          </div>
          <span className="rounded-full bg-surface-low px-2 py-1 text-[11px] text-on-surface-variant">{layoutSections.filter((section) => section.visible).length}/{layoutSections.length}</span>
        </div>
        <div className="mt-4 space-y-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => {
                setSelectedKey(section.key);
                if (section.key === 'homepage') setSelectedLayoutKey('hero');
                if (section.key === 'collections') setSelectedLayoutKey('collections');
                if (section.key === 'footer') setSelectedLayoutKey('newsletter');
              }}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition-colors ${
                section.key === selectedKey ? 'border border-primary bg-primary/10 text-primary' : 'bg-surface-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="block font-medium">{section.label}</span>
              <span className="mt-1 block text-xs opacity-75">{section.group}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-outline-variant/20 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">{theme.name}</p>
            <h2 className="mt-1 text-xl font-semibold text-on-surface">{selectedSection.label}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-full bg-surface-low p-1">
              {devices.map((device) => {
                const Icon = device.key === 'mobile' ? Smartphone : device.key === 'tablet' ? Tablet : Monitor;
                return (
                  <button
                    key={device.key}
                    onClick={() => setSelectedDevice(device.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                      selectedDevice === device.key ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title={device.label}
                    aria-label={device.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {device.label}
                  </button>
                );
              })}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
              <Save className="h-3.5 w-3.5" />
              Auto-save draft
            </span>
            {live && <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"><BadgeCheck className="h-3.5 w-3.5" />Live theme</span>}
          </div>
        </div>
        <div className="h-[720px] overflow-auto bg-[#f7f3ec] p-4">
          <div
            className="mx-auto origin-top rounded-2xl bg-white shadow-sm"
            style={{
              width: selectedDeviceConfig.width,
              maxWidth: selectedDevice === 'desktop' ? 'none' : selectedDeviceConfig.width,
              transform: `scale(${selectedDeviceConfig.scale})`,
              transformOrigin: 'top center',
            }}
          >
            <Preview
              mode={selectedSection.previewMode}
              draftContent={draftContent}
              focusSection={selectedSection.key}
              editorPreview
            />
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Section Settings</p>
          <h3 className="mt-1 text-2xl font-semibold text-on-surface">{selectedSection.label}</h3>
          </div>
          <span className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">Draft</span>
        </div>

        {selectedLayoutSection && (
          <div className="mt-5 rounded-2xl bg-surface-low p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-on-surface">Placement</p>
                <p className="mt-0.5 text-[11px] text-on-surface-variant">Optional, compact controls</p>
              </div>
              <div className="flex gap-1">
                <CompactIconButton
                  label={selectedLayoutSection.visible ? 'Hide section' : 'Show section'}
                  disabled={layoutSections.filter((item) => item.visible).length === 1 && selectedLayoutSection.visible}
                  onClick={() => changeSectionDraft(toggleSectionVisibility(draftContent, selectedLayoutSection.key), selectedLayoutSection.label)}
                  icon={selectedLayoutSection.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                />
                <CompactIconButton
                  label="Move up"
                  disabled={layoutSections.findIndex((section) => section.key === selectedLayoutSection.key) === 0}
                  onClick={() => changeSectionDraft(moveSectionSetting(draftContent, selectedLayoutSection.key, 'up'), selectedLayoutSection.label)}
                  icon={<ChevronUp className="h-3.5 w-3.5" />}
                />
                <CompactIconButton
                  label="Move down"
                  disabled={layoutSections.findIndex((section) => section.key === selectedLayoutSection.key) === layoutSections.length - 1}
                  onClick={() => changeSectionDraft(moveSectionSetting(draftContent, selectedLayoutSection.key, 'down'), selectedLayoutSection.label)}
                  icon={<ChevronDown className="h-3.5 w-3.5" />}
                />
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-on-surface">Layout preset</span>
              <select
                className="mt-2 w-full rounded-xl border border-outline-variant/20 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                value={selectedLayoutSection.layout}
                onChange={(event) => changeSectionDraft(setSectionLayout(draftContent, selectedLayoutSection.key, event.target.value as ThemeSectionLayout), selectedLayoutSection.label)}
              >
                {layoutOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="mt-3 flex flex-wrap gap-1">
              {layoutSections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setSelectedLayoutKey(section.key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${section.key === selectedLayoutKey ? 'bg-primary text-on-primary' : 'bg-white text-on-surface-variant'}`}
                  type="button"
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <SectionEditor
          draftContent={draftContent}
          selectedSection={selectedSection}
          onChangeDraft={onChangeDraft}
        />

        <div className="mt-6 space-y-2 border-t border-outline-variant/20 pt-5">
          {!installed && (
            <button onClick={onInstall} className="flex w-full items-center justify-center gap-2 rounded-full border border-outline-variant/20 px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-low">
              <LayoutTemplate className="h-4 w-4" />
              Install Theme
            </button>
          )}
          <a href={demoHref} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full border border-outline-variant/20 px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-low">
            <ExternalLink className="h-4 w-4" />
            View Website
          </a>
        </div>
      </aside>
    </section>
  );
}

const layoutOptions: Array<{ key: ThemeSectionLayout; label: string }> = [
  { key: 'default', label: 'Default' },
  { key: 'centered', label: 'Centered' },
  { key: 'imageFirst', label: 'Image First' },
  { key: 'compactGrid', label: 'Compact Grid' },
  { key: 'featureGrid', label: 'Feature + Grid' },
];

function getLayoutLabel(layout: ThemeSectionLayout) {
  return layoutOptions.find((option) => option.key === layout)?.label ?? 'Default';
}

function CompactIconButton({ label, icon, onClick, disabled = false }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      aria-label={label}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-white hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-35"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
    </button>
  );
}

function SectionEditor({
  draftContent,
  selectedSection,
  onChangeDraft,
}: {
  draftContent: ThemeDraftContent;
  selectedSection: CustomizeSection;
  onChangeDraft: (sectionLabel: string, nextDraft: ThemeDraftContent) => void;
}) {
  function update(nextDraft: ThemeDraftContent) {
    onChangeDraft(selectedSection.label, nextDraft);
  }

  if (selectedSection.key === 'header') {
    return (
      <div className="mt-5 space-y-4">
        <TextControl label="Logo Text" value={draftContent.logoText} onChange={(logoText) => update({ ...draftContent, logoText })} />
        <UploadControl label="Upload Logo" fileName={draftContent.logoImageName} onChange={(logoImageName) => update({ ...draftContent, logoImageName })} />
      </div>
    );
  }

  if (selectedSection.key === 'announcement') {
    return (
      <div className="mt-5 space-y-4">
        <TextControl label="Announcement Text" value={draftContent.announcementText} onChange={(announcementText) => update({ ...draftContent, announcementText })} />
      </div>
    );
  }

  if (selectedSection.key === 'homepage') {
    return (
      <div className="mt-5 space-y-4">
        <TextControl label="Hero Heading" value={draftContent.heroHeading} onChange={(heroHeading) => update({ ...draftContent, heroHeading })} />
        <TextareaControl label="Hero Description" value={draftContent.heroSubtitle} onChange={(heroSubtitle) => update({ ...draftContent, heroSubtitle })} />
        <UploadControl label="Upload Hero Image" fileName={draftContent.heroImageName} onChange={(heroImageName) => update({ ...draftContent, heroImageName })} />
      </div>
    );
  }

  if (selectedSection.key === 'collections') {
    return (
      <div className="mt-5 space-y-3">
        {draftContent.collections.map((collection, index) => (
          <TextControl
            key={`${collection}-${index}`}
            label={`Category ${index + 1}`}
            value={collection}
            onChange={(nextCollection) => {
              const nextCollections = [...draftContent.collections];
              nextCollections[index] = nextCollection;
              update({ ...draftContent, collections: nextCollections });
            }}
          />
        ))}
      </div>
    );
  }

  if (selectedSection.key === 'checkout') {
    return (
      <div className="mt-5 space-y-4">
        <TextareaControl label="Checkout Note" value={draftContent.checkoutNote} onChange={(checkoutNote) => update({ ...draftContent, checkoutNote })} />
        <div className="rounded-2xl bg-surface-low p-4">
          <p className="text-sm font-medium text-on-surface">Checkout fields</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">Full name, email, phone, address, postcode, state, notes, coupon, and payment methods stay enabled for this template.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl bg-surface-low p-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <p className="text-sm font-medium text-on-surface">Ready for template controls</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        This section is mapped in the builder. We can add deeper controls here after the first theme flow feels right.
      </p>
    </div>
  );
}

function TextControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-outline-variant/20 px-4 py-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

function TextareaControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-outline-variant/20 px-4 py-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

function UploadControl({ label, fileName, onChange }: { label: string; fileName: string; onChange: (fileName: string, imageSrc: string) => void }) {
  function handleFile(file?: File) {
    if (!file) {
      onChange('', '');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(file.name, typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  }

  return (
    <label className="block rounded-2xl border border-dashed border-outline-variant/30 bg-surface-low p-4">
      <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
        <Upload className="h-4 w-4 text-primary" />
        {label}
      </span>
      <input type="file" accept="image/*" className="mt-3 w-full text-sm text-on-surface-variant" onChange={(event) => handleFile(event.target.files?.[0])} />
      <span className="mt-3 block rounded-full bg-white px-3 py-2 text-xs text-on-surface-variant">{fileName || 'No file chosen yet'}</span>
    </label>
  );
}

function PagesBuilderView({ page, onChangePage }: { page: LandingPageDraft; onChangePage: (page: LandingPageDraft) => void }) {
  const [selectedBlockId, setSelectedBlockId] = useState(page.blocks[0]?.id ?? '');
  const [activePanel, setActivePanel] = useState<'blocks' | 'body' | 'images'>('blocks');
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPublishIssues, setShowPublishIssues] = useState(false);
  const selectedBlock = page.blocks.find((block) => block.id === selectedBlockId) ?? page.blocks[0];
  const publishCheck = validateLandingPageForPublish(page);

  function changePage(nextPage: LandingPageDraft) {
    onChangePage(nextPage);
    if (!nextPage.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(nextPage.blocks[0]?.id ?? '');
    }
  }

  function addBlock(type: LandingBlockType) {
    const nextPage = addLandingBlock(page, type, selectedBlock?.id);
    const nextBlock = nextPage.blocks.find((block) => !page.blocks.some((current) => current.id === block.id));
    onChangePage(nextPage);
    if (nextBlock) setSelectedBlockId(nextBlock.id);
  }

  function addBlockAt(type: LandingBlockType, index: number) {
    const nextPage = addLandingBlock(page, type, undefined, index);
    const nextBlock = nextPage.blocks.find((block) => !page.blocks.some((current) => current.id === block.id));
    onChangePage(nextPage);
    if (nextBlock) setSelectedBlockId(nextBlock.id);
  }

  function handlePublishToggle() {
    if (page.status === 'Published') {
      onChangePage(updateLandingPageMeta(page, { status: 'Draft' }));
      setShowPublishIssues(false);
      return;
    }

    if (!publishCheck.ready) {
      setShowPublishIssues(true);
      return;
    }

    onChangePage(updateLandingPageMeta(page, { status: 'Published' }));
    setShowPublishIssues(false);
  }

  function openPreview() {
    window.open(getLandingPagePreviewHref(page), '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">Pages</p>
          <h2 className="text-2xl font-semibold text-on-surface">Page Builder</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['desktop', 'mobile'] as const).map((device) => {
            const Icon = device === 'desktop' ? Monitor : Smartphone;
            return (
              <button
                key={device}
                onClick={() => setSelectedDevice(device)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${selectedDevice === device ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/20 text-on-surface'}`}
                type="button"
              >
                <Icon className="h-4 w-4" />
                {device === 'desktop' ? 'Desktop' : 'Mobile'}
              </button>
            );
          })}
          <button onClick={openPreview} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 px-4 py-2 text-sm text-on-surface" type="button">
            <Eye className="h-4 w-4" />
            Preview
          </button>
          {page.status === 'Published' && (
            <a href={getLandingPageLiveHref(page)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
              <ExternalLink className="h-4 w-4" />
              Live Page
            </a>
          )}
          <button onClick={handlePublishToggle} className={`rounded-xl px-4 py-2 text-sm ${page.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : publishCheck.ready ? 'bg-primary text-on-primary' : 'bg-amber-50 text-amber-700'}`} type="button">
            {page.status === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>
      <div className="bg-[#f8c93d] px-5 py-3 text-sm font-medium text-[#6f5210]">
        Your page body will be replaced by Builder content.
      </div>
      {(showPublishIssues || page.status !== 'Published') && (
        <div className={`border-b border-outline-variant/20 px-5 py-3 text-sm ${publishCheck.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
          {publishCheck.ready ? 'Ready to publish. All required landing page fields are filled.' : `Publish checklist: ${publishCheck.issues.slice(0, 3).join(' ')}`}
        </div>
      )}
      <div className="grid min-h-[760px] xl:grid-cols-[430px_minmax(0,1fr)]">
        <aside className="grid border-r border-outline-variant/20 bg-white xl:grid-cols-[74px_minmax(0,1fr)]">
          <div className="bg-[#eef1f5]">
            {[
              { key: 'blocks' as const, label: 'Blocks', icon: LayoutTemplate },
              { key: 'body' as const, label: 'Body', icon: Palette },
              { key: 'images' as const, label: 'Images', icon: ImageIcon },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} onClick={() => setActivePanel(item.key)} className={`flex w-full flex-col items-center gap-1 px-2 py-5 text-xs ${activePanel === item.key ? 'bg-white text-primary' : 'text-on-surface-variant'}`} type="button">
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="h-[760px] overflow-y-auto p-4">
            <div className="mb-4 flex flex-col gap-2">
              <input value={page.title} onChange={(event) => onChangePage(updateLandingPageMeta(page, { title: event.target.value }))} className="rounded-xl border border-outline-variant/20 px-3 py-2 text-sm font-semibold outline-none focus:border-primary" />
              <input value={page.slug} onChange={(event) => onChangePage(updateLandingPageMeta(page, { slug: event.target.value }))} className="rounded-xl border border-outline-variant/20 px-3 py-2 text-xs outline-none focus:border-primary" />
            </div>
            {activePanel === 'blocks' && <LandingBlockLibrary onAddBlock={addBlock} />}
            {activePanel === 'body' && selectedBlock && (
              <LandingBlockSettings
                block={selectedBlock}
                onChange={(patch) => onChangePage(updateLandingBlock(page, selectedBlock.id, patch))}
                onChangeColumn={(columnIndex, patch) => onChangePage(updateLandingColumn(page, selectedBlock.id, columnIndex, patch))}
              />
            )}
            {activePanel === 'images' && selectedBlock && (
              <LandingImagePanel
                block={selectedBlock}
                onChange={(patch) => onChangePage(updateLandingBlock(page, selectedBlock.id, patch))}
                onChangeColumn={(columnIndex, patch) => onChangePage(updateLandingColumn(page, selectedBlock.id, columnIndex, patch))}
              />
            )}
          </div>
        </aside>

        <div className="h-[760px] overflow-auto bg-[#d9d9d9] p-6">
          <div
            className={`mx-auto min-h-[680px] border border-white/60 bg-[#f7f7f7] p-5 shadow-inner transition-all ${selectedDevice === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const type = event.dataTransfer.getData('application/x-bisora-block') as LandingBlockType;
              if (type) addBlockAt(type, page.blocks.length);
            }}
          >
            <DropZone label="Drop content here" onDropBlock={(type) => addBlockAt(type, 0)} />
            {page.blocks.map((block, index) => (
              <div key={block.id}>
                <LandingCanvasBlock
                  block={block}
                  index={index}
                  selected={block.id === selectedBlock?.id}
                  totalBlocks={page.blocks.length}
                  onSelect={() => {
                    setSelectedBlockId(block.id);
                    setActivePanel(block.type === 'image' ? 'images' : 'body');
                  }}
                  onMove={(direction) => changePage(moveLandingBlock(page, block.id, direction))}
                  onDuplicate={() => changePage(duplicateLandingBlock(page, block.id))}
                  onDelete={() => changePage(deleteLandingBlock(page, block.id))}
                  device={selectedDevice}
                />
                <DropZone label="Drag it here" onDropBlock={(type) => addBlockAt(type, index + 1)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingBlockLibrary({ onAddBlock }: { onAddBlock: (type: LandingBlockType) => void }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Content</p>
      <div className="grid grid-cols-2 gap-3">
        {landingBlockTypes.map((blockType) => {
          const Icon = getLandingBlockIcon(blockType.type);
          return (
            <button
              key={blockType.type}
              draggable
              onClick={() => onAddBlock(blockType.type)}
              onDragStart={(event) => {
                event.dataTransfer.setData('application/x-bisora-block', blockType.type);
                event.dataTransfer.effectAllowed = 'copy';
              }}
              className="grid min-h-24 place-items-center rounded border border-outline-variant/20 bg-white p-3 text-center text-xs font-medium uppercase tracking-[0.04em] text-on-surface-variant shadow-sm transition hover:border-primary hover:text-primary"
              type="button"
            >
              <Icon className="mb-2 h-7 w-7" />
              {blockType.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropZone({ label, onDropBlock }: { label: string; onDropBlock: (type: LandingBlockType) => void }) {
  return (
    <div
      className="my-2 flex h-9 items-center justify-center rounded border border-dashed border-[#4db6cc]/60 bg-[#dbf8ff]/50 text-xs font-medium text-[#3294aa]"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/x-bisora-block') as LandingBlockType;
        if (type) onDropBlock(type);
      }}
    >
      {label}
    </div>
  );
}

function LandingCanvasBlock({
  block,
  index,
  selected,
  totalBlocks,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
  device,
}: {
  block: LandingBlock;
  index: number;
  selected: boolean;
  totalBlocks: number;
  onSelect: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDuplicate: () => void;
  onDelete: () => void;
  device: 'desktop' | 'mobile';
}) {
  return (
    <article className={`relative overflow-hidden border bg-white transition-colors ${selected ? 'border-[#54c3d8] ring-2 ring-[#54c3d8]/25' : 'border-transparent hover:border-[#54c3d8]/60'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/15 bg-white px-3 py-2">
        <button onClick={onSelect} className="flex min-w-0 items-center gap-2 text-left" type="button">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-low text-xs text-on-surface-variant">{index + 1}</span>
          <span className="truncate text-sm font-medium text-on-surface">{getBlockTypeLabel(block.type)} · {block.title}</span>
        </button>
        <div className="flex gap-1">
          <CompactIconButton label="Move up" disabled={index === 0} onClick={() => onMove('up')} icon={<ChevronUp className="h-3.5 w-3.5" />} />
          <CompactIconButton label="Move down" disabled={index === totalBlocks - 1} onClick={() => onMove('down')} icon={<ChevronDown className="h-3.5 w-3.5" />} />
          <CompactIconButton label="Duplicate" onClick={onDuplicate} icon={<Plus className="h-3.5 w-3.5" />} />
          <CompactIconButton label="Delete" disabled={totalBlocks === 1} onClick={onDelete} icon={<Trash2 className="h-3.5 w-3.5" />} />
        </div>
      </div>
      <button onClick={onSelect} className="block w-full text-left" type="button">
        <LandingBlockPreview block={block} device={device} />
      </button>
    </article>
  );
}

function LandingBlockPreview({ block, device }: { block: LandingBlock; device: 'desktop' | 'mobile' }) {
  if ((device === 'mobile' && block.hideMobile) || (device === 'desktop' && block.hideDesktop)) {
    return (
      <div className="grid min-h-20 place-items-center bg-surface-low p-6 text-center text-xs text-on-surface-variant">
        Hidden on {device}
      </div>
    );
  }

  const toneClass = block.tone === 'dark' ? 'bg-[#211712] text-white' : block.tone === 'brand' ? 'bg-primary text-on-primary' : block.tone === 'soft' ? 'bg-surface-low text-on-surface' : 'bg-white text-on-surface';
  const alignClass = block.align === 'center' ? 'text-center items-center' : block.align === 'right' ? 'text-right items-end' : 'text-left items-start';
  const shellStyle: CSSProperties = {
    width: `${block.widthPercent}%`,
    marginLeft: block.align === 'right' || block.align === 'center' ? 'auto' : undefined,
    marginRight: block.align === 'left' || block.align === 'center' ? 'auto' : undefined,
    paddingTop: block.paddingY,
    paddingBottom: block.paddingY,
    backgroundColor: block.backgroundColor || undefined,
    color: block.textColor || undefined,
  };

  if (block.type === 'divider') {
    return <div className="grid h-12 place-items-center bg-white px-8" style={shellStyle}><div className="h-px w-full bg-on-surface/30" /></div>;
  }

  if (block.type === 'image') {
    return (
      <div className="grid min-h-52 place-items-center bg-surface-low px-6 text-center text-on-surface-variant" style={shellStyle}>
        {block.imageSrc ? <img src={block.imageSrc} alt={block.title} className="max-h-72 w-full rounded-xl object-cover" /> : <><ImageIcon className="mb-2 h-8 w-8" />{block.imageName || 'Upload image'}</>}
      </div>
    );
  }

  if (block.type === 'video') {
    return <div className="grid min-h-52 place-items-center bg-[#161616] px-6 text-center text-white" style={shellStyle}><Video className="mb-2 h-8 w-8" />{block.videoUrl || 'Paste video URL'}</div>;
  }

  if (block.type === 'columns') {
    return (
      <div className="grid min-h-32 gap-2 bg-[#e9f8fb] px-4" style={{ ...shellStyle, gridTemplateColumns: `repeat(${block.columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: block.columns }).map((_, index) => (
          <ColumnItemPreview key={index} item={block.columnItems[index]} />
        ))}
      </div>
    );
  }

  if (block.type === 'html') {
    return <div className="bg-white px-6 font-mono text-sm text-on-surface" style={shellStyle} dangerouslySetInnerHTML={{ __html: block.html }} />;
  }

  if (block.type === 'timer') {
    return <div className="bg-black px-6 text-center font-mono text-4xl text-white" style={shellStyle}>07 : 15 : 59 : 56<div className="mt-2 grid grid-cols-4 text-xs font-sans"><span>Days</span><span>Hours</span><span>Minutes</span><span>Seconds</span></div></div>;
  }

  if (block.type === 'button') {
    return <div className={`flex min-h-28 px-8 ${toneClass} ${alignClass}`} style={shellStyle}><span className="inline-flex rounded bg-[#22aeca] px-7 py-3 text-sm font-semibold text-white">{block.buttonText}</span></div>;
  }

  if (block.type === 'form') {
    return (
      <div className={`flex min-h-36 flex-col gap-3 px-8 ${toneClass} ${alignClass}`} style={shellStyle}>
        <h3 className="text-2xl font-semibold">{block.title}</h3>
        <p className="max-w-2xl text-sm leading-6 opacity-80">{block.body}</p>
        <div className="mt-2 grid gap-2 text-left sm:grid-cols-3">
          {block.formFields.map((field) => <span key={field} className="rounded border border-outline-variant/20 bg-white px-3 py-2 text-xs text-on-surface-variant">{field}</span>)}
        </div>
      </div>
    );
  }

  if (block.type === 'menu') {
    return (
      <div className={`flex min-h-20 flex-wrap gap-3 px-8 ${toneClass} ${alignClass}`} style={shellStyle}>
        {block.body.split('|').map((item) => <span key={item.trim()} className="rounded-full border border-current/20 px-3 py-1 text-xs">{item.trim()}</span>)}
      </div>
    );
  }

  return (
    <div className={`flex min-h-36 flex-col gap-3 px-8 ${toneClass} ${alignClass}`} style={shellStyle}>
      <h3 className={`${block.type === 'heading' ? 'text-4xl' : 'text-2xl'} font-semibold`}>{block.title}</h3>
      <p className="max-w-2xl whitespace-pre-line text-sm leading-6 opacity-80">{block.body}</p>
    </div>
  );
}

function ColumnItemPreview({ item }: { item: LandingColumnItem }) {
  if (item.kind === 'image') {
    return (
      <div className="min-h-28 border border-dashed border-[#54c3d8] bg-white/70 p-3 text-center text-xs text-[#3294aa]">
        {item.imageSrc ? <img src={item.imageSrc} alt={item.title} className="h-32 w-full rounded-lg object-cover" /> : <ImageIcon className="mx-auto mb-2 h-7 w-7" />}
        <p className="mt-2 font-medium text-on-surface">{item.title}</p>
        <p>{item.imageName || item.body}</p>
      </div>
    );
  }

  if (item.kind === 'button') {
    return (
      <div className="grid min-h-28 place-items-center border border-dashed border-[#54c3d8] bg-white/70 p-3 text-center text-xs text-[#3294aa]">
        <button className="rounded bg-[#22aeca] px-4 py-2 text-xs font-semibold text-white" type="button">{item.buttonText}</button>
      </div>
    );
  }

  return (
    <div className="min-h-28 border border-dashed border-[#54c3d8] bg-white/70 p-3 text-left text-xs text-on-surface-variant">
      <p className="font-semibold text-on-surface">{item.title}</p>
      <p className="mt-2 leading-5">{item.body}</p>
    </div>
  );
}

function LandingBlockSettings({
  block,
  onChange,
  onChangeColumn,
}: {
  block: LandingBlock;
  onChange: (patch: Partial<LandingBlock>) => void;
  onChangeColumn: (columnIndex: number, patch: Partial<LandingColumnItem>) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Block Settings</p>
          <h3 className="mt-1 text-2xl font-semibold text-on-surface">{getBlockTypeLabel(block.type)}</h3>
        </div>
        <span className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">Manual</span>
      </div>
      <div className="mt-5 space-y-4">
        {block.type !== 'divider' && <TextControl label="Title" value={block.title} onChange={(title) => onChange({ title })} />}
        {block.type !== 'divider' && <TextareaControl label="Text / Body" value={block.body} onChange={(body) => onChange({ body })} />}
        {block.type === 'html' && <TextareaControl label="HTML / Embed Code" value={block.html} onChange={(html) => onChange({ html })} />}
        {block.type === 'columns' && (
          <>
            <SelectControl label="Columns" value={String(block.columns)} options={['1', '2', '3', '4']} onChange={(columns) => onChange({ columns: Number(columns) })} />
            <ColumnItemsEditor block={block} onChangeColumn={onChangeColumn} />
          </>
        )}
        {(block.type === 'image') && <UploadControl label="Upload Image" fileName={block.imageName} onChange={(imageName, imageSrc) => onChange({ imageName, imageSrc })} />}
        {block.type === 'video' && <TextControl label="Video URL" value={block.videoUrl} onChange={(videoUrl) => onChange({ videoUrl })} />}
        {block.type === 'timer' && <TextControl label="End Time" value={block.timerEnd} onChange={(timerEnd) => onChange({ timerEnd })} />}
        {block.type === 'button' && (
          <>
            <TextControl label="Button Text" value={block.buttonText} onChange={(buttonText) => onChange({ buttonText })} />
            <SelectControl label="Action Type" value={block.buttonAction} options={['url', 'checkout', 'whatsapp', 'telegram', 'leadForm']} onChange={(buttonAction) => onChange({ buttonAction: buttonAction as LandingButtonAction })} />
            <TextControl label={getButtonTargetLabel(block.buttonAction)} value={block.buttonTarget || block.buttonLink} onChange={(buttonTarget) => onChange({ buttonTarget, buttonLink: buttonTarget })} />
          </>
        )}
        {block.type === 'form' && (
          <TextControl
            label="Form Fields"
            value={block.formFields.join(', ')}
            onChange={(fields) => onChange({ formFields: fields.split(',').map((field) => field.trim()).filter(Boolean) })}
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectControl label="Align" value={block.align} options={['left', 'center', 'right']} onChange={(align) => onChange({ align: align as LandingBlockAlign })} />
          <SelectControl label="Tone" value={block.tone} options={['white', 'soft', 'dark', 'brand']} onChange={(tone) => onChange({ tone: tone as LandingBlockTone })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <RangeControl label="Width" value={block.widthPercent} min={40} max={100} suffix="%" onChange={(widthPercent) => onChange({ widthPercent })} />
          <RangeControl label="Padding Y" value={block.paddingY} min={0} max={96} suffix="px" onChange={(paddingY) => onChange({ paddingY })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorControl label="Background" value={block.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} />
          <ColorControl label="Text Color" value={block.textColor} onChange={(textColor) => onChange({ textColor })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleControl label="Hide Desktop" checked={block.hideDesktop} onChange={(hideDesktop) => onChange({ hideDesktop })} />
          <ToggleControl label="Hide Mobile" checked={block.hideMobile} onChange={(hideMobile) => onChange({ hideMobile })} />
        </div>
      </div>
    </div>
  );
}

function ColumnItemsEditor({ block, onChangeColumn }: { block: LandingBlock; onChangeColumn: (columnIndex: number, patch: Partial<LandingColumnItem>) => void }) {
  return (
    <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-low p-3">
      <p className="text-sm font-medium text-on-surface">Column Content</p>
      {block.columnItems.slice(0, block.columns).map((item, index) => (
        <div key={index} className="space-y-3 rounded-xl bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-on-surface">Column {index + 1}</p>
            <select value={item.kind} onChange={(event) => onChangeColumn(index, { kind: event.target.value as LandingColumnKind })} className="rounded-lg border border-outline-variant/20 px-2 py-1 text-xs">
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="button">Button</option>
            </select>
          </div>
          <TextControl label="Title" value={item.title} onChange={(title) => onChangeColumn(index, { title })} />
          {item.kind === 'image' ? (
            <UploadControl label="Upload Column Image" fileName={item.imageName} onChange={(imageName, imageSrc) => onChangeColumn(index, { imageName, imageSrc })} />
          ) : item.kind === 'button' ? (
            <>
              <TextControl label="Button Text" value={item.buttonText} onChange={(buttonText) => onChangeColumn(index, { buttonText })} />
              <TextControl label="Button Target" value={item.buttonTarget} onChange={(buttonTarget) => onChangeColumn(index, { buttonTarget })} />
            </>
          ) : (
            <TextareaControl label="Text" value={item.body} onChange={(body) => onChangeColumn(index, { body })} />
          )}
        </div>
      ))}
    </div>
  );
}

function LandingImagePanel({
  block,
  onChange,
  onChangeColumn,
}: {
  block: LandingBlock;
  onChange: (patch: Partial<LandingBlock>) => void;
  onChangeColumn: (columnIndex: number, patch: Partial<LandingColumnItem>) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-on-surface-variant">Images</p>
          <h3 className="mt-1 text-2xl font-semibold text-on-surface">Image Settings</h3>
        </div>
        <span className="rounded-full bg-surface-low px-3 py-1 text-xs text-on-surface-variant">Upload</span>
      </div>
      <div className="mt-5 space-y-4">
        {block.type === 'columns' && <ColumnItemsEditor block={block} onChangeColumn={onChangeColumn} />}
        {block.type !== 'columns' && <UploadControl label="Upload Image" fileName={block.imageName} onChange={(imageName, imageSrc) => onChange({ imageName, imageSrc })} />}
        <TextControl label="Image URL" value={block.imageName} onChange={(imageName) => onChange({ imageName })} />
        <SelectControl label="Align" value={block.align} options={['left', 'center', 'right']} onChange={(align) => onChange({ align: align as LandingBlockAlign })} />
        <TextControl label="Alternate Text" value={block.title} onChange={(title) => onChange({ title })} />
      </div>
    </div>
  );
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function RangeControl({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-on-surface">
        {label}
        <span className="text-xs text-on-surface-variant">{value}{suffix}</span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-primary" />
    </label>
  );
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const colorValue = value || '#ffffff';
  return (
    <label className="block">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <div className="mt-2 flex gap-2">
        <input type="color" value={colorValue} onChange={(event) => onChange(event.target.value)} className="h-11 w-14 rounded-xl border border-outline-variant/20 bg-white p-1" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="#ffffff" className="min-w-0 flex-1 rounded-xl border border-outline-variant/20 px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
    </label>
  );
}

function ToggleControl({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/20 text-on-surface'}`} type="button">
      {label}
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? 'bg-primary' : 'bg-outline-variant/30'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

function getLandingBlockIcon(type: LandingBlockType) {
  const iconMap: Record<LandingBlockType, typeof Type> = {
    columns: LayoutTemplate,
    button: MousePointerClick,
    divider: SlidersHorizontal,
    heading: Type,
    html: PanelLeft,
    image: ImageIcon,
    menu: PanelLeft,
    text: Type,
    timer: Monitor,
    video: Video,
    form: Megaphone,
  };
  return iconMap[type];
}

function getBlockTypeLabel(type: LandingBlockType) {
  return landingBlockTypes.find((blockType) => blockType.type === type)?.label ?? 'Block';
}

function getButtonTargetLabel(action: LandingButtonAction) {
  const labels: Record<LandingButtonAction, string> = {
    url: 'Button URL',
    checkout: 'Checkout Product / Offer',
    whatsapp: 'WhatsApp Number',
    telegram: 'Telegram Link',
    leadForm: 'Lead Form Anchor',
  };
  return labels[action];
}

function BuilderPlaceholder({ activeTab }: { activeTab: BuilderTab }) {
  const placeholderMap: Record<BuilderTab, { icon: typeof Palette; title: string; note: string }> = {
    overview: {
      icon: ShoppingBag,
      title: 'Builder flow is now template-first',
      note: 'Themes create the storefront look. Pages and Forms will come next as separate landing page and sales form builders.',
    },
    themes: {
      icon: LayoutTemplate,
      title: 'Themes',
      note: 'Browse storefront templates and install the one you want to customize.',
    },
    installed: {
      icon: BadgeCheck,
      title: 'Installed Themes',
      note: 'Installed drafts stay here until they are published live.',
    },
    pages: {
      icon: Type,
      title: 'Pages',
      note: 'This will become the landing page builder.',
    },
    forms: {
      icon: Megaphone,
      title: 'Forms',
      note: 'This will become the sales page and order form builder.',
    },
    menus: {
      icon: PanelLeft,
      title: 'Menus',
      note: 'This will manage storefront navigation after theme flow is stable.',
    },
    preferences: {
      icon: Palette,
      title: 'Preferences',
      note: 'This will hold SEO, domain, and global storefront preferences later.',
    },
  };
  const item = placeholderMap[activeTab];
  const Icon = item.icon;

  return (
    <section className="rounded-3xl border border-dashed border-outline-variant/30 bg-white p-8 shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-sm font-medium text-on-surface-variant">{tabs.find((tab) => tab.key === activeTab)?.label ?? 'Overview'}</p>
      <h2 className="mt-2 text-2xl font-semibold text-on-surface">{item.title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">{item.note}</p>
    </section>
  );
}

export function resolveBuilderView(section?: string, themeId?: string): BuilderView {
  if (section === 'customize' && themeId) {
    return { tab: 'customize', themeId };
  }

  return { tab: normalizeTab(section) };
}

function normalizeTab(section?: string): BuilderTab {
  if (section === 'themes' || section === 'installed' || section === 'pages' || section === 'forms' || section === 'menus' || section === 'preferences') {
    return section;
  }

  return 'overview';
}

function loadWorkspace(): ThemeWorkspace {
  try {
    const savedWorkspace = localStorage.getItem(workspaceStorageKey);
    return savedWorkspace ? { ...createDefaultThemeWorkspace(), ...JSON.parse(savedWorkspace) } : createDefaultThemeWorkspace();
  } catch {
    return createDefaultThemeWorkspace();
  }
}

function loadDraft(): ThemeDraftContent {
  try {
    const savedDraft = localStorage.getItem(draftStorageKey);
    const draft = savedDraft ? { ...createDefaultThemeDraft(), ...JSON.parse(savedDraft) } : createDefaultThemeDraft();
    return { ...draft, sections: normalizeSectionSettings(draft.sections) };
  } catch {
    return createDefaultThemeDraft();
  }
}

function loadLandingPage(): LandingPageDraft {
  try {
    const savedPage = localStorage.getItem(landingPageStorageKey);
    return normalizeLandingPage(savedPage ? { ...createDefaultLandingPage(), ...JSON.parse(savedPage) } : createDefaultLandingPage());
  } catch {
    return createDefaultLandingPage();
  }
}
