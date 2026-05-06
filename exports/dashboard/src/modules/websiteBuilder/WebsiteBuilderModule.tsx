import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  LayoutTemplate,
  Megaphone,
  Palette,
  PanelLeft,
  Monitor,
  Rocket,
  Save,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Tablet,
  Type,
  Upload,
} from 'lucide-react';
import { getStorefrontTheme, storefrontThemes, type StorefrontTheme } from './themeCatalog';
import {
  createDefaultThemeDraft,
  createDefaultThemeWorkspace,
  getBuilderDevices,
  getCustomizeSections,
  installTheme,
  publishTheme,
  saveDraftChange,
  type CustomizeSection,
  type BuilderDevice,
  type ThemeDraftContent,
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
      {activeView.tab !== 'themes' && activeView.tab !== 'installed' && activeView.tab !== 'customize' && <BuilderPlaceholder activeTab={activeView.tab} />}
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
  const devices = useMemo(() => getBuilderDevices(), []);
  const [selectedKey, setSelectedKey] = useState(sections[1].key);
  const [selectedDevice, setSelectedDevice] = useState<BuilderDevice>('desktop');
  const selectedSection = sections.find((section) => section.key === selectedKey) ?? sections[0];
  const selectedDeviceConfig = devices.find((device) => device.key === selectedDevice) ?? devices[2];
  const installed = workspace.installedThemeId === themeId;
  const Preview = theme.Preview;

  return (
    <section className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_300px] 2xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      <aside className="rounded-2xl border border-outline-variant/20 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <PanelLeft className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-on-surface">Customize</p>
        </div>
        <div className="mt-4 space-y-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setSelectedKey(section.key)}
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

function UploadControl({ label, fileName, onChange }: { label: string; fileName: string; onChange: (fileName: string) => void }) {
  return (
    <label className="block rounded-2xl border border-dashed border-outline-variant/30 bg-surface-low p-4">
      <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
        <Upload className="h-4 w-4 text-primary" />
        {label}
      </span>
      <input type="file" accept="image/*" className="mt-3 w-full text-sm text-on-surface-variant" onChange={(event) => onChange(event.target.files?.[0]?.name ?? '')} />
      <span className="mt-3 block rounded-full bg-white px-3 py-2 text-xs text-on-surface-variant">{fileName || 'No file chosen yet'}</span>
    </label>
  );
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
    return savedDraft ? { ...createDefaultThemeDraft(), ...JSON.parse(savedDraft) } : createDefaultThemeDraft();
  } catch {
    return createDefaultThemeDraft();
  }
}
