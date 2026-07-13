import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  HardDrive,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  MapPin,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Package,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import WritingDashboard from "../writing/WritingDashboard";
import WritingEditorPage from "../writing/WritingEditorPage";
import DeleteConfirmDialog from "../ui/DeleteConfirmDialog";
import type { Post } from "../../lib/writing/posts";
import "../../styles/writing-editor.css";

/* ------ Types ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
type Tab = "overview" | "writing" | "gear" | "work" | "photos";

const cmsTabPaths: Record<Tab, string> = {
  overview: "/cms",
  writing: "/cms/writing",
  gear: "/cms/gear",
  work: "/cms/work",
  photos: "/cms/photos",
};

function tabFromCmsPath(pathname: string): Tab {
  const section = pathname.replace(/\/+$/, "").split("/").filter(Boolean)[1] ?? "";
  if (section === "writing" || section === "writting") return "writing";
  if (section === "gear") return "gear";
  if (section === "work") return "work";
  if (section === "photos") return "photos";
  return "overview";
}

function initialCmsTab(): Tab {
  if (typeof window === "undefined") return "overview";
  return tabFromCmsPath(window.location.pathname);
}

type Status = {
  type: "idle" | "loading" | "success" | "error";
  text: string;
};

type WritingPost = {
  id?: string;
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
  id?: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  order?: number;
  isCover?: boolean;
};

type LocationType = "hotel" | "restaurant" | "cafe" | "check-in";

type LocationBlock = {
  id: string;
  type: string;
  enabled: boolean;
  title: string;
  content: string;
};

type RelatedLocation = {
  slug: string;
  distance: string;
  category: string;
};

type RelatedArticle = {
  slug: string;
  title: string;
};

type PhotoLocation = {
  slug: string;
  order: number;
  type: LocationType;
  location: string;
  name: string;
  city: string;
  district: string;
  country: string;
  province: string;
  region: string;
  headline: string;
  subheadline: string;
  introduction: string;
  shortDescription: string;
  description: string;
  longDescription: string;
  travelFrom: string;
  travelTime: string;
  recommendedStay: string;
  bestMonths: string;
  budgetMin: number | "";
  budgetMax: number | "";
  budgetNote: string;
  transportation: string[];
  suitableFor: string[];
  overview: string;
  favoriteThings: string;
  whatIWouldDoAgain: string;
  editorialReview: string;
  personalRating: number | "";
  wouldReturn: "" | "definitely" | "maybe" | "unsure" | "no";
  scores: {
    scenery: number | "";
    food: number | "";
    cafe: number | "";
    relaxation: number | "";
    value: number | "";
    accessibility: number | "";
  };
  bestTimeOfDay: string[];
  localTransport: string[];
  weatherNote: string;
  crowdLevel: "" | "quiet" | "moderate" | "busy_weekends" | "very_busy";
  travelDifficulty: "" | "very_easy" | "easy" | "moderate" | "requires_preparation";
  travelTips: string[];
  notFor: string[];
  heroImage?: PhotoImage;
  images: PhotoImage[];
  googleMapsUrl: string;
  latitude: string;
  longitude: string;
  openingHours: string;
  priceRange: string;
  website: string;
  phone: string;
  bookingUrl: string;
  instagram: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  seoImage: string;
  relatedLocations: RelatedLocation[];
  relatedArticles: RelatedArticle[];
  amenities: string[];
  roomTypes: string[];
  checkInTime: string;
  checkOutTime: string;
  breakfastIncluded: boolean;
  parking: boolean;
  petFriendly: boolean;
  pricePerNight: string;
  bookingLinks: string[];
  cuisine: string;
  menuImages: PhotoImage[];
  mustTryDishes: string[];
  averagePrice: string;
  reservationRequired: boolean;
  delivery: boolean;
  outdoorSeating: boolean;
  coffeeType: string;
  workingFriendly: boolean;
  powerOutlets: boolean;
  wifi: boolean;
  viewRating: string;
  indoor: boolean;
  outdoor: boolean;
  openingStyle: string;
  entranceFee: string;
  bestTime: string;
  sunrise: boolean;
  sunset: boolean;
  walkingTime: string;
  difficulty: string;
  droneAllowed: boolean;
  thingsToKnow: string;
  blocks: LocationBlock[];
};

type CmsCollectionEntry = {
  slug: string;
  order: number;
  name: string;
  description: string;
};

type CmsCollections = {
  categories: CmsCollectionEntry[];
  amenities: CmsCollectionEntry[];
  cities: CmsCollectionEntry[];
  districts: CmsCollectionEntry[];
  tags: CmsCollectionEntry[];
  articles: CmsCollectionEntry[];
};

type CmsData = {
  writing: WritingPost[];
  gear: Gear;
  projects: Project[];
  photos: PhotoLocation[];
  collections: CmsCollections;
};

/* ------ Nav structure ------------------------------------------------------------------------------------------------------------------------------------------------ */
type NavGroup = {
  label: string;
  items: Array<{ id: Tab; label: string; icon: LucideIcon }>;
};

