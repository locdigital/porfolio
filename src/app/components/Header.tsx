'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const desktopNavItems = [
  {
    label: "Work",
    href: "/work",
    match: "/work",
    color: "#F09049",
    icon: (
      <>
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <rect width="20" height="14" x="2" y="6" rx="2" />
      </>
    ),
  },
  {
    label: "Services",
    href: "/service",
    match: "/service",
    color: "#2AA7C9",
    icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  },
  {
    label: "Writing",
    href: "/blog",
    match: "/blog",
    color: "#509B98",
    icon: (
      <>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </>
    ),
  },
  {
    label: "Gear",
    href: "/gear",
    match: "/gear",
    color: "#F4B542",
    icon: (
      <>
        <rect width="18" height="12" x="3" y="4" rx="2" ry="2" />
        <line x1="2" x2="22" y1="20" y2="20" />
        <line x1="5" x2="19" y1="16" y2="16" />
      </>
    ),
  },
  {
    label: "Photos",
    href: "/photos",
    match: ["/photos", "/gallery"],
    color: "#387DE0",
    icon: (
      <>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
  },
];

const navColorStyle = (color: string) => ({
  "--nav-color": color,
}) as CSSProperties;

export default function Header() {
  const pathname = usePathname();

  const isHidden = pathname.startsWith('/cms') || pathname === '/login' || pathname === '/404';

  if (isHidden) {
    return null;
  }

  const isActive = (match: string | string[]) => {
    if (Array.isArray(match)) {
      return match.some((path) => pathname.startsWith(path));
    }
    return pathname.startsWith(match);
  };

  const isPhotos = pathname.startsWith('/photos');
  const isGallery = pathname.startsWith('/gallery');
  const headerClass = `${isPhotos ? 'absolute-header' : ''} ${isGallery ? 'gallery-glass-header' : ''}`.trim();

  return (
    <>
      <header id="site-header" className={headerClass}>
        <div className="header-inner">
          <Link href="/" className="header-logo" aria-label="Phuc Loc Nguyen, back to home">
            <span className="logo-circle"></span>
          </Link>

          <div className="header-nav-desktop">
            <nav className="header-menu" aria-label="Primary navigation">
              <ul>
                {desktopNavItems.map((item) => {
                  const active = isActive(item.match);
                  return (
                    <li key={item.label}>
                      <Link href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined} style={navColorStyle(item.color)}>
                        <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          {item.icon}
                        </svg>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <ul className="mobile-bottom-nav-list">
          {desktopNavItems.map((item) => {
            const active = isActive(item.match);
            return (
              <li key={item.label}>
                <Link href={item.href} className={active ? 'active' : ''} aria-label={item.label} style={navColorStyle(item.color)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                    {item.icon}
                  </svg>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
