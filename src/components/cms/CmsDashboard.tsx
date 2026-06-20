import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Camera,
  CheckCircle2,
  Eye,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

type Tab = "overview" | "writing" | "gear" | "work" | "photos";

type Status = {
  type: "idle" | "loading" | "success" | "error";
  text: string;
};

type WritingPost = {
  slug: string;
  title: string;
  headline: string;
  summary: string;
  keyword: string;
  metaDescription: string;
  coverImage: string;
  publishedAt: string;
  tags: string[];
  draft: boolean;
  body: string;
  updatedAt?: string;
};

type GearItem = {
  name: string;
  slug: string;
  headline: string;
  description: string;
  image: string;
  url: string;
  tag: string;
};

type GearSection = {
  title: string;
  slug: string;
  headline: string;
  description: string;
  image: string;
  items: GearItem[];
};

type Gear = {
  title: string;
  headline: string;
  description: string;
  sections: GearSection[];
};

type Project = {
  slug: string;
  order: number;
  number: string;
  title: string;
  client: string;
  year: string;
  role: string;
  summary: string;
  description: string;
  tools: string[];
  skills: string[];
  coverImage: string;
  images: string[];
  link: string;
  linkLabel: string;
  caseStudyLink: string;
};

type PhotoImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type PhotoLocation = {
  slug: string;
  order: number;
  location: string;
  headline: string;
  subheadline: string;
  description: string;
  images: PhotoImage[];
};

type CmsData = {
  writing: WritingPost[];
  gear: Gear;
  projects: Project[];
  photos: PhotoLocation[];
};

const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "writing", label: "Writing", icon: FileText },
  { id: "gear", label: "Gear", icon: Package },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "photos", label: "Photos", icon: Camera },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToString(value: string[] = []) {
  return value.join(", ");
}

function emptyWriting(): WritingPost {
  return {
    slug: "",
    title: "",
    headline: "",
    summary: "",
    keyword: "",
    metaDescription: "",
    coverImage: "",
    publishedAt: today(),
    tags: [],
    draft: false,
    body: "Start writing here...",
  };
}

function emptyGear(): Gear {
  return {
    title: "My Gear",
    headline: "Tools I actually use.",
    description: "",
    sections: [],
  };
}

function emptyGearSection(): GearSection {
  return {
    title: "New Section",
    slug: "",
    headline: "",
    description: "",
    image: "",
    items: [],
  };
}

function emptyGearItem(): GearItem {
  return {
    name: "New Gear Item",
    slug: "",
    headline: "",
    description: "",
    image: "",
    url: "",
    tag: "",
  };
}

function emptyProject(order = 99): Project {
  return {
    slug: "",
    order,
    number: String(order).padStart(2, "0"),
    title: "",
    client: "",
    year: "",
    role: "",
    summary: "",
    description: "",
    tools: [],
    skills: [],
    coverImage: "",
    images: [],
    link: "",
    linkLabel: "",
    caseStudyLink: "",
  };
}

function emptyPhotoLocation(order = 99): PhotoLocation {
  return {
    slug: "",
    order,
    location: "",
    headline: "",
    subheadline: "",
    description: "",
    images: [],
  };
}

function normalizeData(data: Partial<CmsData>): CmsData {
  return {
    writing: Array.isArray(data.writing) ? data.writing : [],
    gear: data.gear?.sections ? data.gear : emptyGear(),
    projects: Array.isArray(data.projects) ? data.projects : [],
    photos: Array.isArray(data.photos) ? data.photos : [],
  };
}

function imagesToText(images: PhotoImage[] = []) {
  return images
    .map((photo) => [photo.src, photo.alt, photo.width || "", photo.height || ""].join(" | "))
    .join("\n");
}

function textToImages(value: string): PhotoImage[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [src = "", alt = "", width = "1600", height = "1200"] = line.split("|").map((part) => part.trim());
      return {
        src,
        alt,
        width: Number(width) || 1600,
        height: Number(height) || 1200,
      };
    })
    .filter((photo) => photo.src);
}