const navGroups: NavGroup[] = [
  {
    label: "MAIN",
    items: [{ id: "overview", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "CONTENT",
    items: [
      { id: "writing", label: "Writing", icon: FileText },
      { id: "gear",    label: "Gear",    icon: Package },
    ],
  },
  {
    label: "MEDIA",
    items: [
      { id: "work",   label: "Work",   icon: Briefcase },
      { id: "photos", label: "Photos", icon: Camera },
    ],
  },
];

/* ------ Stat card data --------------------------------------------------------------------------------------------------------------------------------------------- */
type StatDef = {
  title: string;
  icon: LucideIcon;
  accent: "blue" | "green" | "amber" | "purple";
  footer: string[];
  tab: Tab;
};

const statDefs: StatDef[] = [
  {
    title: "Writing Posts",
    icon: FileText,
    accent: "blue",
    footer: ["Published", "Draft", "Scheduled"],
    tab: "writing",
  },
  {
    title: "Gear Items",
    icon: Package,
    accent: "green",
    footer: ["Across sections"],
    tab: "gear",
  },
  {
    title: "What I Do",
    icon: Briefcase,
    accent: "amber",
    footer: ["Client work"],
    tab: "work",
  },
  {
    title: "Photo Locations",
    icon: Camera,
    accent: "purple",
    footer: ["With images"],
    tab: "photos",
  },
];

/* ------ Activity feed (static) --------------------------------------------------------------------------------------------------------------------- */
const activities = [
  { icon: CheckCircle2, text: "CMS data loaded successfully",  time: "just now"    },
  { icon: UserPlus,     text: "New writing post ready to edit", time: "moments ago" },
  { icon: MessageSquare,text: "Gear sections updated",          time: "earlier"     },
  { icon: Send,         text: "Photos synced to build",         time: "last session"},
];

function uniqueList(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function splitList(value: string) {
  return uniqueList(value.split(/[,;\n]+/).map((s) => s.trim()));
}

function listToString(value: string[] = []) {
  return value.join(", ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function emptyGear(): Gear {
  return { title: "My Gear", headline: "Tools I actually use.", description: "", sections: [] };
}

function emptyGearSection(): GearSection {
  return { title: "New Section", slug: "", headline: "", description: "", image: "", items: [] };
}

function emptyGearItem(): GearItem {
  return { name: "New Gear Item", slug: "", headline: "", description: "", image: "", tag: "" };
}

function newGearItem(section?: GearSection): GearItem {
  const itemNumber = (section?.items.length ?? 0) + 1;
  const sectionPrefix = slugify(section?.slug || section?.title || "gear");
  return {
    ...emptyGearItem(),
    name: `New Product ${itemNumber}`,
    slug: `${sectionPrefix}-product-${itemNumber}`,
    headline: "Product headline",
    tag: "Gear",
  };
}

function emptyProject(order = 99): Project {
  return {
    slug: "", order, number: String(order).padStart(2, "0"),
    title: "", client: "", year: "", role: "", summary: "", description: "",
    tools: [], skills: [], coverImage: "", images: [], link: "", linkLabel: "", caseStudyLink: "",
  };
}

const suitableForOptions = [
  "Solo",
  "Couple",
  "Bạn bè",
  "Gia đình",
  "Người lớn tuổi",
  "Photographer",
  "Food lover",
  "Coffee lover",
  "Nghỉ dưỡng",
  "Trekking",
];
const bestTimeOfDayOptions = ["Sáng sớm", "Chiều muộn", "Hoàng hôn", "Cả ngày"];
const locationTypeValues: LocationType[] = ["hotel", "restaurant", "cafe", "check-in"];

const defaultLocationBlocks: LocationBlock[] = [
  "Hero",
  "Gallery",
  "Editorial Review",
  "Quick Facts",
  "Tips",
  "Pros & Cons",
  "Map",
  "Nearby Places",
  "Related Articles",
  "FAQ",
  "CTA",
].map((title) => ({ id: slugify(title), type: slugify(title), enabled: true, title, content: "" }));

const emptyCollections = (): CmsCollections => ({
  categories: [],
  amenities: [],
  cities: [],
  districts: [],
  tags: [],
  articles: [],
});

function emptyPhotoLocation(order = 99): PhotoLocation {
  return {
    slug: "",
    order,
    type: "check-in",
    location: "",
    name: "",
    city: "",
    district: "",
    country: "Vietnam",
    province: "",
    region: "",
    headline: "",
    subheadline: "",
    introduction: "",
    shortDescription: "",
    description: "",
    longDescription: "",
    travelFrom: "",
    travelTime: "",
    recommendedStay: "",
    bestMonths: "",
    budgetMin: "",
    budgetMax: "",
    budgetNote: "",
    transportation: [],
    suitableFor: [],
    overview: "",
    favoriteThings: "",
    whatIWouldDoAgain: "",
    editorialReview: "",
    personalRating: "",
    wouldReturn: "",
    scores: {
      scenery: "",
      food: "",
      cafe: "",
      relaxation: "",
      value: "",
      accessibility: "",
    },
    bestTimeOfDay: [],
    localTransport: [],
    weatherNote: "",
    crowdLevel: "",
    travelDifficulty: "",
    travelTips: [],
    notFor: [],
    heroImage: undefined,
    images: [],
    googleMapsUrl: "",
    latitude: "",
    longitude: "",
    openingHours: "",
    priceRange: "",
    website: "",
    phone: "",
    bookingUrl: "",
    instagram: "",
    tags: [],
    featured: false,
    published: true,
    seoTitle: "",
    seoDescription: "",
    seoImage: "",
    relatedLocations: [],
    relatedArticles: [],
    amenities: [],
    roomTypes: [],
    checkInTime: "",
    checkOutTime: "",
    breakfastIncluded: false,
    parking: false,
    petFriendly: false,
    pricePerNight: "",
    bookingLinks: [],
    cuisine: "",
    menuImages: [],
    mustTryDishes: [],
    averagePrice: "",
    reservationRequired: false,
    delivery: false,
    outdoorSeating: false,
    coffeeType: "",
    workingFriendly: false,
    powerOutlets: false,
    wifi: false,
    viewRating: "",
    indoor: false,
    outdoor: false,
    openingStyle: "",
    entranceFee: "",
    bestTime: "",
    sunrise: false,
    sunset: false,
    walkingTime: "",
    difficulty: "",
    droneAllowed: false,
    thingsToKnow: "",
    blocks: defaultLocationBlocks.map((block) => ({ ...block })),
  };
}

function normalizePhotoDraft(input: Partial<PhotoLocation>, order = 99): PhotoLocation {
  const empty = emptyPhotoLocation(order);
  const blocks = Array.isArray(input.blocks) && input.blocks.length > 0
    ? input.blocks.map((block, index) => ({
        id: block.id || `${block.type || slugify(block.title || "block")}-${index + 1}`,
        type: block.type || slugify(block.title || "block"),
        enabled: block.enabled ?? true,
        title: block.title || block.type || `Block ${index + 1}`,
        content: block.content || "",
      }))
    : [];

  for (const block of defaultLocationBlocks) {
    if (!blocks.some((item) => item.type === block.type)) blocks.push({ ...block });
  }

  return {
    ...empty,
    ...input,
    type: locationTypeValues.includes(input.type as LocationType) ? input.type as LocationType : empty.type,
    name: input.name ?? input.location ?? "",
    province: input.province ?? input.city ?? "",
    introduction: input.introduction ?? input.shortDescription ?? input.description ?? "",
    shortDescription: input.shortDescription ?? input.description ?? "",
    description: input.description ?? input.shortDescription ?? "",
    longDescription: input.longDescription ?? input.description ?? "",
    images: Array.isArray(input.images)
      ? input.images.map((image, index) => ({ ...image, order: image.order ?? index + 1 }))
      : [],
    tags: Array.isArray(input.tags) ? input.tags : [],
    transportation: Array.isArray(input.transportation) ? input.transportation : [],
    suitableFor: Array.isArray(input.suitableFor) ? input.suitableFor : [],
    scores: { ...empty.scores, ...(input.scores ?? {}) },
    bestTimeOfDay: Array.isArray(input.bestTimeOfDay) ? input.bestTimeOfDay : [],
    localTransport: Array.isArray(input.localTransport) ? input.localTransport : [],
    travelTips: Array.isArray(input.travelTips) ? input.travelTips : [],
    notFor: Array.isArray(input.notFor) ? input.notFor : [],
    relatedLocations: Array.isArray(input.relatedLocations) ? input.relatedLocations : [],
    relatedArticles: Array.isArray(input.relatedArticles) ? input.relatedArticles : [],
    amenities: Array.isArray(input.amenities) ? input.amenities : [],
    roomTypes: Array.isArray(input.roomTypes) ? input.roomTypes : [],
    bookingLinks: Array.isArray(input.bookingLinks) ? input.bookingLinks : [],
    menuImages: Array.isArray(input.menuImages) ? input.menuImages : [],
    mustTryDishes: Array.isArray(input.mustTryDishes) ? input.mustTryDishes : [],
    blocks,
  };
}

function normalizeData(data: Partial<CmsData>): CmsData {
  const photos = Array.isArray(data.photos) ? data.photos : [];
  return {
    writing:  Array.isArray(data.writing)  ? data.writing  : [],
    gear:     data.gear?.sections          ? data.gear      : emptyGear(),
    projects: Array.isArray(data.projects) ? data.projects  : [],
    photos:   photos.map((photo, index) => normalizePhotoDraft(photo, index + 1)),
    collections: {
      ...emptyCollections(),
      ...(data.collections ?? {}),
    },
  };
}

/* ------ Primitive UI components --------------------------------------------------------------------------------------------------------------------- */
function Field(props: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`cms-field ${props.className ?? ""}`}>
      <span>{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        required={props.required}
        min={props.min}
        max={props.max}
        step={props.step}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`cms-field cms-field-full ${props.className ?? ""}`}>
      <span>{props.label}</span>
      <textarea
        value={props.value}
        rows={props.rows ?? 5}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`cms-field ${props.className ?? ""}`}>
      <span>{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectField(props: {
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function addValue(value: string) {
    const clean = value.trim();
    if (!clean) return;
    props.onChange(uniqueList([...props.value, clean]));
    setDraft("");
  }

  function removeValue(value: string) {
    props.onChange(props.value.filter((item) => item !== value));
  }

  return (
    <label className="cms-field cms-chip-field">
      <span>{props.label}</span>
      <div className="cms-chip-input-wrap">
        {props.value.map((item) => (
          <button key={item} type="button" className="cms-chip" onClick={() => removeValue(item)}>
            <span>{item}</span>
            <Trash2 size={12} />
          </button>
        ))}
        <input
          list={`${props.label.replace(/\s+/g, "-").toLowerCase()}-options`}
          value={draft}
          placeholder={props.placeholder ?? "Add item"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addValue(draft);
            }
          }}
          onBlur={() => addValue(draft)}
        />
        <datalist id={`${props.label.replace(/\s+/g, "-").toLowerCase()}-options`}>
          {props.options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </label>
  );
}

function RepeatableListField(props: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  function updateItem(index: number, value: string) {
    props.onChange(props.value.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addItem() {
    props.onChange([...props.value, ""]);
  }

  function removeItem(index: number) {
    props.onChange(props.value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="cms-field cms-field-full">
      <span>{props.label}</span>
      <div className="cms-repeat-list">
        {props.value.map((item, index) => (
          <div className="cms-repeat-row" key={`${props.label}-${index}`}>
            <input
              type="text"
              value={item}
              placeholder={props.placeholder ?? "Add item"}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <SmallButton tone="danger" icon={<Trash2 size={13} />} onClick={() => removeItem(index)}>Remove</SmallButton>
          </div>
        ))}
        {props.value.length === 0 && <p className="cms-empty">No items yet.</p>}
      </div>
      <SmallButton icon={<Plus size={14} />} tone="secondary" onClick={addItem}>
        Add item
      </SmallButton>
    </div>
  );
}

function CollapsibleSection(props: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);

  return (
    <section className="cms-collapse">
      <button
        type="button"
        className="cms-collapse-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span>{props.title}</span>
        <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div className="cms-collapse-body">
          {props.action && <div className="cms-collapse-action">{props.action}</div>}
          {props.children}
        </div>
      )}
    </section>
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

function SmallLinkButton(props: {
  children: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  tone?: "primary" | "secondary" | "danger" | "ghost";
  title?: string;
}) {
  if (!props.href) {
    return (
      <button
        className={`cms-button cms-button-${props.tone ?? "secondary"}`}
        type="button"
        disabled
        title={props.title}
      >
        {props.icon}
        <span>{props.children}</span>
      </button>
    );
  }

  return (
    <a
      className={`cms-link-button cms-button-${props.tone ?? "secondary"}`}
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      title={props.title}
    >
      {props.icon}
      <span>{props.children}</span>
    </a>
  );
}

/* ------ Sidebar --------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function Sidebar({
  activeTab,
  onTabChange,
  onLogout,
  setStatus,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
  setStatus: (status: Status) => void;
}) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setWorkspaceOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <aside className="cms-sidebar" aria-label="CMS navigation">
      {/* Workspace block */}
      <div className="cms-relative-wrapper" ref={wsRef} style={{ width: "100%", marginBottom: 20 }}>
        <div
          className="cms-workspace"
          role="button"
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          aria-label="Workspace"
        >
          <div className="cms-workspace-inner">
            <div className="cms-workspace-avatar"></div>
            <div className="cms-workspace-info">
              <span className="cms-workspace-name">Lộc Digital</span>
              <span className="cms-workspace-sub">CMS Admin</span>
            </div>
          </div>
          <ChevronDown
            size={15}
            className="cms-workspace-chevron"
            style={{
              transform: workspaceOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>

        {workspaceOpen && (
          <div className="cms-dropdown-menu" style={{ width: "100%", top: "100%", marginTop: -15, zIndex: 60 }}>
            <div className="cms-dropdown-header">Workspaces</div>
            <button
              type="button"
              className="cms-dropdown-item is-active"
              onClick={() => setWorkspaceOpen(false)}
            >
              Lộc Digital (Primary)
            </button>
            <button
              type="button"
              className="cms-dropdown-item"
              onClick={() => {
                setStatus({ type: "success", text: "Workspace settings are under development." });
                setWorkspaceOpen(false);
              }}
            >
              Workspace Settings
            </button>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="cms-nav-groups" aria-label="Content sections">
        {navGroups.map((group) => (
          <div key={group.label} className="cms-nav-group">
            <p className="cms-nav-kicker">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`cms-nav-btn${activeTab === item.id ? " is-active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                  aria-current={activeTab === item.id ? "page" : undefined}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Storage card */}
      <div className="cms-sidebar-storage" aria-label="Storage usage">
        <div className="cms-storage-head">
          <span className="cms-storage-label">
            <HardDrive size={14} />
            Storage
          </span>
          <span className="cms-storage-pct">80%</span>
        </div>
        <div className="cms-storage-bar">
          <div className="cms-storage-fill" style={{ width: "80%" }} />
        </div>
        <div className="cms-storage-meta">8.0 GB of 10 GB used</div>
        <button type="button" className="cms-storage-upgrade">Upgrade Plan</button>
      </div>

      {/* User row */}
      <div className="cms-sidebar-user">
        <div className="cms-sidebar-user-avatar">A</div>
        <div className="cms-sidebar-user-info">
          <div className="cms-sidebar-user-name">admin</div>
          <div className="cms-sidebar-user-role">Administrator</div>
        </div>
        <button
          type="button"
          className="cms-sidebar-logout"
          title="Log out"
          onClick={onLogout}
          aria-label="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

/* ------ Topbar --------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
function Topbar() {
  return (
    <header className="cms-topbar">
      <div className="cms-topbar-actions">
      </div>
    </header>
  );
}

/* ------ Stat card ------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function StatCard({ def, value, footerValues, onOpen }: {
  def: StatDef;
  value: string;
  footerValues: string[];
  onOpen: () => void;
}) {
  const Icon = def.icon;
  return (
    <button type="button" className="cms-stat-card" onClick={onOpen}>
      <div className="cms-stat-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className={`cms-stat-icon-wrap ${def.accent}`}>
            <Icon size={17} />
          </div>
          <span className="cms-stat-label">{def.title}</span>
        </div>
        <span className="cms-stat-growth">live</span>
      </div>

      <div>
        <div className="cms-stat-value">{value}</div>
        <div className="cms-stat-meta">Total count</div>
      </div>

      <div className="cms-stat-footer">
        {def.footer.map((label, i) => (
          <span key={label} className="cms-stat-detail">
            {label}: {footerValues[i] ?? "None"}
          </span>
        ))}
      </div>
    </button>
  );
}

function TrafficChart() {
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "year">("7days");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [startDate, setStartDate] = useState("2026-06-14");
  const [endDate, setEndDate] = useState("2026-06-21");

  const filterRef = useRef<HTMLDivElement>(null);
  const dateRangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target as Node)) {
        setDateRangeOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const formatDateLabel = (startStr: string, endStr: string) => {
    try {
      const opt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      const s = new Date(startStr);
      const e = new Date(endStr);
      return `${s.toLocaleDateString("en-US", opt)} - ${e.toLocaleDateString("en-US", opt)}`;
    } catch {
      return "Jun 14 - Jun 21";
    }
  };

  const viewsPath =
    timeRange === "7days"
      ? "M0,140 C60,110 120,130 200,100 C280,70 320,90 400,60 C480,30 520,120 600,110 C680,100 720,40 800,60 C840,70 870,80 900,75"
      : timeRange === "30days"
      ? "M0,100 C100,150 200,80 300,120 C400,90 500,40 600,80 C700,60 800,110 900,50"
      : "M0,60 C150,110 300,40 450,130 C600,80 750,120 900,40";

  const readsPath =
    timeRange === "7days"
      ? "M0,170 C80,165 140,175 220,160 C300,145 340,170 430,158 C510,148 550,172 640,162 C720,153 760,170 840,165 C865,163 882,162 900,165"
      : timeRange === "30days"
      ? "M0,150 C100,160 200,130 300,145 C400,130 500,120 600,140 C700,135 800,155 900,130"
      : "M0,120 C150,130 300,110 450,140 C600,125 750,135 900,115";

  return (
    <div className="cms-chart-card">
      <div className="cms-chart-header">
        <h2 className="cms-chart-title">Website Traffic</h2>
        <div className="cms-chart-filters" style={{ display: "flex", gap: 10 }}>
          <div className="cms-relative-wrapper" ref={filterRef}>
            <button
              type="button"
              className="cms-filter-btn"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              {timeRange === "7days" && "Last 7 Days"}
              {timeRange === "30days" && "Last 30 Days"}
              {timeRange === "year" && "Last Year"}
              <ChevronDown size={13} />
            </button>

            {filterOpen && (
              <div className="cms-dropdown-menu" style={{ left: 0, top: "100%", width: 140 }}>
                <button
                  type="button"
                  className={`cms-dropdown-item${timeRange === "7days" ? " is-active" : ""}`}
                  onClick={() => {
                    setTimeRange("7days");
                    setFilterOpen(false);
                  }}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  className={`cms-dropdown-item${timeRange === "30days" ? " is-active" : ""}`}
                  onClick={() => {
                    setTimeRange("30days");
                    setFilterOpen(false);
                  }}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  className={`cms-dropdown-item${timeRange === "year" ? " is-active" : ""}`}
                  onClick={() => {
                    setTimeRange("year");
                    setFilterOpen(false);
                  }}
                >
                  Last Year
                </button>
              </div>
            )}
          </div>

          <div className="cms-relative-wrapper" ref={dateRangeRef}>
            <button
              type="button"
              className="cms-filter-btn"
              onClick={() => setDateRangeOpen(!dateRangeOpen)}
            >
              <Calendar size={13} />
              {formatDateLabel(startDate, endDate)}
              <ChevronDown size={13} />
            </button>

            {dateRangeOpen && (
              <div className="cms-dropdown-menu" style={{ right: 0, top: "100%", width: 240, padding: 12 }}>
                <div className="cms-dropdown-header" style={{ padding: "0 0 8px 0" }}>Custom Range</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                    Start Date
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid var(--divider)",
                        fontSize: 12,
                      }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                    End Date
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid var(--divider)",
                        fontSize: 12,
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setDateRangeOpen(false)}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      backgroundColor: "var(--text)",
                      color: "var(--bg)",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      marginTop: 4,
                    }}
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cms-chart-svg" aria-label="Website traffic chart">
        <svg
          viewBox="0 0 900 200"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
          role="img"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cms-grad-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0075de" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0075de" stopOpacity="0"    />
            </linearGradient>
            <linearGradient id="cms-grad-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#16a34a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0"    />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[40, 80, 120, 160].map((y) => (
            <line key={y} x1="0" y1={y} x2="900" y2={y}
              stroke="#E8E8E2" strokeWidth="1" />
          ))}

          {/* Primary curve --- views */}
          <path
            d={`${viewsPath} L900,200 L0,200 Z`}
            fill="url(#cms-grad-blue)"
          />
          <path
            d={viewsPath}
            fill="none" stroke="#0075de" strokeWidth="2.5" strokeLinecap="round"
          />

          {/* Secondary curve --- writing */}
          <path
            d={`${readsPath} L900,200 L0,200 Z`}
            fill="url(#cms-grad-green)"
          />
          <path
            d={readsPath}
            fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="cms-chart-legend" aria-label="Chart legend">
        <div className="cms-legend-item">
          <div className="cms-legend-dot" style={{ background: "#0075de" }} />
          Page views
        </div>
        <div className="cms-legend-item">
          <div className="cms-legend-dot" style={{ background: "#16a34a" }} />
          Writing reads
        </div>
      </div>
    </div>
  );
}

/* ------ Recent posts table --------------------------------------------------------------------------------------------------------------------------------- */
function RecentPostsTable({ posts, onOpenPost, onOpenWriting }: {
  posts: WritingPost[];
  onOpenPost: (post: WritingPost) => void;
  onOpenWriting: () => void;
}) {
  const display = posts.slice(0, 5);

  function statusBadge(post: WritingPost) {
    if (post.draft)      return <span className="cms-badge cms-badge-draft">Draft</span>;
    if (!post.publishedAt) return <span className="cms-badge cms-badge-scheduled">Scheduled</span>;
    return <span className="cms-badge cms-badge-published">Published</span>;
  }

  return (
    <div className="cms-table-card">
      <div className="cms-table-head-bar">
        <div>
          <div className="cms-table-title">Recent Writing</div>
          <div className="cms-table-sub">Your latest content updates</div>
        </div>
        <button type="button" className="cms-table-more" aria-label="Open writing" onClick={onOpenWriting}>
          <MoreHorizontal size={16} />
        </button>
      </div>

      {display.length === 0 ? (
        <div style={{ padding: "24px 20px", color: "var(--muted)", fontSize: 13 }}>
          No posts yet. Create your first writing entry.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="cms-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Status</th>
                <th>Published</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {display.map((post) => (
                <tr
                  key={post.slug}
                  className="cms-table-row-action"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${post.headline || post.title || post.slug || "writing post"}`}
                  onClick={() => onOpenPost(post)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenPost(post);
                    }
                  }}
                >
                  <td>
                    <div className="cms-table-post-cell">
                      <div className="cms-table-post-icon" aria-hidden="true">
                        <FileText size={16} />
                      </div>
                      <span className="cms-table-post-title">
                        {post.headline || post.title || post.slug || "(Untitled)"}
                      </span>
                    </div>
                  </td>
                  <td>{statusBadge(post)}</td>
                  <td style={{ fontSize: 12, fontFamily: "var(--sans)", color: "var(--muted)" }}>
                    {post.publishedAt || "None"}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>
                    {post.tags.slice(0, 2).join(", ") || "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------ Categories panel --------------------------------------------------------------------------------------------------------------------------------------- */
function CategoriesPanel({ data }: { data: CmsData }) {
  const gearTotal = data.gear.sections.reduce((s, sec) => s + sec.items.length, 0);
  const total = data.writing.length + gearTotal + data.projects.length + data.photos.length;

  const categories = [
    { name: "Writing",   count: data.writing.length  },
    { name: "Gear",      count: gearTotal             },
    { name: "What I Do", count: data.projects.length  },
    { name: "Photos",    count: data.photos.length    },
  ];

  return (
    <div className="cms-panel">
      <h2 className="cms-panel-title">Content Breakdown</h2>
      <div className="cms-category-list">
        {categories.map((cat) => {
          const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
          return (
            <div key={cat.name} className="cms-category-row">
              <div className="cms-category-meta">
                <span className="cms-category-name">{cat.name}</span>
                <span className="cms-category-pct">{cat.count} items · {pct}%</span>
              </div>
              <div className="cms-category-bar">
                <div
                  className="cms-category-fill"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------ Activity panel --------------------------------------------------------------------------------------------------------------------------------------------- */
function ActivityPanel() {
  return (
    <div className="cms-panel">
      <h2 className="cms-panel-title">Recent Activity</h2>
      <div className="cms-activity-list">
        {activities.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.text} className="cms-activity-item">
              <div className="cms-activity-icon" aria-hidden="true">
                <Icon size={15} />
              </div>
              <div>
                <div className="cms-activity-text">{item.text}</div>
                <div className="cms-activity-time">
                  <Clock3 size={10} />
                  {item.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------ Dashboard / Overview ------------------------------------------------------------------------------------------------------------------------------ */
function Dashboard({ data, onOpenTab, onOpenPost, jsonPosts }: {
  data: CmsData;
  onOpenTab: (tab: Tab) => void;
  onOpenPost: (post: WritingPost) => void;
  jsonPosts: Post[];
}) {
  const gearTotal = data.gear.sections.reduce((s, sec) => s + sec.items.length, 0);

  // Use JSON posts if they exist, otherwise fallback to markdown posts (data.writing)
  const postsToUse = jsonPosts && jsonPosts.length > 0 ? jsonPosts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    headline: p.title,
    summary: p.excerpt || "",
    metaDescription: p.seoDescription || "",
    keyword: p.focusKeyword || "",
    tags: p.tags || [],
    coverImage: p.coverImage || "",
    publishedAt: p.publishedAt ? p.publishedAt.split('T')[0] : "",
    draft: p.status !== "published",
    body: p.contentMarkdown || "",
  })) : data.writing;

  const draftCount  = postsToUse.filter((p) => p.draft).length;
  const publishedCount = postsToUse.filter((p) => !p.draft).length;

  const statValues: [string, string[]][] = [
    [
      String(postsToUse.length),
      [String(publishedCount), String(draftCount), "0"],
    ],
    [String(gearTotal), [String(data.gear.sections.length)]],
    [String(data.projects.length), ["client"]],
    [
      String(data.photos.length),
      [String(data.photos.reduce((s, p) => s + p.images.length, 0))],
    ],
  ];

  return (
    <div className="cms-content">
      {/* Page header */}
      <div className="cms-page-header">
        <div>
          <h1 className="cms-page-title">Dashboard</h1>
          <p className="cms-page-subtitle">
            Here&apos;s what&apos;s happening with your content today.
          </p>
        </div>
        <SmallLinkButton href="/" icon={<ExternalLink size={14} />} tone="secondary">
          View site
        </SmallLinkButton>
      </div>

      {/* Stat cards */}
      <div className="cms-stat-grid">
        {statDefs.map((def, i) => (
          <StatCard
            key={def.title}
            def={def}
            value={statValues[i][0]}
            footerValues={statValues[i][1]}
            onOpen={() => onOpenTab(def.tab)}
          />
        ))}
      </div>

      {/* Chart + right col */}
      <div className="cms-dashboard-grid">
        <TrafficChart />
        <div className="cms-right-col">
          <CategoriesPanel data={data} />
          <ActivityPanel />
        </div>
      </div>

      {/* Recent posts table */}
      <RecentPostsTable
        posts={postsToUse}
        onOpenPost={onOpenPost}
        onOpenWriting={() => onOpenTab("writing")}
      />
    </div>
  );
}

/* ------ Props & main component --------------------------------------------------------------------------------------------------------------------- */
type CmsDashboardProps = {
  initialData?: unknown;
};

export default function CmsDashboard({ initialData }: CmsDashboardProps) {
  const [activeTab,          setActiveTab]          = useState<Tab>(initialCmsTab);
  const normalizedInitial                            = useMemo(
    () => (initialData ? normalizeData(initialData as Partial<CmsData>) : null),
    [initialData],
  );
  const [status, setStatus] = useState<Status>(
    normalizedInitial
      ? { type: "success", text: "CMS data ready." }
      : { type: "loading", text: "Loading CMS data--" },
  );
  const [data,              setData]              = useState<CmsData | null>(normalizedInitial);

  // Pathname state for client-side routing detection
  const [currentPathname, setCurrentPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : ""
  );

  // Route details client-side for CMS integration of BlockNote editor
  const routeInfo = useMemo(() => {
    const path = currentPathname;
    if (path === "/cms/writing/new") return { mode: "new" as const };
    const match = path.match(/^\/cms\/writing\/([^/]+)\/edit$/);
    if (match) return { mode: "edit" as const, id: match[1] };
    return { mode: "list" as const };
  }, [currentPathname]);

  const [jsonPosts, setJsonPosts] = useState<Post[]>([]);
  const [loadingJsonPosts, setLoadingJsonPosts] = useState(true);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync pathname on history changes (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPathname(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch block editor (JSON) posts for list view
  useEffect(() => {
    if (activeTab === "writing" && routeInfo.mode === "list") {
      setLoadingJsonPosts(true);
      fetch("/api/writing/posts")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setJsonPosts(res.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingJsonPosts(false);
        });
    }
  }, [activeTab, routeInfo.mode]);

  // Create draft post client-side if URL is /cms/writing/new
  useEffect(() => {
    if (routeInfo.mode === "new" && !createdId) {
      fetch("/api/writing/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", status: "draft" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCreatedId(data.data.id);
            window.location.replace(`/cms/writing/${data.data.id}/edit`);
          } else {
            alert("Failed to create post: " + (data.error || "Unknown error"));
            window.location.replace("/cms/writing");
          }
        })
        .catch((err) => {
          alert("Failed to create post: " + String(err));
          window.location.replace("/cms/writing");
        });
    }
  }, [routeInfo.mode, createdId]);

  // Load post details client-side if URL is /cms/writing/:id/edit
  useEffect(() => {
    if (routeInfo.mode === "edit" && routeInfo.id) {
      setLoadingPost(true);
      setLoadError(null);
      fetch(`/api/writing/posts/${routeInfo.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEditingPost(data.data);
          } else {
            setLoadError(data.error || "Failed to load post.");
          }
        })
        .catch((err) => {
          setLoadError(String(err));
        })
        .finally(() => {
          setLoadingPost(false);
        });
    } else {
      setEditingPost(null);
    }
  }, [routeInfo.mode, routeInfo.id]);
  const [projectDraft,      setProjectDraft]      = useState<Project>(
    normalizedInitial?.projects[0] ??
    emptyProject((normalizedInitial?.projects.length ?? 0) + 1),
  );
  const [photoDraft,        setPhotoDraft]        = useState<PhotoLocation>(
    normalizedInitial?.photos[0] ??
    emptyPhotoLocation((normalizedInitial?.photos.length ?? 0) + 1),
  );
  const [gearDraft,         setGearDraft]         = useState<Gear>(normalizedInitial?.gear ?? emptyGear());
  const [gearSectionIndex,  setGearSectionIndex]  = useState(0);
  const [gearItemIndex,     setGearItemIndex]     = useState(0);
  const [saving,            setSaving]            = useState(false);
  const [gearAiFilling,     setGearAiFilling]     = useState(false);
  const [uploadingImages,   setUploadingImages]   = useState<Array<{ url: string; name: string }>>([]);
  const [previewImage,      setPreviewImage]      = useState<{ src: string; alt: string } | null>(null);
  const [deleteDialogOpen,   setDeleteDialogOpen]   = useState(false);
  const [resourceToDelete,   setResourceToDelete]   = useState<{
    resource: string;
    slug: string;
    successText: string;
    title: string;
  } | null>(null);
  const gearUploadRef  = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);

  const selectedGearSection = gearDraft.sections[gearSectionIndex];
  const selectedGearItem    = selectedGearSection?.items[gearItemIndex];

  function navigateToTab(tab: Tab, options: { replace?: boolean } = {}) {
    setActiveTab(tab);
    if (typeof window === "undefined") return;

    const nextPath = cmsTabPaths[tab];
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = `${nextPath}${window.location.search}${window.location.hash}`;

    if (current === next) return;
    if (options.replace) {
      window.history.replaceState(null, "", next);
    } else {
      window.history.pushState(null, "", next);
    }
    setCurrentPathname(nextPath);
  }

  /* ------ Data loading --------------------------------------------------------------------------------------------------------------------------------------------- */
  async function loadData(options: { quiet?: boolean } = {}) {
    if (!options.quiet) setStatus({ type: "loading", text: "Loading CMS data--" });

    const response = await fetch("/api/cms");
    if (response.status === 401) { window.location.href = "/login"; return; }

    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.error || "Unable to load CMS data.");

    const nextData = normalizeData(result.data);
    setData(nextData);
    setGearDraft(nextData.gear);
    setProjectDraft(nextData.projects[0] ?? emptyProject(nextData.projects.length + 1));
    setPhotoDraft(nextData.photos[0] ?? emptyPhotoLocation(nextData.photos.length + 1));
    setGearSectionIndex(0);
    setGearItemIndex(0);

    if (!options.quiet) setStatus({ type: "success", text: "CMS data ready." });
  }

  useEffect(() => {
    if (normalizedInitial) return;
    loadData().catch((err) =>
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to load CMS data." }),
    );
  }, [normalizedInitial]);

  useEffect(() => {
    const onPopState = () => setActiveTab(tabFromCmsPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewImage(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------ Save / Delete / Upload --------------------------------------------------------------------------------------------------------------- */
  async function saveResource(resource: string, payload: unknown, successText: string) {
    setSaving(true);
    setStatus({ type: "loading", text: "Saving changes--" });
    try {
      const response = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, action: "save", data: payload }),
      });
      const result = await response.json();
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to save changes.");
      const nextData = normalizeData(result.data);
      setData(nextData);
      if (resource === "gear") setGearDraft(nextData.gear);
      if (resource === "photos") {
        const saved = nextData.photos.find((loc) => loc.slug === (payload as PhotoLocation).slug);
        if (saved) setPhotoDraft(saved);
      }
      setStatus({ type: "success", text: successText });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to save changes." });
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteResource(resource: string, slug: string, successText: string, title: string) {
    setResourceToDelete({ resource, slug, successText, title });
    setDeleteDialogOpen(true);
  }

  async function confirmDeleteResource() {
    if (!resourceToDelete) return;
    const { resource, slug, successText } = resourceToDelete;
    setSaving(true);
    setDeleteDialogOpen(false);
    setStatus({ type: "loading", text: "Deleting entry--" });
    try {
      const response = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, action: "delete", slug }),
      });
      const result = await response.json();
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to delete entry.");
      const nextData = normalizeData(result.data);
      setData(nextData);
      setProjectDraft(nextData.projects[0] ?? emptyProject(nextData.projects.length + 1));
      setPhotoDraft(nextData.photos[0] ?? emptyPhotoLocation(nextData.photos.length + 1));
      setStatus({ type: "success", text: successText });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to delete entry." });
    } finally {
      setSaving(false);
      setResourceToDelete(null);
    }
  }

  async function uploadFiles(
    target: "photos" | "gear",
    files: FileList | null,
    slug?: string,
  ) {
    if (!files?.length) return;
    setSaving(true);
    setStatus({ type: "loading", text: "Uploading images--" });
    if (target === "photos") {
      setUploadingImages(Array.from(files).map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
    }
    try {
      const form = new FormData();
      form.append("target", target);
      if (slug) form.append("slug", slug);
      Array.from(files).forEach((f) => form.append("files", f));
      const response = await fetch("/api/cms/upload", { method: "POST", body: form });
      const result = await response.json();
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to upload images.");
      const nextData = normalizeData(result.data);
      setData(nextData);
      if (target === "gear" && result.uploaded?.[0]?.src) updateGearItem("image", result.uploaded[0].src);
      if (target === "photos") {
        const nextLoc = nextData.photos.find((l) => l.slug === slug);
        if (nextLoc) setPhotoDraft(nextLoc);
      }
      setStatus({ type: "success", text: "Upload complete." });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to upload images." });
    } finally {
      setSaving(false);
      setUploadingImages((cur) => { cur.forEach((img) => URL.revokeObjectURL(img.url)); return []; });
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  /* ------ Gear helpers --------------------------------------------------------------------------------------------------------------------------------------------- */
  function updateGearSection<K extends keyof GearSection>(field: K, value: GearSection[K]) {
    setGearDraft((cur) => ({
      ...cur,
      sections: cur.sections.map((sec, i) =>
        i === gearSectionIndex ? { ...sec, [field]: value } : sec,
      ),
    }));
  }

  function updateGearItem<K extends keyof GearItem>(field: K, value: GearItem[K]) {
    setGearDraft((cur) => ({
      ...cur,
      sections: cur.sections.map((sec, si) => {
        if (si !== gearSectionIndex) return sec;
        return {
          ...sec,
          items: sec.items.map((item, ii) =>
            ii === gearItemIndex ? { ...item, [field]: value } : item,
          ),
        };
      }),
    }));
  }

  function updateGearItemName(name: string) {
    setGearDraft((cur) => ({
      ...cur,
      sections: cur.sections.map((sec, si) => {
        if (si !== gearSectionIndex) return sec;
        return {
          ...sec,
          items: sec.items.map((item, ii) =>
            ii === gearItemIndex ? { ...item, name, slug: slugify(name) } : item,
          ),
        };
      }),
    }));
  }

  async function fillGearItemWithAi() {
    if (!selectedGearItem || !selectedGearSection) return;
    const name = selectedGearItem.name.trim();

    if (!name) {
      setStatus({ type: "error", text: "Enter a product name before using AI fill." });
      return;
    }

    setGearAiFilling(true);
    setStatus({ type: "loading", text: `Filling ${name} with AI...` });

    try {
      const response = await fetch("/api/cms/gear-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sectionTitle: selectedGearSection.title }),
      });
      const result = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to fill product details.");
      }

      const aiItem = result.item ?? {};
      setGearDraft((cur) => ({
        ...cur,
        sections: cur.sections.map((sec, si) => {
          if (si !== gearSectionIndex) return sec;
          return {
            ...sec,
            items: sec.items.map((item, ii) =>
              ii === gearItemIndex
                ? {
                    ...item,
                    headline: String(aiItem.headline || item.headline),
                    tag: String(aiItem.tag || item.tag),
                    description: String(aiItem.description || item.description),
                  }
                : item,
            ),
          };
        }),
      }));

      setStatus({
        type: "success",
        text: result.item?.source === "gemini"
          ? "AI filled product fields."
          : "Filled product fields with local fallback. Add GEMINI_API_KEY for richer AI results.",
      });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to fill product details." });
    } finally {
      setGearAiFilling(false);
    }
  }

  function addGearSection() {
    setGearDraft((cur) => ({ ...cur, sections: [...cur.sections, emptyGearSection()] }));
    setGearSectionIndex(gearDraft.sections.length);
    setGearItemIndex(0);
  }

  function addGearItem() {
    if (!selectedGearSection) return;
    const nextItem = newGearItem(selectedGearSection);
    const nextIndex = selectedGearSection.items.length;
    setGearDraft((cur) => ({
      ...cur,
      sections: cur.sections.map((sec, i) =>
        i === gearSectionIndex ? { ...sec, items: [...sec.items, nextItem] } : sec,
      ),
    }));
    setGearItemIndex(nextIndex);
    setStatus({ type: "success", text: `Added ${nextItem.name} to ${selectedGearSection.title}. Save all to publish.` });
  }

  function removeGearItem() {
    setGearDraft((cur) => ({
      ...cur,
      sections: cur.sections.map((sec, i) =>
        i === gearSectionIndex
          ? { ...sec, items: sec.items.filter((_, ii) => ii !== gearItemIndex) }
          : sec,
      ),
    }));
    setGearItemIndex(0);
  }

  function removeGearSection() {
    setGearDraft((cur) => ({
      ...cur,
      sections: cur.sections.filter((_, i) => i !== gearSectionIndex),
    }));
    setGearSectionIndex(0);
    setGearItemIndex(0);
  }

  function openWritingPost(post: WritingPost) {
    if (post.id) {
      window.location.href = `/cms/writing/${post.id}/edit`;
    } else {
      navigateToTab("writing");
    }
  }

  function renderOverview() {
          if (!data) return null;
          return (
            <Dashboard
              data={data}
              onOpenTab={navigateToTab}
              onOpenPost={openWritingPost}
              jsonPosts={jsonPosts}
            />
          );
        }

        function renderWriting() {
          if (loadingJsonPosts) {
            return (
              <div className="cms-loading">
                <Loader2 size={24} className="cms-spin animate-spin" />
                <span>Loading Writing posts--</span>
              </div>
            );
          }
          return (
            <div className="cms-content cms-content-writing font-sans">
              <WritingDashboard initialPosts={jsonPosts} />
            </div>
          );
        }

  function renderGear() {
    const gearViewHref = selectedGearItem?.slug
      ? `/gear#${selectedGearItem.slug}`
      : selectedGearSection?.slug
        ? `/gear#${selectedGearSection.slug}`
        : "/gear";

    return (
      <div className="cms-content">
        <div className="cms-page-header">
          <div>
            <h1 className="cms-page-title">Gear</h1>
            <p className="cms-page-subtitle">Manage your tools, setup, and product recommendations.</p>
          </div>
          <SmallLinkButton href={gearViewHref} icon={<ExternalLink size={14} />} tone="secondary">
            View page
          </SmallLinkButton>
        </div>
        <section className="cms-editor-grid">
          <aside className="cms-list-panel">
            <div className="cms-panel-head">
              <h2>Sections</h2>
              <SmallButton icon={<Plus size={14} />} tone="secondary" onClick={addGearSection}>
                Section
              </SmallButton>
            </div>
            <div className="cms-list">
              {gearDraft.sections.map((sec, index) => (
                <button
                  key={sec.slug || `${sec.title}-${index}`}
                  type="button"
                  className={index === gearSectionIndex ? "is-active" : ""}
                  onClick={() => { setGearSectionIndex(index); setGearItemIndex(0); }}
                >
                  <span>{sec.title}</span>
                  <small>{sec.items.length} items</small>
                </button>
              ))}
              {gearDraft.sections.length === 0 && <p className="cms-empty">No sections yet.</p>}
            </div>
          </aside>

          <div className="cms-editor">
            <div className="cms-editor-head">
              <div>
                <p className="cms-kicker">Gear setup JSON</p>
                <h2>{gearDraft.title}</h2>
              </div>
              <div className="cms-actions">
                <SmallLinkButton href={gearViewHref} icon={<ExternalLink size={14} />} tone="secondary">
                  View page
                </SmallLinkButton>
              </div>
            </div>

            <div className="cms-form-grid">
              <Field label="Page title"    value={gearDraft.title}       onChange={(v) => setGearDraft({ ...gearDraft, title: v })} />
              <Field label="Headline HTML" value={gearDraft.headline}    onChange={(v) => setGearDraft({ ...gearDraft, headline: v })} />
              <TextArea label="Description" value={gearDraft.description} rows={3} onChange={(v) => setGearDraft({ ...gearDraft, description: v })} />
            </div>

            {selectedGearSection ? (
              <>
                <div className="cms-subhead">
                  <h3>Section</h3>
                  <SmallButton icon={<Trash2 size={14} />} tone="danger" onClick={removeGearSection}>
                    Remove section
                  </SmallButton>
                </div>

                <div className="cms-form-grid">
                  <Field label="Section title"    value={selectedGearSection.title}       onChange={(v) => updateGearSection("title", v)} />
                  <Field label="Section slug"     value={selectedGearSection.slug}        onChange={(v) => updateGearSection("slug", v)} />
                  <Field label="Section headline" value={selectedGearSection.headline}    onChange={(v) => updateGearSection("headline", v)} />
                  <Field label="Section image"    value={selectedGearSection.image}       onChange={(v) => updateGearSection("image", v)} />
                  <TextArea label="Section description" value={selectedGearSection.description} rows={3} onChange={(v) => updateGearSection("description", v)} />
                </div>

                <div className="cms-subhead cms-subhead-compact">
                  <div>
                    <h3>Products in {selectedGearSection.title}</h3>
                    <p className="cms-subtitle-small">{selectedGearSection.items.length} items in this section</p>
                  </div>
                  <SmallButton icon={<Plus size={14} />} tone="secondary" onClick={addGearItem}>
                    Add product
                  </SmallButton>
                </div>

                <div className="cms-gear-item-list" aria-label={`Products in ${selectedGearSection.title}`}>
                  {selectedGearSection.items.map((item, i) => (
                    <button
                      key={item.slug || `${item.name}-${i}`}
                      type="button"
                      className={i === gearItemIndex ? "is-active" : ""}
                      onClick={() => setGearItemIndex(i)}
                    >
                      <span>{item.name || `Product ${i + 1}`}</span>
                      <small>{item.tag || item.slug || "No tag"}</small>
                    </button>
                  ))}
                  {selectedGearSection.items.length === 0 && (
                    <p className="cms-empty">No products in this section yet. Add one above.</p>
                  )}
                </div>

                {selectedGearItem ? (
                  <>
                    <div className="cms-form-grid">
                      <Field label="Name"        value={selectedGearItem.name}        onChange={updateGearItemName} />
                      <Field label="Slug"        value={selectedGearItem.slug}        onChange={(v) => updateGearItem("slug", v)} />
                      <Field label="Headline"    value={selectedGearItem.headline}    onChange={(v) => updateGearItem("headline", v)} />
                      <Field label="Tag"         value={selectedGearItem.tag}         onChange={(v) => updateGearItem("tag", v)} />
                      <Field label="Image path"  value={selectedGearItem.image}       onChange={(v) => updateGearItem("image", v)} />
                      <TextArea label="Description" value={selectedGearItem.description} rows={4} onChange={(v) => updateGearItem("description", v)} />
                    </div>
                    <div className="cms-upload-row">
                      <input ref={gearUploadRef} type="file" accept="image/*" hidden onChange={(e) => uploadFiles("gear", e.target.files)} />
                      <SmallButton
                        icon={gearAiFilling ? <Loader2 size={14} className="cms-spin" /> : <Sparkles size={14} />}
                        tone="secondary"
                        disabled={gearAiFilling || saving || !selectedGearItem.name.trim()}
                        onClick={fillGearItemWithAi}
                      >
                        {gearAiFilling ? "Filling" : "AI fill"}
                      </SmallButton>
                      <SmallButton icon={<Upload size={14} />} tone="secondary" onClick={() => gearUploadRef.current?.click()}>
                        Upload product image
                      </SmallButton>
                      <SmallButton icon={<Trash2 size={14} />} tone="danger" onClick={removeGearItem}>Remove item</SmallButton>
                    </div>
                  </>
                ) : (
                  <p className="cms-empty">No item in this section yet.</p>
                )}
              </>
            ) : (
              <p className="cms-empty">Create a section to start adding gear.</p>
            )}

            <div className="cms-editor-save-row">
              <SmallButton icon={<Save size={15} />} disabled={saving} onClick={() => saveResource("gear", gearDraft, "Gear saved.")}>
                Save all
              </SmallButton>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderWork() {
    const projectViewHref = projectDraft.slug ? `/work/${projectDraft.slug}` : undefined;

    return (
      <div className="cms-content">
        <div className="cms-page-header">
          <div>
            <h1 className="cms-page-title">Work</h1>
            <p className="cms-page-subtitle">Manage your portfolio projects and case studies.</p>
          </div>
          <SmallLinkButton href={projectViewHref ?? "/work"} icon={<ExternalLink size={14} />} tone="secondary">
            View page
          </SmallLinkButton>
        </div>
        <section className="cms-editor-grid">
          <aside className="cms-list-panel">
            <div className="cms-panel-head">
              <h2>What I Do</h2>
              <SmallButton
                icon={<Plus size={14} />}
                tone="secondary"
                onClick={() => setProjectDraft(emptyProject((data?.projects.length ?? 0) + 1))}
              >
                New
              </SmallButton>
            </div>
            <div className="cms-list">
              {(data?.projects ?? []).map((project) => (
                <button
                  key={project.slug}
                  type="button"
                  className={project.slug === projectDraft.slug ? "is-active" : ""}
                  onClick={() => setProjectDraft(project)}
                >
                  <span>{project.title || "(Untitled)"}</span>
                  <small>{project.number} / {project.year}</small>
                </button>
              ))}
              {(data?.projects ?? []).length === 0 && <p className="cms-empty">No projects yet.</p>}
            </div>
          </aside>

          <form
            className="cms-editor"
            onSubmit={(e) => {
              e.preventDefault();
              saveResource("projects", projectDraft, "Work project saved.");
            }}
          >
            <div className="cms-editor-head">
              <div>
                <p className="cms-kicker">Project JSON</p>
                <h2>{projectDraft.title || "New work project"}</h2>
              </div>
              <div className="cms-actions">
                <SmallLinkButton
                  href={projectViewHref}
                  icon={<ExternalLink size={15} />}
                  tone="secondary"
                  title={projectViewHref ? "Open public work page" : "Add a slug before opening the public page"}
                >
                  View page
                </SmallLinkButton>
                <SmallButton icon={<Save size={15} />} type="submit" disabled={saving}>Save</SmallButton>
                <SmallButton
                  icon={<Trash2 size={15} />}
                  tone="danger"
                  disabled={!projectDraft.slug || saving}
                  onClick={() => requestDeleteResource("projects", projectDraft.slug, "Work project deleted.", projectDraft.title || projectDraft.slug)}
                >
                  Delete
                </SmallButton>
              </div>
            </div>

            <div className="cms-form-grid">
              <Field label="Order"       type="number" value={projectDraft.order}       onChange={(v) => setProjectDraft({ ...projectDraft, order: Number(v) })} />
              <Field label="Number"      value={projectDraft.number}                    onChange={(v) => setProjectDraft({ ...projectDraft, number: v })} />
              <Field label="Slug"        value={projectDraft.slug}                      onChange={(v) => setProjectDraft({ ...projectDraft, slug: v })} />
              <Field label="Title"       required value={projectDraft.title}            onChange={(v) => setProjectDraft({ ...projectDraft, title: v })} />
              <Field label="Client"      value={projectDraft.client}                    onChange={(v) => setProjectDraft({ ...projectDraft, client: v })} />
              <Field label="Year"        value={projectDraft.year}                      onChange={(v) => setProjectDraft({ ...projectDraft, year: v })} />
              <Field label="Role"        value={projectDraft.role}                      onChange={(v) => setProjectDraft({ ...projectDraft, role: v })} />
              <Field label="Cover image" value={projectDraft.coverImage}               onChange={(v) => setProjectDraft({ ...projectDraft, coverImage: v })} />
              <Field label="Live link"   value={projectDraft.link}                     onChange={(v) => setProjectDraft({ ...projectDraft, link: v })} />
              <Field label="Link label"  value={projectDraft.linkLabel}                onChange={(v) => setProjectDraft({ ...projectDraft, linkLabel: v })} />
              <Field label="Tools"       value={listToString(projectDraft.tools)}       onChange={(v) => setProjectDraft({ ...projectDraft, tools: splitList(v) })} />
              <Field label="Skills"      value={listToString(projectDraft.skills)}      onChange={(v) => setProjectDraft({ ...projectDraft, skills: splitList(v) })} />
              <TextArea label="Summary"     value={projectDraft.summary}     rows={3} onChange={(v) => setProjectDraft({ ...projectDraft, summary: v })} />
              <TextArea label="Description" value={projectDraft.description} rows={9} onChange={(v) => setProjectDraft({ ...projectDraft, description: v })} />
            </div>
          </form>
        </section>
      </div>
    );
  }

  function updatePhoto<K extends keyof PhotoLocation>(field: K, value: PhotoLocation[K]) {
    setPhotoDraft((current) => ({ ...current, [field]: value }));
  }

  function updatePhotoImage(index: number, field: keyof PhotoImage, value: string | number) {
    setPhotoDraft((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image,
      ),
    }));
  }

  function removePhotoImage(index: number) {
    setPhotoDraft((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  function addRelatedLocation() {
    setPhotoDraft((current) => ({
      ...current,
      relatedLocations: [...current.relatedLocations, { slug: "", distance: "", category: "" }],
    }));
  }

  function updateRelatedLocation(index: number, patch: Partial<RelatedLocation>) {
    setPhotoDraft((current) => ({
      ...current,
      relatedLocations: current.relatedLocations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function removeRelatedLocation(index: number) {
    setPhotoDraft((current) => ({
      ...current,
      relatedLocations: current.relatedLocations.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function renderPhotos() {
    const photoViewHref = photoDraft.slug ? `/photos#${photoDraft.slug}` : undefined;
    const locationOptions = (data?.photos ?? []).filter((loc) => loc.slug !== photoDraft.slug);

    return (
      <div className="cms-content">
        <div className="cms-page-header">
          <div>
            <h1 className="cms-page-title">Photos</h1>
            <p className="cms-page-subtitle">Manage your photo locations and image galleries.</p>
          </div>
          <SmallLinkButton href={photoViewHref ?? "/photos"} icon={<ExternalLink size={14} />} tone="secondary">
            View page
          </SmallLinkButton>
        </div>
        <section className="cms-editor-grid">
          <aside className="cms-list-panel">
            <div className="cms-panel-head">
              <h2>Locations</h2>
              <SmallButton
                icon={<Plus size={14} />}
                tone="secondary"
                onClick={() => setPhotoDraft(emptyPhotoLocation((data?.photos.length ?? 0) + 1))}
              >
                Location
              </SmallButton>
            </div>
            <div className="cms-list">
              {(data?.photos ?? []).map((loc) => (
                <button
                  key={loc.slug}
                  type="button"
                  className={loc.slug === photoDraft.slug ? "is-active" : ""}
                  onClick={() => setPhotoDraft(loc)}
                >
                  <span>{loc.location || "(Untitled)"}</span>
                  <small>{loc.type.replace("-", " ")} / {loc.images.length} photos</small>
                </button>
              ))}
              {(data?.photos ?? []).length === 0 && <p className="cms-empty">No locations yet.</p>}
            </div>
          </aside>

          <form
            className="cms-editor"
            onSubmit={(e) => {
              e.preventDefault();
              saveResource("photos", photoDraft, "Photo location saved.");
            }}
          >
            <div className="cms-editor-head">
              <div>
                <p className="cms-kicker">Location JSON</p>
                <h2>{photoDraft.location || "New photo location"}</h2>
              </div>
              <div className="cms-actions">
                <SmallLinkButton
                  href={photoViewHref}
                  icon={<ExternalLink size={15} />}
                  tone="secondary"
                  title={photoViewHref ? "Open public photo location" : "Add a slug before opening the public page"}
                >
                  View page
                </SmallLinkButton>
                <SmallButton icon={<Save size={15} />} type="submit" disabled={saving}>Save</SmallButton>
                <SmallButton
                  icon={<Trash2 size={15} />}
                  tone="danger"
                  disabled={!photoDraft.slug || saving}
                  onClick={() => requestDeleteResource("photos", photoDraft.slug, "Photo location deleted.", photoDraft.location || photoDraft.slug)}
                >
                  Delete
                </SmallButton>
              </div>
            </div>

            <CollapsibleSection title="Basic Information" defaultOpen>
              <div className="cms-form-grid">
                <Field label="Slug" value={photoDraft.slug} onChange={(v) => updatePhoto("slug", v)} />
                <Field
                  label="Location Name"
                  required
                  value={photoDraft.location}
                  onChange={(v) => setPhotoDraft({
                    ...photoDraft,
                    location: v,
                    name: v,
                    slug: photoDraft.slug || slugify(v),
                    headline: photoDraft.headline || v,
                  })}
                />
                <Field label="Province / City" value={photoDraft.province} onChange={(v) => setPhotoDraft({ ...photoDraft, province: v, city: photoDraft.city || v })} />
                <Field label="Headline" value={photoDraft.headline} onChange={(v) => updatePhoto("headline", v)} />
                <Field label="Subheadline" value={photoDraft.subheadline} onChange={(v) => updatePhoto("subheadline", v)} />
                <TextArea label="Short Introduction" value={photoDraft.introduction} rows={4} onChange={(v) => setPhotoDraft({ ...photoDraft, introduction: v, shortDescription: v, description: photoDraft.description || v })} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Quick Facts" defaultOpen>
              <div className="cms-form-grid">
                <Field label="Recommended Stay" value={photoDraft.recommendedStay} placeholder="3 ngày 2 đêm" onChange={(v) => updatePhoto("recommendedStay", v)} />
                <Field label="Best Months" value={photoDraft.bestMonths} placeholder="Tháng 11 - tháng 3" onChange={(v) => updatePhoto("bestMonths", v)} />
                <Field label="Budget Minimum" type="number" value={photoDraft.budgetMin} onChange={(v) => updatePhoto("budgetMin", v === "" ? "" : Number(v))} />
                <Field label="Budget Maximum" type="number" value={photoDraft.budgetMax} onChange={(v) => updatePhoto("budgetMax", v === "" ? "" : Number(v))} />
                <Field label="Budget Note" value={photoDraft.budgetNote} placeholder="per person / 7 days" onChange={(v) => updatePhoto("budgetNote", v)} />
                <MultiSelectField label="Suitable For" value={photoDraft.suitableFor} options={suitableForOptions} onChange={(value) => updatePhoto("suitableFor", value)} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Good To Know" defaultOpen>
              <div className="cms-form-grid">
                <MultiSelectField label="Best Time of Day" value={photoDraft.bestTimeOfDay} options={bestTimeOfDayOptions} onChange={(value) => updatePhoto("bestTimeOfDay", value)} />
                <RepeatableListField label="Travel Tips" value={photoDraft.travelTips} placeholder="Mang theo áo khoác mỏng" onChange={(value) => updatePhoto("travelTips", value)} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Media" defaultOpen>
              <input
                ref={photoUploadRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => uploadFiles("photos", e.target.files, photoDraft.slug)}
              />
              <div
                className="cms-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  uploadFiles("photos", e.dataTransfer.files, photoDraft.slug);
                }}
              >
                <ImageIcon size={18} />
                <SmallButton
                  icon={<Upload size={14} />}
                  tone="secondary"
                  disabled={!photoDraft.slug}
                  onClick={() => photoUploadRef.current?.click()}
                >
                  Upload to location
                </SmallButton>
                <span className="cms-upload-note">
                  Saves to src/assets/photos/{photoDraft.slug || "location-slug"}/
                </span>
              </div>
              {(photoDraft.images.length > 0 || uploadingImages.length > 0) && (
                <div className="cms-photo-grid cms-photo-grid-edit">
                  {photoDraft.images.map((photo, index) => {
                    const src = photo.src.startsWith("/assets/photos/")
                      ? photo.src.replace("/assets/photos/", "/api/cms/assets/")
                      : photo.src;
                    return (
                      <figure key={`${photo.src}-${index}`}>
                        <button type="button" className="cms-photo-preview-btn" onClick={() => setPreviewImage({ src, alt: photo.alt })}>
                          <img src={src} alt={photo.alt} className="cms-photo-thumb" />
                        </button>
                        <div className="cms-photo-meta">
                          <Field label="Alt text" value={photo.alt} onChange={(v) => updatePhotoImage(index, "alt", v)} />
                          <Field label="Caption" value={photo.caption ?? ""} onChange={(v) => updatePhotoImage(index, "caption", v)} />
                        </div>
                        <div className="cms-photo-actions">
                          <SmallButton tone="danger" icon={<Trash2 size={13} />} onClick={() => removePhotoImage(index)}>Remove</SmallButton>
                        </div>
                      </figure>
                    );
                  })}
                  {uploadingImages.map((img, i) => (
                    <figure key={`uploading-${i}`} className="is-uploading">
                      <div className="cms-photo-loading-overlay"><Loader2 className="cms-spin" size={20} /></div>
                      <img src={img.url} alt={img.name} className="cms-photo-thumb" />
                      <figcaption>Uploading {img.name}...</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Nearby Locations">
              <div className="cms-relation-list">
                {photoDraft.relatedLocations.map((item, index) => {
                  const related = locationOptions.find((loc) => loc.slug === item.slug);
                  const image = related?.heroImage?.src || related?.images[0]?.src || "";
                  const imageSrc = image.startsWith("/assets/photos/") ? image.replace("/assets/photos/", "/api/cms/assets/") : image;
                  return (
                    <div className="cms-relation-row" key={`${item.slug}-${index}`}>
                      <div className="cms-relation-preview">
                        {imageSrc ? <img src={imageSrc} alt={related?.location || item.slug} /> : <MapPin size={18} />}
                        <div>
                          <strong>{related?.location || item.slug || "Nearby location"}</strong>
                          <span>{item.distance || "Distance"} / {item.category || related?.type || "Category"}</span>
                        </div>
                      </div>
                      <div className="cms-form-grid cms-form-grid-tight">
                        <SelectField
                          label="Title"
                          value={item.slug}
                          options={[{ value: "", label: "Choose location" }, ...locationOptions.map((loc) => ({ value: loc.slug, label: loc.location }))]}
                          onChange={(v) => updateRelatedLocation(index, { slug: v })}
                        />
                        <Field label="Distance" value={item.distance} onChange={(v) => updateRelatedLocation(index, { distance: v })} />
                        <Field label="Category" value={item.category} onChange={(v) => updateRelatedLocation(index, { category: v })} />
                      </div>
                      <SmallButton icon={<Trash2 size={14} />} tone="danger" onClick={() => removeRelatedLocation(index)}>Remove</SmallButton>
                    </div>
                  );
                })}
                {photoDraft.relatedLocations.length === 0 && <p className="cms-empty">No nearby locations selected.</p>}
              </div>
              <SmallButton icon={<Plus size={14} />} tone="secondary" onClick={addRelatedLocation}>Nearby place</SmallButton>
            </CollapsibleSection>

          </form>
        </section>
      </div>
    );
  }

  /* ------ Active tab dispatcher ------------------------------------------------------------------------------------------------------------------ */
  function renderActiveTab() {
    if (!data && status.type === "loading") {
      return (
        <div className="cms-loading">
          <Loader2 size={24} className="cms-spin" />
          <span>Loading CMS--</span>
        </div>
      );
    }
    if (activeTab === "writing") return renderWriting();
    if (activeTab === "gear")    return renderGear();
    if (activeTab === "work")    return renderWork();
    if (activeTab === "photos")  return renderPhotos();
    return renderOverview();
  }

  /* ------ Editor mode returns ---------------------------------------------------------------------------------------------------------------------------------- */
  if (routeInfo.mode === "new") {
    return (
      <div className="editor-loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--sans)' }}>
        <Loader2 className="cms-spin animate-spin" size={32} style={{ marginBottom: 12 }} />
        <div>Creating draft post...</div>
      </div>
    );
  }

  if (routeInfo.mode === "edit") {
    if (loadingPost) {
      return (
        <div className="editor-loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--sans)' }}>
          <Loader2 className="cms-spin animate-spin" size={32} style={{ marginBottom: 12 }} />
          <div>Loading editor...</div>
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="editor-loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--sans)', gap: 16 }}>
          <div style={{ color: 'red' }}>Error: {loadError}</div>
          <a href="/cms/writing" style={{ padding: '8px 16px', background: '#1a1a1a', color: 'white', borderRadius: 8, textDecoration: 'none' }}>Back to Writing</a>
        </div>
      );
    }
    if (editingPost) {
      return (
        <div className="cms-app cms-editor-only">
          <WritingEditorPage initialPost={editingPost} />
        </div>
      );
    }
  }

  /* ------ Render --------------------------------------------------------------------------------------------------------------------------------------------------------------- */
  return (
    <div className="cms-app">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          navigateToTab(tab);
        }}
        onLogout={logout}
        setStatus={setStatus}
      />

      <main className="cms-main">
        <Topbar />

        {status.text && (
          <div
            className={`cms-status cms-status-${status.type}`}
            role="status"
            aria-live="polite"
          >
            {status.type === "loading" && <Loader2 size={15} className="cms-spin" />}
            {status.type === "success" && <CheckCircle2 size={15} />}
            {status.type === "error"   && <AlertCircle  size={15} />}
            <span>{status.text}</span>
          </div>
        )}

        {renderActiveTab()}
      </main>

      {/* Image lightbox */}
      {previewImage && (
        <div className="cms-modal-overlay" onClick={() => setPreviewImage(null)}>
          <button
            type="button"
            className="cms-modal-close"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
          >
            -
          </button>
          <div className="cms-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.src} alt={previewImage.alt} />
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Are you sure?"
        description={`Are you sure you want to delete "${resourceToDelete?.title || "this item"}"? This action cannot be undone.`}
        onConfirm={confirmDeleteResource}
        onCancel={() => { setDeleteDialogOpen(false); setResourceToDelete(null); }}
        loading={saving}
      />
    </div>
  );
}
