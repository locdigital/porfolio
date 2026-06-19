import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileClock,
  Layout,
  GraduationCap,
  Image as ImageIcon,
  ChevronsUpDown,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Upload,
  Copy,
  Check,
  Search,
  ExternalLink,
  Loader2,
  FolderOpen,
  Eye,
  Settings,
  UserCircle,
  LogOut,
  Blocks,
  UserCog
} from "lucide-react";

interface CMSDashboardProps {
  isDev: boolean;
}

export function CMSDashboard({ isDev }: CMSDashboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "writing" | "projects" | "gear" | "uploads">("dashboard");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [writingList, setWritingList] = useState<any[]>([]);
  const [projectList, setProjectList] = useState<any[]>([]);
  const [gearData, setGearData] = useState<any>({ title: "", headline: "", description: "", sections: [] });
  const [uploadList, setUploadList] = useState<any[]>([]);

  // Editing state
  // null means list view, otherwise it holds the item being edited
  const [editingItem, setEditingItem] = useState<{
    type: "writing" | "project" | "gear-section" | "gear-item";
    item: any;
    isNew: boolean;
    parentIndex?: number; // used for nested gear items
  } | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Dropdowns state
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Notification helper
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial data
  useEffect(() => {
    async function initFetch() {
      try {
        setLoading(true);
        const [writingRes, projectsRes, gearRes, uploadsRes] = await Promise.all([
          fetch("/api/cms/writing").then(r => r.json()),
          fetch("/api/cms/projects").then(r => r.json()),
          fetch("/api/cms/gear").then(r => r.json()),
          fetch("/api/cms/upload").then(r => r.json())
        ]);

        if (writingRes.success) setWritingList(writingRes.posts || []);
        if (projectsRes.success) setProjectList(projectsRes.projects || []);
        if (gearRes.success) setGearData(gearRes.gear || { title: "", headline: "", description: "", sections: [] });
        if (uploadsRes.success) setUploadList(uploadsRes.uploads || []);
      } catch (err: any) {
        showNotification("error", "Failed to fetch CMS data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    initFetch();
  }, []);

  // Fetch uploads helper
  const refreshUploads = async () => {
    try {
      const res = await fetch("/api/cms/upload").then(r => r.json());
      if (res.success) setUploadList(res.uploads || []);
    } catch (err) {}
  };

  // Generate slug helper
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Writing save handler
  const handleSaveWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDev) {
      showNotification("error", "Writing is disabled in production (Local Dev only)");
      return;
    }
    if (!editingItem) return;

    setSaving(true);
    try {
      const { item, isNew } = editingItem;
      const url = "/api/cms/writing";
      const method = isNew ? "POST" : "PUT";
      const body = isNew
        ? { slug: item.slug || generateSlug(item.data.title), data: item.data, content: item.content }
        : { originalSlug: editingItem.item.originalSlug || item.slug, slug: item.slug, data: item.data, content: item.content };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(r => r.json());

      if (res.success) {
        showNotification("success", isNew ? "Created article successfully!" : "Updated article successfully!");
        
        // Refresh list
        const listRes = await fetch("/api/cms/writing").then(r => r.json());
        if (listRes.success) setWritingList(listRes.posts || []);
        setEditingItem(null);
      } else {
        showNotification("error", res.error || "Save failed");
      }
    } catch (err: any) {
      showNotification("error", "Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Writing delete handler
  const handleDeleteWriting = async (slug: string) => {
    if (!isDev) {
      showNotification("error", "Writing is disabled in production");
      return;
    }
    if (!confirm(`Are you sure you want to delete the article "${slug}"?`)) return;

    try {
      const res = await fetch("/api/cms/writing", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug })
      }).then(r => r.json());

      if (res.success) {
        showNotification("success", "Deleted article!");
        setWritingList(prev => prev.filter(p => p.slug !== slug));
        if (editingItem?.item.slug === slug) setEditingItem(null);
      } else {
        showNotification("error", res.error || "Delete failed");
      }
    } catch (err: any) {
      showNotification("error", "Error deleting: " + err.message);
    }
  };

  // Project save handler
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDev) {
      showNotification("error", "Writing is disabled in production");
      return;
    }
    if (!editingItem) return;

    setSaving(true);
    try {
      const { item, isNew } = editingItem;
      const url = "/api/cms/projects";
      const method = isNew ? "POST" : "PUT";
      const body = isNew
        ? item
        : { originalSlug: editingItem.item.originalSlug || item.slug, project: item };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(r => r.json());

      if (res.success) {
        showNotification("success", isNew ? "Created project successfully!" : "Updated project successfully!");
        
        // Refresh list
        const listRes = await fetch("/api/cms/projects").then(r => r.json());
        if (listRes.success) setProjectList(listRes.projects || []);
        setEditingItem(null);
      } else {
        showNotification("error", res.error || "Save failed");
      }
    } catch (err: any) {
      showNotification("error", "Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Project delete handler
  const handleDeleteProject = async (slug: string) => {
    if (!isDev) {
      showNotification("error", "Writing is disabled in production");
      return;
    }
    if (!confirm(`Are you sure you want to delete project "${slug}"?`)) return;

    try {
      const res = await fetch("/api/cms/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug })
      }).then(r => r.json());

      if (res.success) {
        showNotification("success", "Deleted project!");
        setProjectList(prev => prev.filter(p => p.slug !== slug));
        if (editingItem?.item.slug === slug) setEditingItem(null);
      } else {
        showNotification("error", res.error || "Delete failed");
      }
    } catch (err: any) {
      showNotification("error", "Error deleting: " + err.message);
    }
  };

  // Gear Save handler
  const handleSaveGear = async (newGearData: any) => {
    if (!isDev) {
      showNotification("error", "Writing is disabled in production");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cms/gear", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGearData)
      }).then(r => r.json());

      if (res.success) {
        showNotification("success", "Updated Gear Setup!");
        setGearData(newGearData);
        setEditingItem(null);
      } else {
        showNotification("error", res.error || "Save failed");
      }
    } catch (err: any) {
      showNotification("error", "Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Image Upload handler
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDev) {
      showNotification("error", "Upload is disabled in production");
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    setSaving(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      const res = await fetch("/api/cms/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          data: base64
        })
      }).then(r => r.json());

      if (res.success) {
        showNotification("success", `Uploaded ${file.name} successfully!`);
        refreshUploads();
      } else {
        showNotification("error", res.error || "Upload failed");
      }
    } catch (err: any) {
      showNotification("error", "Upload error: " + err.message);
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Direct image upload helper for form inputs
  const uploadImageDirectly = async (file: File): Promise<string | null> => {
    if (!isDev) {
      showNotification("error", "Upload is disabled in production");
      return null;
    }

    setSaving(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      const res = await fetch("/api/cms/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          data: base64
        })
      }).then(r => r.json());

      if (res.success) {
        showNotification("success", `Uploaded ${file.name} successfully!`);
        refreshUploads();
        return res.url;
      } else {
        showNotification("error", res.error || "Upload failed");
        return null;
      }
    } catch (err: any) {
      showNotification("error", "Upload error: " + err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Copy to clipboard helper
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showNotification("success", "Copied image URL to clipboard!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Sidebar navigation subcomponents
  const sidebarVariants = {
    open: { width: "15rem" },
    closed: { width: "4rem" },
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "writing", label: "Writing", icon: FileClock, badge: "Posts" },
    { id: "projects", label: "Projects", icon: Layout },
    { id: "gear", label: "My Gear", icon: GraduationCap },
    { id: "uploads", label: "Media Library", icon: ImageIcon }
  ];

  return (
    <div className="flex h-full w-full flex-row overflow-hidden bg-gray-50 text-gray-900">
      {/* Notifications banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${
              notification.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            }`}
          >
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Production Warning Banner */}
      {!isDev && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-1.5 text-center text-xs font-semibold shadow flex items-center justify-center gap-2">
          <span>⚠️ Read-Only mode active. Changes can only be saved when running locally on localhost.</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <motion.div
        className="z-40 h-full border-r border-gray-200 bg-white flex flex-col justify-between shrink-0 relative"
        initial={isCollapsed ? "closed" : "open"}
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full">
          {/* Header Org Select */}
          <div className="flex h-[56px] items-center border-b border-gray-100 p-3 relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-gray-50 transition"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-blue-600 font-bold text-white text-xs shadow-sm">
                LD
              </div>
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate text-sm font-semibold text-gray-800">locdigital</span>
                  <ChevronsUpDown className="size-4 shrink-0 text-gray-400" />
                </div>
              )}
            </button>

            {/* Org Dropdown */}
            {orgDropdownOpen && !isCollapsed && (
              <div className="absolute top-[50px] left-3 right-3 z-50 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <UserCog className="size-3.5" /> Manage Members
                </button>
                <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <Blocks className="size-3.5" /> Integrations
                </button>
                <div className="my-1 border-t border-gray-100" />
                <div className="px-2.5 py-1 text-[10px] text-gray-400">Environment: {isDev ? "Local Dev" : "Production"}</div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-4 px-2 overflow-y-auto cms-scrollbar">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setEditingItem(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`size-5 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} />
                      {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                              {item.id === "writing" ? writingList.length : item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer Account dropdown */}
          <div className="border-t border-gray-100 p-3 relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50 transition"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 uppercase">
                PL
              </div>
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <div className="flex flex-col text-left">
                    <span className="truncate text-xs font-semibold text-gray-800">Phuc Loc Nguyen</span>
                    <span className="truncate text-[10px] text-gray-400">loc.digital</span>
                  </div>
                  <ChevronsUpDown className="size-4 text-gray-400" />
                </div>
              )}
            </button>

            {userDropdownOpen && !isCollapsed && (
              <div className="absolute bottom-[56px] left-3 right-3 z-50 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                <a href="/" target="_blank" className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <Eye className="size-3.5" /> View Live Site ↗
                </a>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="size-3.5" /> Close Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main content body */}
      <div className="flex flex-1 flex-col overflow-hidden pt-1">
        {/* Navigation Bar / Top Header */}
        <header className="flex h-[56px] items-center justify-between border-b border-gray-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
              {activeTab === "dashboard" && "Dashboard / Overview"}
              {activeTab === "writing" && "Writing / Articles"}
              {activeTab === "projects" && "Portfolio Projects"}
              {activeTab === "gear" && "My Everyday Gear"}
              {activeTab === "uploads" && "Media Library"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>View Site</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </header>

        {/* Inner Tab Contents */}
        <main className="flex-1 overflow-y-auto p-8 cms-scrollbar">
          {loading ? (
            <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-500">Loading your content manager...</span>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl">
              {/* Tab: Dashboard Overview */}
              {activeTab === "dashboard" && (
                <div className="space-y-8">
                  {/* Banner stats grid */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Articles</span>
                        <div className="rounded-full bg-blue-50 p-2 text-blue-600"><FileClock className="size-5" /></div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-gray-900">{writingList.length}</span>
                        <span className="text-xs text-gray-500">local posts</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Projects Managed</span>
                        <div className="rounded-full bg-purple-50 p-2 text-purple-600"><Layout className="size-5" /></div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-gray-900">{projectList.length}</span>
                        <span className="text-xs text-gray-500">showcased works</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gear Sections</span>
                        <div className="rounded-full bg-emerald-50 p-2 text-emerald-600"><GraduationCap className="size-5" /></div>
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-gray-900">
                          {gearData.sections?.length || 0}
                        </span>
                        <span className="text-xs text-gray-500">categories</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick System Info / Developer mode */}
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800">CMS Administration Node</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Welcome to your portfolio CMS. When running locally in Dev mode, changes are saved as clean files
                      directly into your workspace. In Production, the manager operates in a safe read-only preview mode.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
                        <span className={`size-2 rounded-full ${isDev ? "bg-emerald-500" : "bg-amber-500"}`} />
                        Status: {isDev ? "Local Developer Instance" : "Production Demo Node"}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
                        <FolderOpen className="size-3.5 text-gray-400" />
                        Storage: Git-backed Filesystem
                      </span>
                    </div>
                  </div>

                  {/* Recent Activity lists */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Recent Articles */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Recent Articles</h4>
                        <button onClick={() => setActiveTab("writing")} className="text-xs font-semibold text-blue-600 hover:underline">View all</button>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {writingList.slice(0, 3).map((post, idx) => (
                          <div key={post.slug || idx} className="py-3 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-800">{post.data.title}</p>
                              <p className="text-xs text-gray-400">Published: {new Date(post.data.publishedAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`ml-2 text-xs font-medium rounded-full px-2 py-0.5 ${post.data.draft ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-800"}`}>
                              {post.data.draft ? "Draft" : "Published"}
                            </span>
                          </div>
                        ))}
                        {writingList.length === 0 && <p className="text-center py-6 text-sm text-gray-400">No local articles found.</p>}
                      </div>
                    </div>

                    {/* Recent Projects */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Recent Projects</h4>
                        <button onClick={() => setActiveTab("projects")} className="text-xs font-semibold text-blue-600 hover:underline">View all</button>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {projectList.slice(0, 3).map((proj, idx) => (
                          <div key={proj.slug || idx} className="py-3 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-800">{proj.title}</p>
                              <p className="text-xs text-gray-400">Client: {proj.client} • Year: {proj.year}</p>
                            </div>
                            <span className="text-xs font-mono text-gray-400">#{proj.number}</span>
                          </div>
                        ))}
                        {projectList.length === 0 && <p className="text-center py-6 text-sm text-gray-400">No project list files found.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Writing (Articles) */}
              {activeTab === "writing" && (
                <div>
                  {editingItem?.type === "writing" ? (
                    // Writing Editor Panel
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <button
                          onClick={() => setEditingItem(null)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          <ArrowLeft className="size-4" /> Back to list
                        </button>
                        <h3 className="text-sm font-bold text-gray-700">
                          {editingItem.isNew ? "Create Blog Post" : `Editing: ${editingItem.item.slug}`}
                        </h3>
                      </div>

                      <form onSubmit={handleSaveWriting} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Article Title *</label>
                            <input
                              type="text"
                              required
                              value={editingItem.item.data.title}
                              onChange={(e) => {
                                const title = e.target.value;
                                setEditingItem(prev => {
                                  if (!prev) return null;
                                  const updatedData = { ...prev.item.data, title };
                                  // Auto-generate slug if it's a new article
                                  const updatedSlug = prev.isNew ? generateSlug(title) : prev.item.slug;
                                  return { ...prev, item: { ...prev.item, slug: updatedSlug, data: updatedData } };
                                });
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Title as shown on index grids"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Slug (File name) *</label>
                            <input
                              type="text"
                              required
                              value={editingItem.item.slug}
                              onChange={(e) => {
                                const slug = generateSlug(e.target.value);
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, slug } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="e.g. optimizing-portfolio-speed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Headline / Intro subtitle *</label>
                          <input
                            type="text"
                            required
                            value={editingItem.item.data.headline}
                            onChange={(e) => {
                              const headline = e.target.value;
                              setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, data: { ...prev.item.data, headline } } } : null));
                            }}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="A brief punchy hook line for the blog banner"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Publish Date *</label>
                            <input
                              type="date"
                              required
                              value={
                                editingItem.item.data.publishedAt
                                  ? new Date(editingItem.item.data.publishedAt).toISOString().split("T")[0]
                                  : new Date().toISOString().split("T")[0]
                              }
                              onChange={(e) => {
                                const publishedAt = new Date(e.target.value);
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, data: { ...prev.item.data, publishedAt } } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Tags (Comma-separated)</label>
                            <input
                              type="text"
                              value={editingItem.item.data.tags?.join(", ") || ""}
                              onChange={(e) => {
                                const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, data: { ...prev.item.data, tags } } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="SEO, Analytics, Paid Ads"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Cover Image (URL or uploaded path)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingItem.item.data.coverImage || ""}
                                onChange={(e) => {
                                  const coverImage = e.target.value;
                                  setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, data: { ...prev.item.data, coverImage } } } : null));
                                }}
                                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. /uploads/image.png"
                              />
                              <label className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer shrink-0">
                                <Upload className="size-3.5" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={saving || !isDev}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await uploadImageDirectly(file);
                                      if (url) {
                                        setEditingItem(prev => {
                                          if (!prev) return null;
                                          return { ...prev, item: { ...prev.item, data: { ...prev.item.data, coverImage: url } } };
                                        });
                                      }
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="flex items-center pt-5">
                            <input
                              type="checkbox"
                              id="draft"
                              checked={editingItem.item.data.draft}
                              onChange={(e) => {
                                const draft = e.target.checked;
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, data: { ...prev.item.data, draft } } } : null));
                              }}
                              className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="draft" className="ml-2 text-sm font-semibold text-gray-600">
                              Save as Draft (will not display on public blog list)
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Summary Excerpt / Meta Description</label>
                          <textarea
                            rows={3}
                            value={editingItem.item.data.summary || ""}
                            onChange={(e) => {
                              const summary = e.target.value;
                              setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, data: { ...prev.item.data, summary, metaDescription: summary } } } : null));
                            }}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Brief description for social shares and list cards..."
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase">Markdown Content Body</label>
                            <span className="text-[10px] text-gray-400 font-semibold">Supports full Markdown syntax</span>
                          </div>
                          <textarea
                            rows={15}
                            value={editingItem.item.content || ""}
                            onChange={(e) => {
                              const content = e.target.value;
                              setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, content } } : null));
                            }}
                            className="w-full font-mono rounded-md border border-gray-200 p-4 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="# Write your article post here..."
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving || !isDev}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Save Article File
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // Writing List View
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        {/* Search and Filters */}
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-gray-200 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                          />
                        </div>

                        <button
                          onClick={() =>
                            setEditingItem({
                              type: "writing",
                              isNew: true,
                              item: {
                                slug: "",
                                data: { title: "", headline: "", summary: "", tags: [], draft: false },
                                content: ""
                              }
                            })
                          }
                          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                          <Plus className="size-4" /> New Article
                        </button>
                      </div>

                      {/* Articles Table Grid */}
                      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                            <tr>
                              <th className="px-6 py-4">Title</th>
                              <th className="px-6 py-4">Publish Date</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Tags</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {writingList
                              .filter(post => post.data.title.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map((post) => (
                                <tr key={post.slug} className="hover:bg-gray-50/50 transition">
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-800">{post.data.title}</div>
                                    <div className="text-xs text-gray-400 font-mono">slug: {post.slug}</div>
                                  </td>
                                  <td className="px-6 py-4 text-gray-500">
                                    {new Date(post.data.publishedAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                      post.data.draft ? "bg-gray-100 text-gray-600" : "bg-emerald-100 text-emerald-800"
                                    }`}>
                                      {post.data.draft ? "Draft" : "Published"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 max-w-xs truncate">
                                    <div className="flex flex-wrap gap-1">
                                      {post.data.tags?.map((tag: string) => (
                                        <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() =>
                                        setEditingItem({
                                          type: "writing",
                                          isNew: false,
                                          item: {
                                            originalSlug: post.slug,
                                            slug: post.slug,
                                            data: post.data,
                                            content: post.content
                                          }
                                        })
                                      }
                                      className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWriting(post.slug)}
                                      className="rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            {writingList.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                                  No local articles found in `src/content/writing/`. Create one to start!
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Projects */}
              {activeTab === "projects" && (
                <div>
                  {editingItem?.type === "project" ? (
                    // Project Editor Panel
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <button
                          onClick={() => setEditingItem(null)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          <ArrowLeft className="size-4" /> Back to list
                        </button>
                        <h3 className="text-sm font-bold text-gray-700">
                          {editingItem.isNew ? "Create Showcase Project" : `Editing: ${editingItem.item.slug}`}
                        </h3>
                      </div>

                      <form onSubmit={handleSaveProject} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Project Title *</label>
                            <input
                              type="text"
                              required
                              value={editingItem.item.title}
                              onChange={(e) => {
                                const title = e.target.value;
                                setEditingItem(prev => {
                                  if (!prev) return null;
                                  const updatedSlug = prev.isNew ? generateSlug(title) : prev.item.slug;
                                  return { ...prev, item: { ...prev.item, title, slug: updatedSlug } };
                                });
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="e.g. PlayAh! — Brand Growth"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Slug (Filename) *</label>
                            <input
                              type="text"
                              required
                              value={editingItem.item.slug}
                              onChange={(e) => {
                                const slug = generateSlug(e.target.value);
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, slug } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="e.g. playah"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 uppercase">Sort Order *</label>
                              <input
                                type="number"
                                required
                                value={editingItem.item.order}
                                onChange={(e) => {
                                  const order = parseInt(e.target.value) || 0;
                                  setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, order } } : null));
                                }}
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 uppercase">Num String *</label>
                              <input
                                type="text"
                                required
                                value={editingItem.item.number}
                                onChange={(e) => {
                                  const number = e.target.value;
                                  setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, number } } : null));
                                }}
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="01"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Client Name *</label>
                            <input
                              type="text"
                              required
                              value={editingItem.item.client}
                              onChange={(e) => {
                                const client = e.target.value;
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, client } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="PlayAh! Vietnam"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Role / Responsibility *</label>
                            <input
                              type="text"
                              required
                              value={editingItem.item.role}
                              onChange={(e) => {
                                const role = e.target.value;
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, role } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Digital Marketing Specialist"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Year span *</label>
                            <input
                              type="text"
                              required
                              value={editingItem.item.year}
                              onChange={(e) => {
                                const year = e.target.value;
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, year } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="2024–Present"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Tools Used (comma separated)</label>
                            <input
                              type="text"
                              value={editingItem.item.tools?.join(", ") || ""}
                              onChange={(e) => {
                                const tools = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, tools } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Meta Ads, Google Ads"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Skills Used (comma separated)</label>
                            <input
                              type="text"
                              value={editingItem.item.skills?.join(", ") || ""}
                              onChange={(e) => {
                                const skills = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, skills } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Performance Marketing, Creatives"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Cover Image *</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                required
                                value={editingItem.item.coverImage}
                                onChange={(e) => {
                                  const coverImage = e.target.value;
                                  setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, coverImage } } : null));
                                }}
                                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="/assets/logos/logo-playah.webp"
                              />
                              <label className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer shrink-0">
                                <Upload className="size-3.5" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={saving || !isDev}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await uploadImageDirectly(file);
                                      if (url) {
                                        setEditingItem(prev => {
                                          if (!prev) return null;
                                          return { ...prev, item: { ...prev.item, coverImage: url } };
                                        });
                                      }
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">External Web Link</label>
                            <input
                              type="text"
                              value={editingItem.item.link || ""}
                              onChange={(e) => {
                                const link = e.target.value;
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, link } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="https://clientsite.com"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Link Label</label>
                            <input
                              type="text"
                              value={editingItem.item.linkLabel || ""}
                              onChange={(e) => {
                                const linkLabel = e.target.value;
                                setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, linkLabel } } : null));
                              }}
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Visit Site ↗"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Summary (Short hook statement) *</label>
                          <textarea
                            rows={2}
                            required
                            value={editingItem.item.summary}
                            onChange={(e) => {
                              const summary = e.target.value;
                              setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, summary } } : null));
                            }}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="A concise summary card description..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Full Description (Multi-line copy) *</label>
                          <textarea
                            rows={8}
                            required
                            value={editingItem.item.description}
                            onChange={(e) => {
                              const description = e.target.value;
                              setEditingItem(prev => (prev ? { ...prev, item: { ...prev.item, description } } : null));
                            }}
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Complete overview of objectives, achievements, metrics, etc..."
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving || !isDev}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Save Project File
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // Project List View
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-gray-200 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                          />
                        </div>

                        <button
                          onClick={() =>
                            setEditingItem({
                              type: "project",
                              isNew: true,
                              item: {
                                slug: "",
                                order: projectList.length + 1,
                                number: String(projectList.length + 1).padStart(2, "0"),
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
                                linkLabel: ""
                              }
                            })
                          }
                          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                          <Plus className="size-4" /> New Project
                        </button>
                      </div>

                      {/* Projects Cards List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projectList
                          .filter(proj => proj.title.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map((proj) => (
                            <div key={proj.slug} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition relative flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="size-10 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                                      {proj.coverImage ? (
                                        <img src={proj.coverImage} className="max-h-full max-w-full object-contain" alt="" />
                                      ) : (
                                        <FolderOpen className="size-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-800 leading-tight">{proj.title}</h4>
                                      <p className="text-xs text-gray-400">order: {proj.order} | file: {proj.slug}.json</p>
                                    </div>
                                  </div>
                                  <span className="font-mono text-xs font-bold text-gray-300">#{proj.number}</span>
                                </div>
                                <p className="mt-4 text-xs text-gray-500 line-clamp-3">{proj.summary}</p>

                                <div className="mt-4 flex flex-wrap gap-1">
                                  {proj.tools?.map((tool: string) => (
                                    <span key={tool} className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700">
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-50 pt-4">
                                <button
                                  onClick={() =>
                                    setEditingItem({
                                      type: "project",
                                      isNew: false,
                                      item: { originalSlug: proj.slug, ...proj }
                                    })
                                  }
                                  className="rounded bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                                >
                                  Edit Detail
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(proj.slug)}
                                  className="rounded bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        {projectList.length === 0 && (
                          <div className="col-span-2 rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
                            No projects found in `src/content/projects/`. Create your first showcase piece!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Everyday Gear */}
              {activeTab === "gear" && (
                <div className="space-y-6">
                  {/* Global Gear Info Cards */}
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-semibold text-gray-800">Everyday Setup Page Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Page Title *</label>
                        <input
                          type="text"
                          value={gearData.title || ""}
                          onChange={(e) => setGearData({ ...gearData, title: e.target.value })}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-gray-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Page Headline Hook *</label>
                        <input
                          type="text"
                          value={gearData.headline || ""}
                          onChange={(e) => setGearData({ ...gearData, headline: e.target.value })}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Page Description Excerpt *</label>
                      <input
                        type="text"
                        value={gearData.description || ""}
                        onChange={(e) => setGearData({ ...gearData, description: e.target.value })}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-gray-50"
                      />
                    </div>
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleSaveGear(gearData)}
                        disabled={saving || !isDev}
                        className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                        Save Main Info
                      </button>
                    </div>
                  </div>

                  {/* Gear Categories & Items Editor */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Gear Setup Sections</h3>
                    <button
                      onClick={() => {
                        const updatedSections = [...(gearData.sections || [])];
                        const newSectionTitle = prompt("Enter new Section name:") || "";
                        if (!newSectionTitle) return;

                        updatedSections.push({
                          title: newSectionTitle,
                          slug: generateSlug(newSectionTitle),
                          headline: newSectionTitle,
                          description: "Configure this category summary description",
                          items: []
                        });
                        handleSaveGear({ ...gearData, sections: updatedSections });
                      }}
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="size-3.5" /> Add New Section
                    </button>
                  </div>

                  {/* Sections list accordion */}
                  <div className="space-y-4">
                    {gearData.sections?.map((section: any, sIdx: number) => (
                      <div key={section.slug || sIdx} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        {/* Section header */}
                        <div className="bg-gray-50/70 border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-400">Section {String(sIdx + 1).padStart(2, "0")}</span>
                              <input
                                type="text"
                                value={section.title}
                                onChange={(e) => {
                                  const title = e.target.value;
                                  const updatedSections = [...gearData.sections];
                                  updatedSections[sIdx] = { ...section, title, slug: generateSlug(title) };
                                  setGearData({ ...gearData, sections: updatedSections });
                                }}
                                className="font-semibold text-gray-800 text-sm border-b border-dashed border-gray-300 hover:border-gray-500 focus:outline-none bg-transparent py-0 px-1"
                              />
                            </div>
                            <input
                              type="text"
                              value={section.description}
                              onChange={(e) => {
                                const description = e.target.value;
                                const updatedSections = [...gearData.sections];
                                updatedSections[sIdx] = { ...section, description };
                                setGearData({ ...gearData, sections: updatedSections });
                              }}
                              className="text-xs text-gray-400 border-b border-dashed border-gray-200 hover:border-gray-400 focus:outline-none bg-transparent w-full mt-1 py-0 px-1"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const updatedSections = [...gearData.sections];
                                const name = prompt("Enter gear name:") || "";
                                if (!name) return;
                                
                                updatedSections[sIdx].items.push({
                                  name,
                                  slug: generateSlug(name),
                                  headline: "Role or brief headline statement",
                                  description: "Write details or personal review of this gear item",
                                  tag: "Laptop",
                                  url: "",
                                  image: ""
                                });
                                handleSaveGear({ ...gearData, sections: updatedSections });
                              }}
                              className="rounded bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                            >
                              <Plus className="size-3.5" /> Add Item
                            </button>
                            <button
                              onClick={() => {
                                if (!confirm(`Are you sure you want to delete section "${section.title}" and all its gear?`)) return;
                                const updatedSections = gearData.sections.filter((_: any, i: number) => i !== sIdx);
                                handleSaveGear({ ...gearData, sections: updatedSections });
                              }}
                              className="rounded bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Items within section */}
                        <div className="p-6 divide-y divide-gray-100">
                          {section.items?.map((item: any, iIdx: number) => (
                            <div key={item.slug || iIdx} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                              <div className="space-y-1 col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Item Name</label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const name = e.target.value;
                                    const updatedSections = [...gearData.sections];
                                    updatedSections[sIdx].items[iIdx] = { ...item, name, slug: generateSlug(name) };
                                    setGearData({ ...gearData, sections: updatedSections });
                                  }}
                                  className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs font-medium focus:border-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1 col-span-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Role / Kicker</label>
                                  <input
                                    type="text"
                                    placeholder="Tag (e.g. Laptop)"
                                    value={item.tag || ""}
                                    onChange={(e) => {
                                      const tag = e.target.value;
                                      const updatedSections = [...gearData.sections];
                                      updatedSections[sIdx].items[iIdx] = { ...item, tag };
                                      setGearData({ ...gearData, sections: updatedSections });
                                    }}
                                    className="w-20 text-[9px] font-bold text-blue-700 bg-blue-50 px-1 border-b border-dashed border-blue-200 focus:outline-none text-right"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={item.headline}
                                  onChange={(e) => {
                                    const headline = e.target.value;
                                    const updatedSections = [...gearData.sections];
                                    updatedSections[sIdx].items[iIdx] = { ...item, headline };
                                    setGearData({ ...gearData, sections: updatedSections });
                                  }}
                                  className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                                  placeholder="e.g. Primary Work Laptop"
                                />
                              </div>

                              <div className="space-y-1 col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Image URL & Web URL</label>
                                <div className="flex gap-1 mb-1">
                                  <input
                                    type="text"
                                    placeholder="Image: /uploads/macbook.png"
                                    value={item.image || ""}
                                    onChange={(e) => {
                                      const image = e.target.value;
                                      const updatedSections = [...gearData.sections];
                                      updatedSections[sIdx].items[iIdx] = { ...item, image };
                                      setGearData({ ...gearData, sections: updatedSections });
                                    }}
                                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-[10px] focus:border-blue-500 focus:outline-none font-mono"
                                  />
                                  <label className="flex items-center justify-center rounded border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-500 hover:text-gray-800 cursor-pointer shrink-0">
                                    <Upload className="size-3" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={saving || !isDev}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const url = await uploadImageDirectly(file);
                                          if (url) {
                                            const updatedSections = [...gearData.sections];
                                            updatedSections[sIdx].items[iIdx] = { ...item, image: url };
                                            setGearData({ ...gearData, sections: updatedSections });
                                          }
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Affiliate/Web Link"
                                  value={item.url || ""}
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    const updatedSections = [...gearData.sections];
                                    updatedSections[sIdx].items[iIdx] = { ...item, url };
                                    setGearData({ ...gearData, sections: updatedSections });
                                  }}
                                  className="w-full rounded border border-gray-200 px-2 py-1 text-[10px] focus:border-blue-500 focus:outline-none font-mono"
                                />
                              </div>

                              <div className="col-span-1 flex items-start gap-2 pt-5">
                                <textarea
                                  rows={1.5}
                                  placeholder="Personal comment note..."
                                  value={item.description}
                                  onChange={(e) => {
                                    const description = e.target.value;
                                    const updatedSections = [...gearData.sections];
                                    updatedSections[sIdx].items[iIdx] = { ...item, description };
                                    setGearData({ ...gearData, sections: updatedSections });
                                  }}
                                  className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-[11px] focus:border-blue-500 focus:outline-none resize-none leading-normal"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSections = [...gearData.sections];
                                    updatedSections[sIdx].items = updatedSections[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                                    setGearData({ ...gearData, sections: updatedSections });
                                  }}
                                  className="rounded bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {section.items?.length === 0 && (
                            <p className="text-center py-4 text-xs text-gray-400">
                              No items in this section. Add items above to begin list configuration.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {gearData.sections?.length === 0 && (
                      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
                        No sections found. Add a section above to start managing your gear setup catalog.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end border-t border-gray-200 pt-6">
                    <button
                      onClick={() => handleSaveGear(gearData)}
                      disabled={saving || !isDev}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save All Gear Content Sections
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Media Library (Uploads) */}
              {activeTab === "uploads" && (
                <div className="space-y-6">
                  {/* File Upload card widget */}
                  <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50/80 transition relative">
                      <Upload className="size-8 text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-600">Upload new image asset</p>
                      <p className="text-xs text-gray-400 mt-1">Accepts PNG, JPG, JPEG, WEBP files up to 10MB</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        disabled={saving || !isDev}
                        onChange={handleUploadImage}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      {saving && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
                          <Loader2 className="size-6 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Uploaded Files grid list */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Uploaded Assets</h3>
                    <span className="text-xs text-gray-400 font-mono">{uploadList.length} items</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {uploadList.map((file, idx) => (
                      <div key={file.name || idx} className="group rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                        <div className="aspect-square bg-gray-100 flex items-center justify-center p-2 relative overflow-hidden">
                          <img src={file.url} className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300" alt={file.name} />
                        </div>
                        <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex flex-col justify-between">
                          <p className="truncate text-xs font-semibold text-gray-700 font-mono" title={file.name}>{file.name}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="text-[10px] text-gray-400 font-mono">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                            <button
                              onClick={() => handleCopyText(file.url)}
                              className="rounded bg-white border border-gray-200 p-1 text-gray-500 hover:text-gray-800 transition flex items-center gap-1 text-[9px] font-bold"
                            >
                              {copiedText === file.url ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                              Copy path
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {uploadList.length === 0 && (
                      <div className="col-span-4 rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
                        No uploaded image files found. Drag and drop a file above to add to your library.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
