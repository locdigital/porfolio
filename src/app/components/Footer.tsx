'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  const isHidden = pathname.startsWith('/cms') || pathname === '/login' || pathname === '/404' || pathname.startsWith('/gallery');

  if (isHidden) {
    return null;
  }

  return (
    <>
      <div className="footer-divider"></div>
      <div className="container">
        <footer className="footer" aria-label="Footer">
          <div className="footer-contact">
            <span className="footer-contact-label">Let's connect.</span>
            <button className="email-copy" id="copy-email" aria-label="Copy email address" data-tip="Copy">
              hi@loc.digital
            </button>
          </div>
          <ul className="footer-links">
            <li>
              <a href="https://www.instagram.com/henrygoodkid" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                Instagram ↗
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/phucloc" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                LinkedIn ↗
              </a>
            </li>
            <li>
              <a href="https://www.pexels.com/@henrygoodkid" target="_blank" rel="noopener noreferrer" aria-label="Pexels">
                Pexels ↗
              </a>
            </li>
          </ul>
        </footer>
        <div className="colophon">
          <span>© 2026 Phuc Loc Nguyen</span>
          <span>Next.js / Static HTML / WCAG 2.2 AA</span>
        </div>
      </div>
    </>
  );
}
