export default function AboutHero() {
  return (
    <div className="about-hero-shell">
      <p className="about-kicker">About Loc</p>
      <h1 className="about-hero-title">
        Performance marketer building revenue systems across media, SEO, and automation.
      </h1>
      <div className="about-hero-grid">
        <p className="about-hero-copy">
          Hi, I'm Loc, a Senior Performance Marketing Executive based in Ho Chi
          Minh City. I scale multi-channel paid media across Meta, Google, and
          TikTok, connect creative to conversion, and build AI-powered systems
          that turn marketing spend into measurable growth.
        </p>
        <div className="about-hero-aside" aria-label="Current focus">
          <span>Ho Chi Minh City</span>
          <strong>Performance Senior Executive</strong>
        </div>
      </div>
      <div className="about-hero-actions" aria-label="Contact links">
        <a href="mailto:hi@loc.digital">Email me</a>
        <a href="https://www.linkedin.com/in/phucloc" target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
      </div>
    </div>
  );
}
