"use client";

import { navigate } from "astro:transitions/client";
import {
  AppWindow,
  ArrowUpRight,
  Award,
  Briefcase,
  Calculator,
  Camera,
  Check,
  Copy,
  FileText,
  Film,
  Home,
  Layers,
  Link2,
  Mail,
  Monitor,
  Music,
  PenLine,
  Search,
  TrendingUp,
  User,
} from "lucide-react";
import * as React from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  type CommandSearchItem,
  type SearchItemGroup,
  filterCommandItem,
} from "@/lib/command-search";
import { cn } from "@/lib/utils";

export const COMMAND_SEARCH_OPEN_EVENT = "workspace-command-search:open";
export const COMMAND_SEARCH_TOGGLE_EVENT = "workspace-command-search:toggle";

const CONTACT_EMAIL = "hi@loc.digital";

const GROUP_ORDER: SearchItemGroup[] = [
  "Apps",
  "Navigation",
  "Work",
  "Writing",
  "Growth",
  "Photography",
  "Netflix",
  "Spotify",
];

function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return true;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.platform ?? navigator.userAgent;
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

function closeMobileDrawerIfOpen(): void {
  const sidebar = document.getElementById("dash-sidebar");
  if (!sidebar?.classList.contains("is-open")) return;
  const closeBtn = document.getElementById("dash-drawer-close");
  if (closeBtn instanceof HTMLButtonElement) {
    closeBtn.click();
  }
}

function findVisibleSearchTrigger(): HTMLElement | null {
  const triggers = Array.from(
    document.querySelectorAll<HTMLElement>("[data-command-search-open]"),
  );
  return triggers.find((el) => el.getClientRects().length > 0) ?? null;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function getItemIcon(item: CommandSearchItem) {
  const iconProps = {
    size: 16,
    strokeWidth: 1.9,
    className: "opacity-60",
    "aria-hidden": true as const,
  };

  if (item.group === "Apps") return <AppWindow {...iconProps} />;
  if (item.group === "Work") return <Briefcase {...iconProps} />;
  if (item.group === "Writing") return <FileText {...iconProps} />;
  if (item.group === "Growth") return <TrendingUp {...iconProps} />;
  if (item.group === "Photography") return <Camera {...iconProps} />;
  if (item.group === "Netflix") return <Film {...iconProps} />;
  if (item.group === "Spotify") return <Music {...iconProps} />;

  switch (item.href) {
    case "/":
      return <Home {...iconProps} />;
    case "/about":
      return <User {...iconProps} />;
    case "/work":
      return <Briefcase {...iconProps} />;
    case "/services":
      return <Layers {...iconProps} />;
    case "/writing":
      return <PenLine {...iconProps} />;
    case "/growth":
      return <TrendingUp {...iconProps} />;
    case "/growth/metrics":
      return <Calculator {...iconProps} />;
    case "/photos":
      return <Camera {...iconProps} />;
    case "/gear":
      return <Monitor {...iconProps} />;
    case "/resume":
      return <FileText {...iconProps} />;
    case "/certificates":
      return <Award {...iconProps} />;
    case "/contact":
      return <Mail {...iconProps} />;
    default:
      return <ArrowUpRight {...iconProps} />;
  }
}

export interface CommandSearchTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shortcutLabel?: string;
}

export const CommandSearchTrigger = React.forwardRef<
  HTMLButtonElement,
  CommandSearchTriggerProps
>(({ className, shortcutLabel = "⌘K", onClick, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    data-command-search-open
    className={cn(
      "inline-flex h-9 w-full items-center justify-between rounded-lg border border-solid border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-colors hover:bg-[var(--dash-hover)] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
      className,
    )}
    onClick={(event) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        window.dispatchEvent(new CustomEvent(COMMAND_SEARCH_OPEN_EVENT));
      }
    }}
    {...props}
  >
    <span className="flex grow items-center">
      <Search
        className="-ms-1 me-2.5 text-muted-foreground/80"
        size={15}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className="font-normal text-muted-foreground/80">Search</span>
    </span>
    <kbd
      data-command-key
      className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-solid border-border bg-background px-1.5 font-mono text-[0.65rem] font-medium text-muted-foreground/80"
    >
      {shortcutLabel}
    </kbd>
  </button>
));
CommandSearchTrigger.displayName = "CommandSearchTrigger";

