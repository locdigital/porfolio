import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  HardDrive,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Package,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────── */
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

/* ── Nav structure ──────────────────────────────────────────────── */
type NavGroup = {
  label: string;
  items: Array<{ id: Tab; label: string; icon: React.ElementType }>;
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

/* ── Stat card data ─────────────────────────────────────────────── */
type StatDef = {
  title: string;
  icon: React.ElementType;
  accent: "blue" | "green" | "amber" | "purple";
  footer: string[];
};

const statDefs: StatDef[] = [
  {
    title: "Writing Posts",
    icon: FileText,
    accent: "blue",
    footer: ["Published", "Draft", "Scheduled"],
  },
  {
    title: "Gear Items",
    icon: Package,
    accent: "green",
    footer: ["Across sections"],
  },
  {
    title: "Work Projects",
    icon: Briefcase,
    accent: "amber",
    footer: ["Client work"],
  },
  {
    title: "Photo Locations",
    icon: Camera,
    accent: "purple",
    footer: ["With images"],
  },
];

/* ── Activity feed (static) ─────────────────────────────────────── */
const activities = [
  { icon: CheckCircle2, text: "CMS data loaded successfully",  time: "just now"    },
  { icon: UserPlus,     text: "New writing post ready to edit", time: "moments ago" },
  { icon: MessageSquare,text: "Gear sections updated",          time: "earlier"     },
  { icon: Send,         text: "Photos synced to build",         time: "last session"},
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function splitList(value: string) {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function listToString(value: string[] = []) {
  return value.join(", ");
}

function emptyWriting(): WritingPost {
  return {
    slug: "", title: "", headline: "", summary: "", keyword: "",
    metaDescription: "", coverImage: "", publishedAt: today(),
    tags: [], draft: false, body: "Start writing here...",
  };
}

function emptyGear(): Gear {
  return { title: "My Gear", headline: "Tools I actually use.", description: "", sections: [] };
}

function emptyGearSection(): GearSection {
  return { title: "New Section", slug: "", headline: "", description: "", image: "", items: [] };
}

function emptyGearItem(): GearItem {
  return { name: "New Gear Item", slug: "", headline: "", description: "", image: "", url: "", tag: "" };
}

function emptyProject(order = 99): Project {
  return {
    slug: "", order, number: String(order).padStart(2, "0"),
    title: "", client: "", year: "", role: "", summary: "", description: "",
    tools: [], skills: [], coverImage: "", images: [], link: "", linkLabel: "", caseStudyLink: "",
  };
}

function emptyPhotoLocation(order = 99): PhotoLocation {
  return { slug: "", order, location: "", headline: "", subheadline: "", description: "", images: [] };
}

function normalizeData(data: Partial<CmsData>): CmsData {
  return {
    writing:  Array.isArray(data.writing)  ? data.writing  : [],
    gear:     data.gear?.sections          ? data.gear      : emptyGear(),
    projects: Array.isArray(data.projects) ? data.projects  : [],
    photos:   Array.isArray(data.photos)   ? data.photos    : [],
  };
}

function imagesToText(images: PhotoImage[] = []) {
  return images
    .map((p) => [p.src, p.alt, p.width || "", p.height || ""].join(" | "))
    .join("\n");
}

function textToImages(value: string): PhotoImage[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [src = "", alt = "", width = "1600", height = "1200"] =
        line.split("|").map((p) => p.trim());
      return { src, alt, width: Number(width) || 1600, height: Number(height) || 1200 };
    })
    .filter((p) => p.src);
}

/* ── Primitive UI components ─────────────────────────────────────── */
function Field(props: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
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
}) {
  return (
    <label className="cms-field cms-field-full">
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

function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="cms-toggle">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
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

/* ── Sidebar ─────────────────────────────────────────────────────── */
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
            <div className="cms-workspace-avatar">L</div>
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
        <button type="button" className="cms-storage-upgrade">Upgrade Plan ↗</button>
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

/* ── Topbar ─────────────────────────────────────────────────────── */
function Topbar({
  activeTab,
  onQuickCreate,
  onOpenAskAi,
  darkMode,
  onToggleDarkMode,
}: {
  activeTab: Tab;
  onQuickCreate: (type: "writing" | "gear" | "work" | "photos") => void;
  onOpenAskAi: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  const label = navGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ?? "Dashboard";
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const qcRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (qcRef.current && !qcRef.current.contains(e.target as Node)) {
        setQuickCreateOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="cms-topbar">
      {/* Search */}
      <div className="cms-topbar-search" role="search">
        <Search size={15} className="cms-topbar-search-icon" />
        <input
          type="search"
          placeholder="Search content…"
          aria-label="Search CMS content"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd className="cms-topbar-kbd">⌘K</kbd>
      </div>

      {/* Right actions */}
      <div className="cms-topbar-actions">
        <button
          type="button"
          className="cms-topbar-btn"
          id="cms-ask-ai-btn"
          aria-label="Ask AI"
          onClick={onOpenAskAi}
        >
          <Sparkles size={15} className="cms-topbar-ai-icon" />
          Ask AI
        </button>

        {/* Quick Create Wrapper */}
        <div className="cms-relative-wrapper" ref={qcRef}>
          <button
            type="button"
            className="cms-topbar-btn cms-topbar-btn-primary"
            id="cms-quick-create-btn"
            aria-label="Quick create"
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
          >
            <Plus size={15} />
            Quick Create
          </button>

          {quickCreateOpen && (
            <div className="cms-dropdown-menu" style={{ right: 0, width: 220 }}>
              <button
                type="button"
                className="cms-dropdown-item"
                onClick={() => {
                  onQuickCreate("writing");
                  setQuickCreateOpen(false);
                }}
              >
                <FileText size={14} />
                <span>New Writing Post</span>
              </button>
              <button
                type="button"
                className="cms-dropdown-item"
                onClick={() => {
                  onQuickCreate("gear");
                  setQuickCreateOpen(false);
                }}
              >
                <Package size={14} />
                <span>New Gear Item</span>
              </button>
              <button
                type="button"
                className="cms-dropdown-item"
                onClick={() => {
                  onQuickCreate("work");
                  setQuickCreateOpen(false);
                }}
              >
                <Briefcase size={14} />
                <span>New Work Project</span>
              </button>
              <button
                type="button"
                className="cms-dropdown-item"
                onClick={() => {
                  onQuickCreate("photos");
                  setQuickCreateOpen(false);
                }}
              >
                <Camera size={14} />
                <span>New Photo Location</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Wrapper */}
        <div className="cms-relative-wrapper" ref={notifRef}>
          <button
            type="button"
            className="cms-topbar-btn cms-topbar-btn-icon"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell size={16} />
            <span className="cms-notif-dot" aria-hidden="true" />
          </button>

          {notificationsOpen && (
            <div className="cms-dropdown-menu" style={{ right: 0, width: 280, padding: "8px 0" }}>
              <div className="cms-dropdown-header" style={{ padding: "8px 16px" }}>Notifications</div>
              <div className="cms-dropdown-item-info" style={{ padding: "8px 16px", borderBottom: "1px solid var(--divider)" }}>
                <strong style={{ display: "block", fontSize: 12 }}>System Status</strong>
                <span style={{ display: "block", fontSize: 11, color: "var(--muted)", margin: "2px 0" }}>CMS database parsed successfully.</span>
                <small style={{ fontSize: 9, color: "var(--muted)", opacity: 0.8 }}>Just now</small>
              </div>
              <div className="cms-dropdown-item-info" style={{ padding: "8px 16px" }}>
                <strong style={{ display: "block", fontSize: 12 }}>Git Deploy</strong>
                <span style={{ display: "block", fontSize: 11, color: "var(--muted)", margin: "2px 0" }}>Branch 'main' push completed.</span>
                <small style={{ fontSize: 9, color: "var(--muted)", opacity: 0.8 }}>2 hours ago</small>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="cms-topbar-btn cms-topbar-btn-icon"
          aria-label="Toggle dark mode"
          onClick={onToggleDarkMode}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div
          className="cms-topbar-avatar"
          role="button"
          aria-label="User menu"
          title={`Viewing: ${label}`}
        >
          A
        </div>
      </div>
    </header>
  );
}

/* ── Ask AI Drawer ───────────────────────────────────────────────── */
function AskAiDrawer({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Xin chào! Tôi là trợ lý AI của Lộc Digital. Bạn cần tôi giúp gì về quản lý nội dung portfolio hôm nay?" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInput("");

    // Simulate AI response based on keywords
    setTimeout(() => {
      let reply = "Tôi có thể giúp bạn viết bài đăng, tìm kiếm các phần trong Gear hoặc tối ưu hóa dự án. Hãy cho tôi biết cụ thể nhé!";
      const query = userMsg.toLowerCase();
      if (query.includes("gear")) {
        reply = "Hệ thống đang lưu trữ 28 món đồ Gear chia làm 7 danh mục khác nhau. Bạn có thể thêm món mới bằng cách bấm 'Quick Create' -> 'New Gear Item'.";
      } else if (query.includes("writing") || query.includes("bài viết")) {
        reply = "Hiện tại bạn chưa có bài viết blog nào hoạt động. Bạn muốn tôi gợi ý một số chủ đề SEO về Digital Marketing không?";
      } else if (query.includes("project") || query.includes("dự án") || query.includes("work")) {
        reply = "Có 5 dự án Work đã được cấu hình trong hệ thống (như PNJ, Sony Vietnam, Playah...). Bạn có thể chỉnh sửa mô tả của từng dự án ở tab 'Work'.";
      } else if (query.includes("photo") || query.includes("ảnh")) {
        reply = "Thư mục Photos của bạn đang chứa 4 địa điểm chụp ảnh với tổng số 17 hình ảnh đã đồng bộ.";
      }
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 800);
  };

  return (
    <div className="cms-drawer-overlay" onClick={onClose}>
      <div className="cms-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="cms-drawer-header">
          <div className="cms-drawer-title">
            <Sparkles size={16} className="cms-accent-color" style={{ color: "var(--accent)" }} />
            <h3 style={{ margin: 0, fontSize: 16 }}>Trợ lý AI</h3>
          </div>
          <button type="button" className="cms-drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="cms-drawer-body">
          <div className="cms-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cms-chat-bubble-wrapper is-${m.sender}`}>
                <div className="cms-chat-bubble">{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
        <form className="cms-drawer-footer" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Hỏi AI bất kỳ điều gì…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="cms-chat-send-btn">Gửi</button>
        </form>
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────────── */
function StatCard({ def, value, footerValues }: {
  def: StatDef;
  value: string;
  footerValues: string[];
}) {
  const Icon = def.icon;
  return (
    <article className="cms-stat-card">
      <div className="cms-stat-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className={`cms-stat-icon-wrap ${def.accent}`}>
            <Icon size={17} />
          </div>
          <span className="cms-stat-label">{def.title}</span>
        </div>
        <span className="cms-stat-growth">↗ live</span>
      </div>

      <div>
        <div className="cms-stat-value">{value}</div>
        <div className="cms-stat-meta">Total count</div>
      </div>

      <div className="cms-stat-footer">
        {def.footer.map((label, i) => (
          <span key={label} className="cms-stat-detail">
            {label}: {footerValues[i] ?? "—"}
          </span>
        ))}
      </div>
    </article>
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
      return `${s.toLocaleDateString("en-US", opt)} – ${e.toLocaleDateString("en-US", opt)}`;
    } catch {
      return "Jun 14 – Jun 21";
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

          {/* Primary curve — views */}
          <path
            d={`${viewsPath} L900,200 L0,200 Z`}
            fill="url(#cms-grad-blue)"
          />
          <path
            d={viewsPath}
            fill="none" stroke="#0075de" strokeWidth="2.5" strokeLinecap="round"
          />

          {/* Secondary curve — writing */}
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

/* ── Recent posts table ─────────────────────────────────────────── */
function RecentPostsTable({ posts }: { posts: WritingPost[] }) {
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
        <button type="button" className="cms-table-more" aria-label="More options">
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
                <tr key={post.slug}>
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
                  <td style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--muted)" }}>
                    {post.publishedAt || "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>
                    {post.tags.slice(0, 2).join(", ") || "—"}
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

/* ── Categories panel ───────────────────────────────────────────── */
function CategoriesPanel({ data }: { data: CmsData }) {
  const gearTotal = data.gear.sections.reduce((s, sec) => s + sec.items.length, 0);
  const total = data.writing.length + gearTotal + data.projects.length + data.photos.length;

  const categories = [
    { name: "Writing",   count: data.writing.length  },
    { name: "Gear",      count: gearTotal             },
    { name: "Projects",  count: data.projects.length  },
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

/* ── Activity panel ─────────────────────────────────────────────── */
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

/* ── Dashboard / Overview ────────────────────────────────────────── */
function Dashboard({ data }: { data: CmsData }) {
  const gearTotal = data.gear.sections.reduce((s, sec) => s + sec.items.length, 0);
  const draftCount  = data.writing.filter((p) => p.draft).length;
  const publishedCount = data.writing.filter((p) => !p.draft).length;

  const statValues: [string, string[]][] = [
    [
      String(data.writing.length),
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
        <h1 className="cms-page-title">Dashboard</h1>
        <p className="cms-page-subtitle">
          Here&apos;s what&apos;s happening with your content today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="cms-stat-grid">
        {statDefs.map((def, i) => (
          <StatCard
            key={def.title}
            def={def}
            value={statValues[i][0]}
            footerValues={statValues[i][1]}
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
      <RecentPostsTable posts={data.writing} />
    </div>
  );
}

/* ── Props & main component ─────────────────────────────────────── */
type CmsDashboardProps = {
  initialData?: CmsData;
};

export default function CmsDashboard({ initialData }: CmsDashboardProps) {
  const [activeTab,          setActiveTab]          = useState<Tab>("overview");
  const normalizedInitial                            = useMemo(
    () => (initialData ? normalizeData(initialData) : null),
    [initialData],
  );
  const [status, setStatus] = useState<Status>(
    normalizedInitial
      ? { type: "success", text: "CMS data ready." }
      : { type: "loading", text: "Loading CMS data…" },
  );
  const [data,              setData]              = useState<CmsData | null>(normalizedInitial);
  const [writingDraft,      setWritingDraft]      = useState<WritingPost>(
    normalizedInitial?.writing[0] ?? emptyWriting(),
  );
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
  const [uploadingImages,   setUploadingImages]   = useState<Array<{ url: string; name: string }>>([]);
  const [previewImage,      setPreviewImage]      = useState<{ src: string; alt: string } | null>(null);
  const gearUploadRef  = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const selectedGearSection = gearDraft.sections[gearSectionIndex];
  const selectedGearItem    = selectedGearSection?.items[gearItemIndex];

  /* ── Data loading ─────────────────────────────────────────────── */
  async function loadData(options: { quiet?: boolean } = {}) {
    if (!options.quiet) setStatus({ type: "loading", text: "Loading CMS data…" });

    const response = await fetch("/api/cms");
    if (response.status === 401) { window.location.href = "/login"; return; }

    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.error || "Unable to load CMS data.");

    const nextData = normalizeData(result.data);
    setData(nextData);
    setGearDraft(nextData.gear);
    setWritingDraft(nextData.writing[0] ?? emptyWriting());
    setProjectDraft(nextData.projects[0] ?? emptyProject(nextData.projects.length + 1));
    setPhotoDraft(nextData.photos[0] ?? emptyPhotoLocation(nextData.photos.length + 1));
    setGearSectionIndex(0);
    setGearItemIndex(0);

    if (!options.quiet) setStatus({ type: "success", text: "CMS data ready." });
  }

  useEffect(() => {
    console.log("CmsDashboard: mounted on client.");
  }, []);

  useEffect(() => {
    if (normalizedInitial) return;
    loadData().catch((err) =>
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to load CMS data." }),
    );
  }, [normalizedInitial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewImage(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Save / Delete / Upload ───────────────────────────────────── */
  async function saveResource(resource: string, payload: unknown, successText: string) {
    setSaving(true);
    setStatus({ type: "loading", text: "Saving changes…" });
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
      setStatus({ type: "success", text: successText });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to save changes." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteResource(resource: string, slug: string, successText: string) {
    if (!slug || !window.confirm(`Delete ${slug}?`)) return;
    setSaving(true);
    setStatus({ type: "loading", text: "Deleting entry…" });
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
      setWritingDraft(nextData.writing[0] ?? emptyWriting());
      setProjectDraft(nextData.projects[0] ?? emptyProject(nextData.projects.length + 1));
      setPhotoDraft(nextData.photos[0] ?? emptyPhotoLocation(nextData.photos.length + 1));
      setStatus({ type: "success", text: successText });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "Unable to delete entry." });
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(target: "photos" | "gear", files: FileList | null, slug?: string) {
    if (!files?.length) return;
    setSaving(true);
    setStatus({ type: "loading", text: "Uploading images…" });
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

  /* ── Gear helpers ─────────────────────────────────────────────── */
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

  function addGearSection() {
    setGearDraft((cur) => ({ ...cur, sections: [...cur.sections, emptyGearSection()] }));
    setGearSectionIndex(gearDraft.sections.length);
    setGearItemIndex(0);
  }

  function addGearItem() {
    if (!selectedGearSection) return;
    setGearDraft((cur) => ({
      ...cur,
      sections: cur.sections.map((sec, i) =>
        i === gearSectionIndex ? { ...sec, items: [...sec.items, emptyGearItem()] } : sec,
      ),
    }));
    setGearItemIndex(selectedGearSection.items.length);
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
    setGearDraft((cur) => ({ ...cur, sections: cur.sections.filter((_, i) => i !== gearSectionIndex) }));
    setGearSectionIndex(0);
    setGearItemIndex(0);
  }

  /* ── Tab renderers ────────────────────────────────────────────── */
  function renderOverview() {
    if (!data) return null;
    return <Dashboard data={data} />;
  }

  function renderWriting() {
    return (
      <div className="cms-content">
        <div className="cms-page-header">
          <h1 className="cms-page-title">Writing</h1>
          <p className="cms-page-subtitle">Create and manage your blog posts and articles.</p>
        </div>
        <section className="cms-editor-grid">
          <aside className="cms-list-panel">
            <div className="cms-panel-head">
              <h2>Posts</h2>
              <SmallButton icon={<Plus size={14} />} tone="secondary" onClick={() => setWritingDraft(emptyWriting())}>
                New
              </SmallButton>
            </div>
            <div className="cms-list">
              {(data?.writing ?? []).map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  className={post.slug === writingDraft.slug ? "is-active" : ""}
                  onClick={() => setWritingDraft(post)}
                >
                  <span>{post.headline || post.title || "(Untitled)"}</span>
                  <small>{post.draft ? "Draft" : post.publishedAt}</small>
                </button>
              ))}
              {(data?.writing ?? []).length === 0 && (
                <p className="cms-empty">No posts yet.</p>
              )}
            </div>
          </aside>

          <form
            className="cms-editor"
            onSubmit={(e) => {
              e.preventDefault();
              saveResource("writing", writingDraft, "Writing post saved.");
            }}
          >
            <div className="cms-editor-head">
              <div>
                <p className="cms-kicker">Markdown entry</p>
                <h2>{writingDraft.slug ? writingDraft.headline || writingDraft.slug : "New writing post"}</h2>
              </div>
              <div className="cms-actions">
                <SmallButton icon={<Save size={15} />} type="submit" disabled={saving}>Save</SmallButton>
                <SmallButton
                  icon={<Trash2 size={15} />}
                  tone="danger"
                  disabled={!writingDraft.slug || saving}
                  onClick={() => deleteResource("writing", writingDraft.slug, "Writing post deleted.")}
                >
                  Delete
                </SmallButton>
              </div>
            </div>

            <div className="cms-form-grid">
              <Field label="Slug"       value={writingDraft.slug}            onChange={(v) => setWritingDraft({ ...writingDraft, slug: v })} />
              <Field label="Published"  type="date" value={writingDraft.publishedAt} onChange={(v) => setWritingDraft({ ...writingDraft, publishedAt: v })} />
              <Field label="Title"      required value={writingDraft.title}   onChange={(v) => setWritingDraft({ ...writingDraft, title: v })} />
              <Field label="Headline"   required value={writingDraft.headline} onChange={(v) => setWritingDraft({ ...writingDraft, headline: v })} />
              <Field label="Tags"       value={listToString(writingDraft.tags)} onChange={(v) => setWritingDraft({ ...writingDraft, tags: splitList(v) })} />
              <Field label="Cover image" value={writingDraft.coverImage}      onChange={(v) => setWritingDraft({ ...writingDraft, coverImage: v })} />
              <TextArea label="Summary"           value={writingDraft.summary}          rows={3}  onChange={(v) => setWritingDraft({ ...writingDraft, summary: v })} />
              <TextArea label="Meta description"  value={writingDraft.metaDescription}  rows={3}  onChange={(v) => setWritingDraft({ ...writingDraft, metaDescription: v })} />
              <TextArea label="Body markdown"     value={writingDraft.body}             rows={16} onChange={(v) => setWritingDraft({ ...writingDraft, body: v })} />
            </div>
            <Toggle label="Keep as draft" checked={writingDraft.draft} onChange={(v) => setWritingDraft({ ...writingDraft, draft: v })} />
          </form>
        </section>
      </div>
    );
  }

  function renderGear() {
    return (
      <div className="cms-content">
        <div className="cms-page-header">
          <h1 className="cms-page-title">Gear</h1>
          <p className="cms-page-subtitle">Manage your tools, setup, and product recommendations.</p>
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
                <SmallButton icon={<Save size={15} />} disabled={saving} onClick={() => saveResource("gear", gearDraft, "Gear saved.")}>
                  Save all
                </SmallButton>
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

                <div className="cms-item-toolbar">
                  <select
                    value={gearItemIndex}
                    onChange={(e) => setGearItemIndex(Number(e.target.value))}
                    aria-label="Select gear item"
                  >
                    {selectedGearSection.items.map((item, i) => (
                      <option key={item.slug || `${item.name}-${i}`} value={i}>{item.name}</option>
                    ))}
                  </select>
                  <SmallButton icon={<Plus size={14} />} tone="secondary" onClick={addGearItem}>Item</SmallButton>
                </div>

                {selectedGearItem ? (
                  <>
                    <div className="cms-form-grid">
                      <Field label="Name"        value={selectedGearItem.name}        onChange={(v) => updateGearItem("name", v)} />
                      <Field label="Slug"        value={selectedGearItem.slug}        onChange={(v) => updateGearItem("slug", v)} />
                      <Field label="Headline"    value={selectedGearItem.headline}    onChange={(v) => updateGearItem("headline", v)} />
                      <Field label="Tag"         value={selectedGearItem.tag}         onChange={(v) => updateGearItem("tag", v)} />
                      <Field label="URL"         value={selectedGearItem.url}         onChange={(v) => updateGearItem("url", v)} />
                      <Field label="Image path"  value={selectedGearItem.image}       onChange={(v) => updateGearItem("image", v)} />
                      <TextArea label="Description" value={selectedGearItem.description} rows={4} onChange={(v) => updateGearItem("description", v)} />
                    </div>
                    <div className="cms-upload-row">
                      <input ref={gearUploadRef} type="file" accept="image/*" hidden onChange={(e) => uploadFiles("gear", e.target.files)} />
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
          </div>
        </section>
      </div>
    );
  }

  function renderWork() {
    return (
      <div className="cms-content">
        <div className="cms-page-header">
          <h1 className="cms-page-title">Work</h1>
          <p className="cms-page-subtitle">Manage your portfolio projects and case studies.</p>
        </div>
        <section className="cms-editor-grid">
          <aside className="cms-list-panel">
            <div className="cms-panel-head">
              <h2>Projects</h2>
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
                <SmallButton icon={<Save size={15} />} type="submit" disabled={saving}>Save</SmallButton>
                <SmallButton
                  icon={<Trash2 size={15} />}
                  tone="danger"
                  disabled={!projectDraft.slug || saving}
                  onClick={() => deleteResource("projects", projectDraft.slug, "Work project deleted.")}
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

  function renderPhotos() {
    return (
      <div className="cms-content">
        <div className="cms-page-header">
          <h1 className="cms-page-title">Photos</h1>
          <p className="cms-page-subtitle">Manage your photo locations and image galleries.</p>
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
                  <small>{loc.images.length} photos</small>
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
                <SmallButton icon={<Save size={15} />} type="submit" disabled={saving}>Save</SmallButton>
                <SmallButton
                  icon={<Trash2 size={15} />}
                  tone="danger"
                  disabled={!photoDraft.slug || saving}
                  onClick={() => deleteResource("photos", photoDraft.slug, "Photo location deleted.")}
                >
                  Delete
                </SmallButton>
              </div>
            </div>

            <div className="cms-form-grid">
              <Field label="Order"       type="number" value={photoDraft.order}       onChange={(v) => setPhotoDraft({ ...photoDraft, order: Number(v) })} />
              <Field label="Slug"        value={photoDraft.slug}                      onChange={(v) => setPhotoDraft({ ...photoDraft, slug: v })} />
              <Field label="Location"    required value={photoDraft.location}         onChange={(v) => setPhotoDraft({ ...photoDraft, location: v })} />
              <Field label="Headline"    value={photoDraft.headline}                  onChange={(v) => setPhotoDraft({ ...photoDraft, headline: v })} />
              <Field label="Subheadline" value={photoDraft.subheadline}               onChange={(v) => setPhotoDraft({ ...photoDraft, subheadline: v })} />
              <TextArea label="Description"               value={photoDraft.description}         rows={3}  onChange={(v) => setPhotoDraft({ ...photoDraft, description: v })} />
              <TextArea
                label="Images: src | alt | width | height"
                value={imagesToText(photoDraft.images)}
                rows={9}
                onChange={(v) => setPhotoDraft({ ...photoDraft, images: textToImages(v) })}
              />
            </div>

            <div className="cms-upload-row">
              <input
                ref={photoUploadRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => uploadFiles("photos", e.target.files, photoDraft.slug)}
              />
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
              <div className="cms-photo-grid">
                {photoDraft.images.map((photo) => {
                  const src = photo.src.startsWith("/assets/photos/")
                    ? photo.src.replace("/assets/photos/", "/api/cms/assets/")
                    : photo.src;
                  return (
                    <figure key={`${photo.src}-${photo.alt}`} onClick={() => setPreviewImage({ src, alt: photo.alt })}>
                      <img src={src} alt={photo.alt} className="cms-photo-thumb" />
                      <figcaption>{photo.alt || photo.src}</figcaption>
                    </figure>
                  );
                })}
                {uploadingImages.map((img, i) => (
                  <figure key={`uploading-${i}`} className="is-uploading" onClick={() => setPreviewImage({ src: img.url, alt: img.name })}>
                    <div className="cms-photo-loading-overlay"><Loader2 className="cms-spin" size={20} /></div>
                    <img src={img.url} alt={img.name} className="cms-photo-thumb" />
                    <figcaption>Uploading {img.name}…</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </form>
        </section>
      </div>
    );
  }

  /* ── Active tab dispatcher ────────────────────────────────────── */
  function renderActiveTab() {
    if (!data && status.type === "loading") {
      return (
        <div className="cms-loading">
          <Loader2 size={24} className="cms-spin" />
          <span>Loading CMS…</span>
        </div>
      );
    }
    if (activeTab === "writing") return renderWriting();
    if (activeTab === "gear")    return renderGear();
    if (activeTab === "work")    return renderWork();
    if (activeTab === "photos")  return renderPhotos();
    return renderOverview();
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className={`cms-app${darkMode ? " cms-dark-mode" : ""}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          console.log("CmsDashboard: Tab button clicked:", tab);
          setActiveTab(tab);
        }}
        onLogout={logout}
        setStatus={setStatus}
      />

      <main className="cms-main">
        <Topbar
          activeTab={activeTab}
          onQuickCreate={(type) => {
            if (type === "writing") {
              setWritingDraft(emptyWriting());
              setActiveTab("writing");
            } else if (type === "gear") {
              setGearDraft(emptyGear());
              setActiveTab("gear");
            } else if (type === "work") {
              setProjectDraft(emptyProject((data?.projects.length ?? 0) + 1));
              setActiveTab("work");
            } else if (type === "photos") {
              setPhotoDraft(emptyPhotoLocation((data?.photos.length ?? 0) + 1));
              setActiveTab("photos");
            }
          }}
          onOpenAskAi={() => setAiDrawerOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

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
            ✕
          </button>
          <div className="cms-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.src} alt={previewImage.alt} />
          </div>
        </div>
      )}

      {/* Ask AI slide-out drawer */}
      {aiDrawerOpen && (
        <AskAiDrawer onClose={() => setAiDrawerOpen(false)} />
      )}
    </div>
  );
}
