import { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Globe,
  FileText,
  Search,
  Clock,
  BookOpen,
} from "lucide-react";
import type { Post, PostStatus } from "../../lib/writing/posts";
import DeleteConfirmDialog from "../ui/DeleteConfirmDialog";

interface WritingDashboardProps {
  initialPosts: Post[];
}

const statusConfig: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "badge-draft" },
  published: { label: "Published", className: "badge-published" },
  archived: { label: "Archived", className: "badge-archived" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WritingDashboard({ initialPosts }: WritingDashboardProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null);

  const filtered = posts.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    published: posts.filter((p) => p.status === "published").length,
    archived: posts.filter((p) => p.status === "archived").length,
  };

  async function handleNewPost() {
    setCreating(true);
    try {
      const res = await fetch("/api/writing/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "Untitled", status: "draft" }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/cms/writing/${data.data.id}/edit`;
      }
    } catch {
      setCreating(false);
    }
  }

  function requestDelete(id: string, title: string) {
    setPostToDelete({ id, title });
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!postToDelete) return;
    setDeletingId(postToDelete.id);
    setDeleteDialogOpen(false);
    try {
      await fetch(`/api/writing/posts/${postToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
    } finally {
      setDeletingId(null);
      setPostToDelete(null);
    }
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Writing</h1>
          <p className="dashboard-subtitle">Manage your blog posts</p>
        </div>
        <div className="dashboard-header-actions">
          <a
            className="topbar-btn topbar-btn-secondary"
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View public blog page"
          >
            <Globe size={15} />
            <span>View blog</span>
          </a>
          <button
            className="topbar-btn topbar-btn-primary"
            onClick={handleNewPost}
            disabled={creating}
            aria-label="Create new post"
          >
            <Plus size={16} />
            <span>{creating ? "Creating..." : "New Post"}</span>
          </button>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="dashboard-toolbar">
        <div className="dashboard-filters">
          {(["all", "draft", "published", "archived"] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? " filter-btn-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : statusConfig[f].label}
              <span className="filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="dashboard-search-wrap">
          <Search size={14} className="dashboard-search-icon" />
          <input
            type="text"
            className="dashboard-search"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search posts"
          />
        </div>
      </div>

      {/* Posts table */}
      {filtered.length === 0 ? (
        <div className="dashboard-empty">
          <BookOpen size={40} className="dashboard-empty-icon" />
          <p className="dashboard-empty-title">
            {search ? "No posts found" : "No posts yet"}
          </p>
          <p className="dashboard-empty-sub">
            {search ? "Try a different search term" : "Create your first post to get started"}
          </p>
          {!search && (
            <button
              className="topbar-btn topbar-btn-primary"
              onClick={handleNewPost}
              disabled={creating}
            >
              <Plus size={15} />
              <span>New Post</span>
            </button>
          )}
        </div>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Words</th>
                <th>Updated</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id} className="dashboard-row">
                  <td className="dashboard-cell-title">
                    <div className="post-title-wrap">
                      <a
                        href={`/cms/writing/${post.id}/edit`}
                        className="post-title-link"
                      >
                        {post.title || "Untitled"}
                      </a>
                      {post.focusKeyword && (
                        <span className="post-keyword">{post.focusKeyword}</span>
                      )}
                    </div>
                    <span className="post-slug">/blog/{post.slug}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusConfig[post.status].className}`}>
                      {statusConfig[post.status].label}
                    </span>
                  </td>
                  <td className="dashboard-cell-meta">
                    {post.wordCount > 0 ? (
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {post.wordCount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="dashboard-cell-meta">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(post.updatedAt)}
                    </span>
                  </td>
                  <td className="dashboard-cell-meta">
                    {post.publishedAt ? (
                      <span className="flex items-center gap-1">
                        <Globe size={12} />
                        {formatDate(post.publishedAt)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td>
                    <div className="dashboard-actions">
                      <a
                        href={`/cms/writing/${post.id}/edit`}
                        className="action-btn"
                        aria-label={`Edit ${post.title}`}
                      >
                        <Edit3 size={14} />
                      </a>
                      <a
                        href={post.slug ? `/blog/${post.slug}` : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`action-btn${post.slug ? "" : " action-btn-disabled"}`}
                        aria-label={`View public page for ${post.title}`}
                        title={post.slug ? "View public page" : "Add a slug before opening the public page"}
                      >
                        <Globe size={14} />
                      </a>
                      <button
                        className="action-btn action-btn-danger"
                        onClick={() => requestDelete(post.id, post.title)}
                        disabled={deletingId === post.id}
                        aria-label={`Delete ${post.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Are you sure?"
        description={`Are you sure you want to delete "${postToDelete?.title || "this item"}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteDialogOpen(false); setPostToDelete(null); }}
        loading={deletingId !== null}
      />
    </div>
  );
}