export interface CommandSearchProps {
  items: CommandSearchItem[];
  showTrigger?: boolean;
  triggerClassName?: string;
}

export function CommandSearch(props: CommandSearchProps) {
  const isEmbedded =
    typeof window !== "undefined" &&
    (window.self !== window.top ||
      new URLSearchParams(window.location.search).get("embed") === "1");
  if (isEmbedded) return null;
  return <CommandSearchInner {...props} />;
}

function CommandSearchInner({
  items,
  showTrigger = false,
  triggerClassName,
}: CommandSearchProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [spotlightOpen, setSpotlightOpen] = React.useState(false);
  const [spotlightShowDefaultList, setSpotlightShowDefaultList] = React.useState(false);
  const [popoverSearch, setPopoverSearch] = React.useState("");
  const [spotlightSearch, setSpotlightSearch] = React.useState("");
  const [shortcutLabel, setShortcutLabel] = React.useState("⌘K");
  const [copiedAction, setCopiedAction] = React.useState<"email" | "link" | null>(
    null,
  );

  const anchorRef = React.useRef<HTMLElement | null>(null);
  const popoverInputRef = React.useRef<HTMLInputElement>(null);
  const copiedTimerRef = React.useRef<number | null>(null);

  const groupedItems = React.useMemo(() => {
    const map = new Map<SearchItemGroup, CommandSearchItem[]>();
    for (const group of GROUP_ORDER) {
      map.set(group, []);
    }
    for (const item of items) {
      const list = map.get(item.group);
      if (list) list.push(item);
    }
    return GROUP_ORDER.map((group) => ({
      group,
      items: map.get(group) ?? [],
    })).filter(({ items: list }) => list.length > 0);
  }, [items]);

  const closeAll = React.useCallback(() => {
    setPopoverOpen(false);
    setSpotlightOpen(false);
    setSpotlightShowDefaultList(false);
    setPopoverSearch("");
    setSpotlightSearch("");
    setCopiedAction(null);
  }, []);

  const togglePopoverFromTrigger = React.useCallback((trigger: HTMLElement | null) => {
    closeMobileDrawerIfOpen();

    // On mobile viewports, open the top-anchored Spotlight dialog with default suggestions
    // so the virtual keyboard never clips an anchored popover.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) {
      setPopoverOpen(false);
      setPopoverSearch("");
      setSpotlightShowDefaultList(true);
      setSpotlightOpen((prev) => {
        if (prev) {
          setSpotlightSearch("");
          setCopiedAction(null);
        }
        return !prev;
      });
      return;
    }

    setSpotlightOpen(false);
    setSpotlightShowDefaultList(false);
    setSpotlightSearch("");

    const resolvedTrigger = trigger ?? findVisibleSearchTrigger();
    if (!resolvedTrigger) {
      setSpotlightShowDefaultList(true);
      setSpotlightOpen(true);
      return;
    }

    const isSameAnchor = anchorRef.current === resolvedTrigger;
    anchorRef.current = resolvedTrigger;
    setPopoverOpen((prev) => {
      const next = isSameAnchor ? !prev : true;
      if (!next) {
        setPopoverSearch("");
        setCopiedAction(null);
      }
      return next;
    });
  }, []);

  const handlePopoverOpenChange = React.useCallback((nextOpen: boolean) => {
    setPopoverOpen(nextOpen);
    if (!nextOpen) {
      setPopoverSearch("");
      setCopiedAction(null);
    }
  }, []);

  const handleSpotlightOpenChange = React.useCallback((nextOpen: boolean) => {
    setSpotlightOpen(nextOpen);
    if (!nextOpen) {
      setSpotlightShowDefaultList(false);
      setSpotlightSearch("");
      setCopiedAction(null);
    }
  }, []);

  React.useEffect(() => {
    document
      .querySelectorAll<HTMLElement>("[data-command-search-open]")
      .forEach((trigger) => {
        const expanded = popoverOpen && trigger === anchorRef.current;
        trigger.setAttribute("aria-expanded", String(expanded));
      });
  }, [popoverOpen]);

  React.useEffect(() => {
    const label = isApplePlatform() ? "⌘K" : "Ctrl K";
    setShortcutLabel(label);

    const syncShortcutHints = () => {
      document.querySelectorAll<HTMLElement>("[data-command-key]").forEach((el) => {
        el.textContent = label;
      });
    };

    syncShortcutHints();

    const handleKeyDown = (event: KeyboardEvent) => {
      const isK = event.code === "KeyK" || event.key.toLowerCase() === "k";
      if (isK && (event.metaKey || event.ctrlKey) && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        if (window.self !== window.top) {
          try {
            window.top?.focus();
            window.top?.dispatchEvent(new CustomEvent(COMMAND_SEARCH_TOGGLE_EVENT));
            return;
          } catch {
            // Fall back to local dialog if parent frame is inaccessible.
          }
        }
        setPopoverOpen(false);
        setPopoverSearch("");
        setSpotlightOpen((prev) => {
          if (!prev) closeMobileDrawerIfOpen();
          else setSpotlightSearch("");
          return !prev;
        });
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-command-search-open]");
      if (!trigger) return;
      event.preventDefault();
      togglePopoverFromTrigger(trigger);
    };

    const handleOpenEvent = () => togglePopoverFromTrigger(null);
    const handleToggleEvent = () => {
      setPopoverOpen(false);
      setPopoverSearch("");
      setSpotlightOpen((prev) => {
        if (!prev) closeMobileDrawerIfOpen();
        else setSpotlightSearch("");
        return !prev;
      });
    };
    const handleBeforeSwap = () => closeAll();

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener(COMMAND_SEARCH_OPEN_EVENT, handleOpenEvent);
    window.addEventListener(COMMAND_SEARCH_TOGGLE_EVENT, handleToggleEvent);
    document.addEventListener("astro:before-swap", handleBeforeSwap);
    document.addEventListener("astro:page-load", syncShortcutHints);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener(COMMAND_SEARCH_OPEN_EVENT, handleOpenEvent);
      window.removeEventListener(COMMAND_SEARCH_TOGGLE_EVENT, handleToggleEvent);
      document.removeEventListener("astro:before-swap", handleBeforeSwap);
      document.removeEventListener("astro:page-load", syncShortcutHints);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, [closeAll, togglePopoverFromTrigger]);

  const handleSelectHref = React.useCallback(
    (href: string) => {
      closeAll();

      const currentPath =
        window.location.pathname.length > 1 && window.location.pathname.endsWith("/")
          ? window.location.pathname.slice(0, -1)
          : window.location.pathname;
      const targetPath =
        href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;

      if (currentPath === targetPath) {
        document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Allow Radix overlay/popover to clean up before Astro swaps the DOM.
      window.requestAnimationFrame(() => {
        try {
          void navigate(href);
        } catch {
          window.location.assign(href);
        }
      });
    },
    [closeAll],
  );

  const handleSelectItem = React.useCallback(
    (item: CommandSearchItem) => {
      if (item.appId) {
        closeAll();
        window.requestAnimationFrame(() => {
          window.dispatchEvent(
            new CustomEvent("desktop:open-app", { detail: { id: item.appId } }),
          );
        });
        return;
      }
      handleSelectHref(item.href);
    },
    [closeAll, handleSelectHref],
  );

  const handleCopyAction = React.useCallback(
    async (kind: "email" | "link", value: string) => {
      const ok = await copyText(value);
      if (!ok) return;
      setCopiedAction(kind);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => {
        closeAll();
      }, 650);
    },
    [closeAll],
  );

  const renderResults = () => (
    <>
      <CommandList>
        <CommandEmpty>No results found. Try another title, topic, or place.</CommandEmpty>

        {groupedItems.map((section, sectionIndex) => (
          <React.Fragment key={section.group}>
            {sectionIndex > 0 && <CommandSeparator />}
            <CommandGroup heading={section.group}>
              {section.items.map((item) => {
                const keywords = [
                  item.description,
                  item.group,
                  item.href,
                  ...(item.keywords ? item.keywords.split(/\s+/).filter(Boolean) : []),
                ];
                return (
                  <CommandItem
                    key={`${item.group}:${item.href}:${item.title}`}
                    value={`${item.title} :: ${item.group}:${item.href}`}
                    keywords={keywords}
                    onSelect={() => handleSelectItem(item)}
                  >
                    {getItemIcon(item)}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-[length:var(--text-body-sm)] text-foreground">
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="truncate text-[length:var(--text-body-sm)] text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.8}
                      className="ms-auto shrink-0 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </React.Fragment>
        ))}

        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem
            value="Copy email address :: action:copy-email"
            keywords={["email", "mail", "contact", CONTACT_EMAIL, "clipboard"]}
            onSelect={() => void handleCopyAction("email", CONTACT_EMAIL)}
          >
            {copiedAction === "email" ? (
              <Check
                size={16}
                strokeWidth={2}
                className="text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <Copy
                size={16}
                strokeWidth={1.9}
                className="opacity-60"
                aria-hidden="true"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-[length:var(--text-body-sm)] text-foreground">
                {copiedAction === "email"
                  ? "Copied email to clipboard"
                  : "Copy email address"}
              </span>
              <span className="truncate text-[length:var(--text-body-sm)] text-muted-foreground">
                {CONTACT_EMAIL}
              </span>
            </div>
            <CommandShortcut>Copy</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="Copy current page link :: action:copy-link"
            keywords={["url", "share", "link", "clipboard"]}
            onSelect={() => void handleCopyAction("link", window.location.href)}
          >
            {copiedAction === "link" ? (
              <Check
                size={16}
                strokeWidth={2}
                className="text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <Link2
                size={16}
                strokeWidth={1.9}
                className="opacity-60"
                aria-hidden="true"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-[length:var(--text-body-sm)] text-foreground">
                {copiedAction === "link"
                  ? "Copied link to clipboard"
                  : "Copy current page link"}
              </span>
              <span className="truncate text-[length:var(--text-body-sm)] text-muted-foreground">
                Share this page URL
              </span>
            </div>
            <CommandShortcut>URL</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>

    </>
  );

  const hasSpotlightQuery = spotlightShowDefaultList || spotlightSearch.trim().length > 0;

  return (
    <>
      {showTrigger && (
        <CommandSearchTrigger
          className={triggerClassName}
          shortcutLabel={shortcutLabel}
          onClick={(event) => {
            event.preventDefault();
            togglePopoverFromTrigger(event.currentTarget);
          }}
        />
      )}

      {/* Button-click mode: anchored top-right Popover with suggestions shown normally */}
      <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverAnchor virtualRef={anchorRef} />
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            popoverInputRef.current?.focus();
          }}
          onInteractOutside={(event) => {
            const target = event.target;
            if (target instanceof Element && target.closest("[data-command-search-open]")) {
              event.preventDefault();
            }
          }}
          className="w-[min(calc(100vw-1.5rem),24rem)] overflow-hidden border-input p-0 shadow-xl shadow-black/10"
        >
          <Command
            filter={filterCommandItem}
            loop
            className="command-search-results [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2"
          >
            <CommandInput
              ref={popoverInputRef}
              className="text-[length:var(--text-body-sm)]"
              value={popoverSearch}
              onValueChange={setPopoverSearch}
              placeholder="Search pages, work, writing, photos..."
            />
            {renderResults()}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Ctrl/Cmd + K mode: centered Spotlight modal without default suggestions until typing */}
      <CommandDialog
        open={spotlightOpen}
        onOpenChange={handleSpotlightOpenChange}
        title="Search workspace"
        description="Search pages, case studies, writing, growth playbooks, and photography."
        commandProps={{
          filter: filterCommandItem,
          loop: true,
          className: "command-search-results",
        }}
      >
        <CommandInput
          className="text-[length:var(--text-body-sm)]"
          value={spotlightSearch}
          onValueChange={setSpotlightSearch}
          placeholder="Search pages, work, writing, photos..."
          wrapperClassName={!hasSpotlightQuery ? "border-b-0" : undefined}
        />
        {hasSpotlightQuery &&
          renderResults()}
      </CommandDialog>
    </>
  );
}

export { CommandSearch as Component };
export default CommandSearch;