function Field(props: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="cms-field">
      <span>{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        required={props.required}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="cms-field cms-field-full">
      <span>{props.label}</span>
      <textarea
        value={props.value}
        rows={props.rows ?? 5}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function Toggle(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="cms-toggle">
      <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} />
      <span>{props.label}</span>
    </label>
  );
}

function SmallButton(props: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={`cms-button cms-button-${props.tone ?? "primary"}`}
      type={props.type ?? "button"}
      disabled={props.disabled}
      title={props.title}
      onClick={props.onClick}
    >
      {props.icon}
      <span>{props.children}</span>
    </button>
  );
}

type CmsDashboardProps = {
  initialData?: CmsData;
};

export default function CmsDashboard({ initialData }: CmsDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const normalizedInitialData = useMemo(() => (initialData ? normalizeData(initialData) : null), [initialData]);
  const [status, setStatus] = useState<Status>(
    normalizedInitialData
      ? { type: "success", text: "CMS data ready." }
      : { type: "loading", text: "Loading CMS data..." },
  );
  const [data, setData] = useState<CmsData | null>(normalizedInitialData);
  const [writingDraft, setWritingDraft] = useState<WritingPost>(normalizedInitialData?.writing[0] ?? emptyWriting());
  const [projectDraft, setProjectDraft] = useState<Project>(
    normalizedInitialData?.projects[0] ?? emptyProject((normalizedInitialData?.projects.length ?? 0) + 1),
  );
  const [photoDraft, setPhotoDraft] = useState<PhotoLocation>(
    normalizedInitialData?.photos[0] ?? emptyPhotoLocation((normalizedInitialData?.photos.length ?? 0) + 1),
  );
  const [gearDraft, setGearDraft] = useState<Gear>(normalizedInitialData?.gear ?? emptyGear());
  const [gearSectionIndex, setGearSectionIndex] = useState(0);
  const [gearItemIndex, setGearItemIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Array<{ url: string; name: string }>>([]);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const gearUploadRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);

  const selectedGearSection = gearDraft.sections[gearSectionIndex];
  const selectedGearItem = selectedGearSection?.items[gearItemIndex];

  const metrics = useMemo(() => {
    if (!data) {
      return [
        { label: "Writing", value: "0" },
        { label: "Gear items", value: "0" },
        { label: "Work projects", value: "0" },
        { label: "Photo locations", value: "0" },
      ];
    }

    return [
      { label: "Writing", value: String(data.writing.length) },
      {
        label: "Gear items",
        value: String(data.gear.sections.reduce((sum, section) => sum + section.items.length, 0)),
      },
      { label: "Work projects", value: String(data.projects.length) },
      { label: "Photo locations", value: String(data.photos.length) },
    ];
  }, [data]);

  async function loadData(options: { quiet?: boolean } = {}) {
    if (!options.quiet) {
      setStatus({ type: "loading", text: "Loading CMS data..." });
    }

    const response = await fetch("/api/cms");

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Unable to load CMS data.");
    }

    const nextData = normalizeData(result.data);
    setData(nextData);
    setGearDraft(nextData.gear);
    setWritingDraft(nextData.writing[0] ?? emptyWriting());
    setProjectDraft(nextData.projects[0] ?? emptyProject(nextData.projects.length + 1));
    setPhotoDraft(nextData.photos[0] ?? emptyPhotoLocation(nextData.photos.length + 1));
    setGearSectionIndex(0);
    setGearItemIndex(0);

    if (!options.quiet) {
      setStatus({ type: "success", text: "CMS data ready." });
    }
  }

  useEffect(() => {
    if (normalizedInitialData) return;

    loadData().catch((error) => {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Unable to load CMS data." });
    });
  }, [normalizedInitialData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function saveResource(resource: string, payload: unknown, successText: string) {
    setSaving(true);
    setStatus({ type: "loading", text: "Saving changes..." });

    try {
      const response = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, action: "save", data: payload }),
      });
      const result = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save changes.");
      }

      const nextData = normalizeData(result.data);
      setData(nextData);
      if (resource === "gear") setGearDraft(nextData.gear);
      setStatus({ type: "success", text: successText });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Unable to save changes." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteResource(resource: string, slug: string, successText: string) {
    if (!slug || !window.confirm(`Delete ${slug}?`)) return;

    setSaving(true);
    setStatus({ type: "loading", text: "Deleting entry..." });

    try {
      const response = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, action: "delete", slug }),
      });
      const result = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete entry.");
      }

      const nextData = normalizeData(result.data);
      setData(nextData);
      setWritingDraft(nextData.writing[0] ?? emptyWriting());
      setProjectDraft(nextData.projects[0] ?? emptyProject(nextData.projects.length + 1));
      setPhotoDraft(nextData.photos[0] ?? emptyPhotoLocation(nextData.photos.length + 1));
      setStatus({ type: "success", text: successText });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Unable to delete entry." });
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(target: "photos" | "gear", files: FileList | null, slug?: string) {
    if (!files?.length) return;

    setSaving(true);
    setStatus({ type: "loading", text: "Uploading images..." });

    if (target === "photos") {
      const previews = Array.from(files).map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setUploadingImages(previews);
    }

    try {
      const form = new FormData();
      form.append("target", target);
      if (slug) form.append("slug", slug);
      Array.from(files).forEach((file) => form.append("files", file));

      const response = await fetch("/api/cms/upload", {
        method: "POST",
        body: form,
      });
      const result = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to upload images.");
      }

      const nextData = normalizeData(result.data);
      setData(nextData);

      if (target === "gear" && result.uploaded?.[0]?.src) {
        updateGearItem("image", result.uploaded[0].src);
      }

      if (target === "photos") {
        const nextLocation = nextData.photos.find((location) => location.slug === slug);
        if (nextLocation) setPhotoDraft(nextLocation);
      }

      setStatus({ type: "success", text: "Upload complete." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Unable to upload images." });
    } finally {
      setSaving(false);
      setUploadingImages((current) => {
        current.forEach((img) => URL.revokeObjectURL(img.url));
        return [];
      });
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function updateGearSection<K extends keyof GearSection>(field: K, value: GearSection[K]) {
    setGearDraft((current) => ({
      ...current,
      sections: current.sections.map((section, index) =>
        index === gearSectionIndex ? { ...section, [field]: value } : section,
      ),
    }));
  }

  function updateGearItem<K extends keyof GearItem>(field: K, value: GearItem[K]) {
    setGearDraft((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) => {
        if (sectionIndex !== gearSectionIndex) return section;

        return {
          ...section,
          items: section.items.map((item, itemIndex) =>
            itemIndex === gearItemIndex ? { ...item, [field]: value } : item,
          ),
        };
      }),
    }));
  }

  function addGearSection() {
    setGearDraft((current) => ({
      ...current,
      sections: [...current.sections, emptyGearSection()],
    }));
    setGearSectionIndex(gearDraft.sections.length);
    setGearItemIndex(0);
  }

  function addGearItem() {
    if (!selectedGearSection) return;

    setGearDraft((current) => ({
      ...current,
      sections: current.sections.map((section, index) =>
        index === gearSectionIndex ? { ...section, items: [...section.items, emptyGearItem()] } : section,
      ),
    }));
    setGearItemIndex(selectedGearSection.items.length);
  }

  function removeGearItem() {
    setGearDraft((current) => ({
      ...current,
      sections: current.sections.map((section, index) =>
        index === gearSectionIndex
          ? { ...section, items: section.items.filter((_, itemIndex) => itemIndex !== gearItemIndex) }
          : section,
      ),
    }));
    setGearItemIndex(0);
  }

  function removeGearSection() {
    setGearDraft((current) => ({
      ...current,
      sections: current.sections.filter((_, index) => index !== gearSectionIndex),
    }));
    setGearSectionIndex(0);
    setGearItemIndex(0);
  }

  function renderOverview() {
    const recentWriting = data?.writing.slice(0, 3) ?? [];
    const recentPhotos = data?.photos.slice(0, 3) ?? [];

    return (
      <section className="cms-section">
        <div className="cms-section-head">
          <div>
            <p className="cms-kicker">Static content CMS</p>
            <h1>Manage loc.digital content from one desk.</h1>
          </div>
          <a className="cms-link-button" href="/" target="_blank" rel="noreferrer">
            <Eye size={16} />
            View site
          </a>
        </div>

        <div className="cms-metrics">
          {metrics.map((metric) => (
            <div className="cms-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>

        <div className="cms-overview-grid">
          <div className="cms-panel">
            <div className="cms-panel-head">
              <h2>Content map</h2>
              <span>From build summary</span>
            </div>
            <ul className="cms-path-list">
              <li>
                <FileText size={16} />
                <span>Writing posts save to src/content/writing/*.md</span>
              </li>
              <li>
                <Package size={16} />
                <span>Gear products save to src/content/gear/setup.json</span>
              </li>
              <li>
                <Briefcase size={16} />
                <span>Work projects save to src/content/projects/*.json</span>
              </li>
              <li>
                <Camera size={16} />
                <span>Photo locations save to src/content/photos/*.json</span>
              </li>
            </ul>
          </div>

          <div className="cms-panel">
            <div className="cms-panel-head">
              <h2>Recent writing</h2>
              <span>{recentWriting.length} entries</span>
            </div>
            <div className="cms-mini-list">
              {recentWriting.length > 0 ? (
                recentWriting.map((post) => (
                  <button key={post.slug} type="button" onClick={() => { setActiveTab("writing"); setWritingDraft(post); }}>
                    <span>{post.headline}</span>
                    <small>{post.publishedAt}</small>
                  </button>
                ))
              ) : (
                <p>No posts yet.</p>
              )}
            </div>
          </div>

          <div className="cms-panel">
            <div className="cms-panel-head">
              <h2>Photo locations</h2>
              <span>{recentPhotos.length} shown</span>
            </div>
            <div className="cms-mini-list">
              {recentPhotos.length > 0 ? (
                recentPhotos.map((location) => (
                  <button key={location.slug} type="button" onClick={() => { setActiveTab("photos"); setPhotoDraft(location); }}>
                    <span>{location.location}</span>
                    <small>{location.images.length} photos</small>
                  </button>
                ))
              ) : (
                <p>No locations yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderWriting() {
    return (
      <section className="cms-editor-grid">
        <aside className="cms-list-panel">
          <div className="cms-panel-head">
            <h2>Writing</h2>
            <SmallButton icon={<Plus size={15} />} tone="secondary" onClick={() => setWritingDraft(emptyWriting())}>
              New
            </SmallButton>
          </div>

          <div className="cms-list">
            {(data?.writing ?? []).map((post) => (
              <button
                className={post.slug === writingDraft.slug ? "is-active" : ""}
                key={post.slug}
                type="button"
                onClick={() => setWritingDraft(post)}
              >
                <span>{post.headline}</span>
                <small>{post.draft ? "Draft" : post.publishedAt}</small>
              </button>
            ))}
          </div>
        </aside>

        <form
          className="cms-editor"
          onSubmit={(event) => {
            event.preventDefault();
            saveResource("writing", writingDraft, "Writing post saved.");
          }}
        >
          <div className="cms-editor-head">
            <div>
              <p className="cms-kicker">Markdown entry</p>
              <h2>{writingDraft.slug ? writingDraft.headline || writingDraft.slug : "New writing post"}</h2>
            </div>
            <div className="cms-actions">
              <SmallButton icon={<Save size={16} />} type="submit" disabled={saving}>
                Save
              </SmallButton>
              <SmallButton
                icon={<Trash2 size={16} />}
                tone="danger"
                disabled={!writingDraft.slug || saving}
                onClick={() => deleteResource("writing", writingDraft.slug, "Writing post deleted.")}
              >
                Delete
              </SmallButton>
            </div>
          </div>

          <div className="cms-form-grid">
            <Field label="Slug" value={writingDraft.slug} onChange={(value) => setWritingDraft({ ...writingDraft, slug: value })} />
            <Field label="Published" type="date" value={writingDraft.publishedAt} onChange={(value) => setWritingDraft({ ...writingDraft, publishedAt: value })} />
            <Field label="Title" required value={writingDraft.title} onChange={(value) => setWritingDraft({ ...writingDraft, title: value })} />
            <Field label="Headline" required value={writingDraft.headline} onChange={(value) => setWritingDraft({ ...writingDraft, headline: value })} />
            <Field label="Tags" value={listToString(writingDraft.tags)} onChange={(value) => setWritingDraft({ ...writingDraft, tags: splitList(value) })} />
            <Field label="Cover image" value={writingDraft.coverImage} onChange={(value) => setWritingDraft({ ...writingDraft, coverImage: value })} />
            <TextArea label="Summary" value={writingDraft.summary} rows={3} onChange={(value) => setWritingDraft({ ...writingDraft, summary: value })} />
            <TextArea label="Meta description" value={writingDraft.metaDescription} rows={3} onChange={(value) => setWritingDraft({ ...writingDraft, metaDescription: value })} />
            <TextArea label="Body markdown" value={writingDraft.body} rows={16} onChange={(value) => setWritingDraft({ ...writingDraft, body: value })} />
          </div>

          <Toggle label="Keep as draft" checked={writingDraft.draft} onChange={(checked) => setWritingDraft({ ...writingDraft, draft: checked })} />
        </form>
      </section>
    );
  }

  function renderGear() {
    return (
      <section className="cms-editor-grid">
        <aside className="cms-list-panel">
          <div className="cms-panel-head">
            <h2>Gear</h2>
            <SmallButton icon={<Plus size={15} />} tone="secondary" onClick={addGearSection}>
              Section
            </SmallButton>
          </div>

          <div className="cms-list">
            {gearDraft.sections.map((section, index) => (
              <button
                className={index === gearSectionIndex ? "is-active" : ""}
                key={section.slug || `${section.title}-${index}`}
                type="button"
                onClick={() => { setGearSectionIndex(index); setGearItemIndex(0); }}
              >
                <span>{section.title}</span>
                <small>{section.items.length} items</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="cms-editor">
          <div className="cms-editor-head">
            <div>
              <p className="cms-kicker">Gear setup JSON</p>
              <h2>{gearDraft.title}</h2>
            </div>
            <div className="cms-actions">
              <SmallButton icon={<Save size={16} />} disabled={saving} onClick={() => saveResource("gear", gearDraft, "Gear saved.")}>
                Save all
              </SmallButton>
            </div>
          </div>

          <div className="cms-form-grid">
            <Field label="Page title" value={gearDraft.title} onChange={(value) => setGearDraft({ ...gearDraft, title: value })} />
            <Field label="Headline HTML" value={gearDraft.headline} onChange={(value) => setGearDraft({ ...gearDraft, headline: value })} />
            <TextArea label="Description" value={gearDraft.description} rows={3} onChange={(value) => setGearDraft({ ...gearDraft, description: value })} />
          </div>

          {selectedGearSection ? (
            <>
              <div className="cms-subhead">
                <h3>Section</h3>
                <SmallButton icon={<Trash2 size={15} />} tone="danger" onClick={removeGearSection}>
                  Remove section
                </SmallButton>
              </div>

              <div className="cms-form-grid">
                <Field label="Section title" value={selectedGearSection.title} onChange={(value) => updateGearSection("title", value)} />
                <Field label="Section slug" value={selectedGearSection.slug} onChange={(value) => updateGearSection("slug", value)} />
                <Field label="Section headline" value={selectedGearSection.headline} onChange={(value) => updateGearSection("headline", value)} />
                <Field label="Section image" value={selectedGearSection.image} onChange={(value) => updateGearSection("image", value)} />
                <TextArea label="Section description" value={selectedGearSection.description} rows={3} onChange={(value) => updateGearSection("description", value)} />
              </div>

              <div className="cms-item-toolbar">
                <select value={gearItemIndex} onChange={(event) => setGearItemIndex(Number(event.target.value))}>
                  {selectedGearSection.items.map((item, index) => (
                    <option value={index} key={item.slug || `${item.name}-${index}`}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <SmallButton icon={<Plus size={15} />} tone="secondary" onClick={addGearItem}>
                  Item
                </SmallButton>
              </div>

              {selectedGearItem ? (
                <>
                  <div className="cms-form-grid">
                    <Field label="Name" value={selectedGearItem.name} onChange={(value) => updateGearItem("name", value)} />
                    <Field label="Slug" value={selectedGearItem.slug} onChange={(value) => updateGearItem("slug", value)} />
                    <Field label="Headline" value={selectedGearItem.headline} onChange={(value) => updateGearItem("headline", value)} />
                    <Field label="Tag" value={selectedGearItem.tag} onChange={(value) => updateGearItem("tag", value)} />
                    <Field label="URL" value={selectedGearItem.url} onChange={(value) => updateGearItem("url", value)} />
                    <Field label="Image path" value={selectedGearItem.image} onChange={(value) => updateGearItem("image", value)} />
                    <TextArea label="Description" value={selectedGearItem.description} rows={4} onChange={(value) => updateGearItem("description", value)} />
                  </div>

                  <div className="cms-upload-row">
                    <input
                      ref={gearUploadRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => uploadFiles("gear", event.target.files)}
                    />
                    <SmallButton icon={<Upload size={15} />} tone="secondary" onClick={() => gearUploadRef.current?.click()}>
                      Upload product image
                    </SmallButton>
                    <SmallButton icon={<Trash2 size={15} />} tone="danger" onClick={removeGearItem}>
                      Remove item
                    </SmallButton>
                  </div>
                </>
              ) : (
                <p className="cms-empty">No item in this section yet.</p>
              )}
            </>
          ) : (
            <p className="cms-empty">Create a section to start adding gear.</p>
          )}
        </div>
      </section>
    );
  }

  function renderWork() {
    return (
      <section className="cms-editor-grid">
        <aside className="cms-list-panel">
          <div className="cms-panel-head">
            <h2>Work</h2>
            <SmallButton icon={<Plus size={15} />} tone="secondary" onClick={() => setProjectDraft(emptyProject((data?.projects.length ?? 0) + 1))}>
              New
            </SmallButton>
          </div>

          <div className="cms-list">
            {(data?.projects ?? []).map((project) => (
              <button
                className={project.slug === projectDraft.slug ? "is-active" : ""}
                key={project.slug}
                type="button"
                onClick={() => setProjectDraft(project)}
              >
                <span>{project.title}</span>
                <small>{project.number} / {project.year}</small>
              </button>
            ))}
          </div>
        </aside>

        <form
          className="cms-editor"
          onSubmit={(event) => {
            event.preventDefault();
            saveResource("projects", projectDraft, "Work project saved.");
          }}
        >
          <div className="cms-editor-head">
            <div>
              <p className="cms-kicker">Project JSON</p>
              <h2>{projectDraft.title || "New work project"}</h2>
            </div>
            <div className="cms-actions">
              <SmallButton icon={<Save size={16} />} type="submit" disabled={saving}>
                Save
              </SmallButton>
              <SmallButton
                icon={<Trash2 size={16} />}
                tone="danger"
                disabled={!projectDraft.slug || saving}
                onClick={() => deleteResource("projects", projectDraft.slug, "Work project deleted.")}
              >
                Delete
              </SmallButton>
            </div>
          </div>

          <div className="cms-form-grid">
            <Field label="Order" type="number" value={projectDraft.order} onChange={(value) => setProjectDraft({ ...projectDraft, order: Number(value) })} />
            <Field label="Number" value={projectDraft.number} onChange={(value) => setProjectDraft({ ...projectDraft, number: value })} />
            <Field label="Slug" value={projectDraft.slug} onChange={(value) => setProjectDraft({ ...projectDraft, slug: value })} />
            <Field label="Title" required value={projectDraft.title} onChange={(value) => setProjectDraft({ ...projectDraft, title: value })} />
            <Field label="Client" value={projectDraft.client} onChange={(value) => setProjectDraft({ ...projectDraft, client: value })} />
            <Field label="Year" value={projectDraft.year} onChange={(value) => setProjectDraft({ ...projectDraft, year: value })} />
            <Field label="Role" value={projectDraft.role} onChange={(value) => setProjectDraft({ ...projectDraft, role: value })} />
            <Field label="Cover image" value={projectDraft.coverImage} onChange={(value) => setProjectDraft({ ...projectDraft, coverImage: value })} />
            <Field label="Live link" value={projectDraft.link} onChange={(value) => setProjectDraft({ ...projectDraft, link: value })} />
            <Field label="Link label" value={projectDraft.linkLabel} onChange={(value) => setProjectDraft({ ...projectDraft, linkLabel: value })} />
            <Field label="Tools" value={listToString(projectDraft.tools)} onChange={(value) => setProjectDraft({ ...projectDraft, tools: splitList(value) })} />
            <Field label="Skills" value={listToString(projectDraft.skills)} onChange={(value) => setProjectDraft({ ...projectDraft, skills: splitList(value) })} />
            <TextArea label="Summary" value={projectDraft.summary} rows={3} onChange={(value) => setProjectDraft({ ...projectDraft, summary: value })} />
            <TextArea label="Description" value={projectDraft.description} rows={9} onChange={(value) => setProjectDraft({ ...projectDraft, description: value })} />
          </div>
        </form>
      </section>
    );
  }

  function renderPhotos() {
    return (
      <section className="cms-editor-grid">
        <aside className="cms-list-panel">
          <div className="cms-panel-head">
            <h2>Photos</h2>
            <SmallButton icon={<Plus size={15} />} tone="secondary" onClick={() => setPhotoDraft(emptyPhotoLocation((data?.photos.length ?? 0) + 1))}>
              Location
            </SmallButton>
          </div>

          <div className="cms-list">
            {(data?.photos ?? []).map((location) => (
              <button
                className={location.slug === photoDraft.slug ? "is-active" : ""}
                key={location.slug}
                type="button"
                onClick={() => setPhotoDraft(location)}
              >
                <span>{location.location}</span>
                <small>{location.images.length} photos</small>
              </button>
            ))}
          </div>
        </aside>

        <form
          className="cms-editor"
          onSubmit={(event) => {
            event.preventDefault();
            saveResource("photos", photoDraft, "Photo location saved.");
          }}
        >
          <div className="cms-editor-head">
            <div>
              <p className="cms-kicker">Location JSON</p>
              <h2>{photoDraft.location || "New photo location"}</h2>
            </div>
            <div className="cms-actions">
              <SmallButton icon={<Save size={16} />} type="submit" disabled={saving}>
                Save
              </SmallButton>
              <SmallButton
                icon={<Trash2 size={16} />}
                tone="danger"
                disabled={!photoDraft.slug || saving}
                onClick={() => deleteResource("photos", photoDraft.slug, "Photo location deleted.")}
              >
                Delete
              </SmallButton>
            </div>
          </div>

          <div className="cms-form-grid">
            <Field label="Order" type="number" value={photoDraft.order} onChange={(value) => setPhotoDraft({ ...photoDraft, order: Number(value) })} />
            <Field label="Slug" value={photoDraft.slug} onChange={(value) => setPhotoDraft({ ...photoDraft, slug: value })} />
            <Field label="Location" required value={photoDraft.location} onChange={(value) => setPhotoDraft({ ...photoDraft, location: value })} />
            <Field label="Headline" value={photoDraft.headline} onChange={(value) => setPhotoDraft({ ...photoDraft, headline: value })} />
            <Field label="Subheadline" value={photoDraft.subheadline} onChange={(value) => setPhotoDraft({ ...photoDraft, subheadline: value })} />
            <TextArea label="Description" value={photoDraft.description} rows={3} onChange={(value) => setPhotoDraft({ ...photoDraft, description: value })} />
            <TextArea
              label="Images: src | alt | width | height"
              value={imagesToText(photoDraft.images)}
              rows={9}
              onChange={(value) => setPhotoDraft({ ...photoDraft, images: textToImages(value) })}
            />
          </div>

          <div className="cms-upload-row">
            <input
              ref={photoUploadRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => uploadFiles("photos", event.target.files, photoDraft.slug)}
            />
            <SmallButton
              icon={<Upload size={15} />}
              tone="secondary"
              disabled={!photoDraft.slug}
              onClick={() => photoUploadRef.current?.click()}
            >
              Upload to location
            </SmallButton>
            <span className="cms-upload-note">
              Saves files into src/assets/photos/{photoDraft.slug || "location-slug"}.
            </span>
          </div>

          {(photoDraft.images.length > 0 || uploadingImages.length > 0) && (
            <div className="cms-photo-grid">
              {photoDraft.images.map((photo) => {
                const displaySrc = photo.src.startsWith("/assets/photos/")
                  ? photo.src.replace("/assets/photos/", "/api/cms/assets/")
                  : photo.src;
                return (
                  <figure key={`${photo.src}-${photo.alt}`} onClick={() => setPreviewImage({ src: displaySrc, alt: photo.alt })}>
                    <img src={displaySrc} alt={photo.alt} className="cms-photo-thumb" />
                    <figcaption>{photo.alt || photo.src}</figcaption>
                  </figure>
                );
              })}
              {uploadingImages.map((img, index) => (
                <figure key={`uploading-${index}`} className="is-uploading" onClick={() => setPreviewImage({ src: img.url, alt: img.name })}>
                  <div className="cms-photo-loading-overlay">
                    <Loader2 className="cms-spin" size={20} />
                  </div>
                  <img src={img.url} alt={img.name} className="cms-photo-thumb" />
                  <figcaption>Uploading {img.name}...</figcaption>
                </figure>
              ))}
            </div>
          )}
        </form>
      </section>
    );
  }

  function renderActiveTab() {
    if (!data && status.type === "loading") {
      return (
        <div className="cms-loading">
          <Loader2 size={24} className="cms-spin" />
          <span>Loading CMS...</span>
        </div>
      );
    }

    if (activeTab === "writing") return renderWriting();
    if (activeTab === "gear") return renderGear();
    if (activeTab === "work") return renderWork();
    if (activeTab === "photos") return renderPhotos();
    return renderOverview();
  }

  return (
    <div className="cms-app">
      <aside className="cms-sidebar" aria-label="CMS sections">
        <a className="cms-logo" href="/" aria-label="Back to loc.digital">
          <span>Lộc Digital</span>
          <small>CMS</small>
        </a>

        <nav className="cms-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="cms-sidebar-foot">
          <span>Signed in as</span>
          <strong>admin</strong>
        </div>
      </aside>

      <main className="cms-main">
        <header className="cms-topbar">
          <div>
            <p>loc.digital/admin</p>
            <strong>{tabs.find((tab) => tab.id === activeTab)?.label}</strong>
          </div>
          <div className="cms-topbar-actions">
            <a href="/blog" target="_blank" rel="noreferrer">
              Writing
            </a>
            <a href="/gear" target="_blank" rel="noreferrer">
              Gear
            </a>
            <a href="/work" target="_blank" rel="noreferrer">
              Work
            </a>
            <a href="/photos" target="_blank" rel="noreferrer">
              Photos
            </a>
            <button type="button" onClick={logout} title="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {status.text && (
          <div className={`cms-status cms-status-${status.type}`} role="status" aria-live="polite">
            {status.type === "loading" ? <Loader2 size={16} className="cms-spin" /> : null}
            {status.type === "success" ? <CheckCircle2 size={16} /> : null}
            {status.type === "error" ? <AlertCircle size={16} /> : null}
            <span>{status.text}</span>
          </div>
        )}

        {renderActiveTab()}
      </main>

      {previewImage && (
        <div className="cms-modal-overlay" onClick={() => setPreviewImage(null)}>
          <button type="button" className="cms-modal-close" onClick={() => setPreviewImage(null)}>✕</button>
          <div className="cms-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.src} alt={previewImage.alt} />
          </div>
        </div>
      )}
    </div>
  );
}
