import * as React from "react";

export type LogoCloudClient = {
  name: string;
  slug?: string;
  logo?: string;
  tag?: string;
  text?: boolean;
  className?: string;
  nameClassName?: string;
  invertDark?: boolean;
};

export interface CinematicLogoCloudProps {
  clients?: LogoCloudClient[];
  variant?: "grid" | "marquee" | "marquee-named";
  className?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function CinematicLogoCloud({
  clients = [
    { name: "UEH University", tag: "Academic Workshop Partner", logo: "/assets/logos/logo-ueh.png" },
    { name: "Foreign Trade Univ (FTU)", tag: "Campus Community Partner", logo: "/assets/logos/logo-ftu.png" },
    { name: "FPT University", tag: "Career Guidance Partner", logo: "/assets/logos/logo-fpt.svg" },
    { name: "RMIT Vietnam", tag: "Student Community Partner", logo: "/assets/logos/logo-rmit.svg" },
    { name: "ĐH Bách Khoa (HCMUT)", tag: "Tech Community Partner", logo: "/assets/logos/logo-hcmut.svg" },
    { name: "Đại học Văn Lang", tag: "Education & Workshop Partner", logo: "/assets/logos/logo-vlu.png" },
    { name: "Đại học Hoa Sen", tag: "Community Media Partner", logo: "/assets/logos/logo-hsu.png" },
    { name: "Đại học Tôn Đức Thắng", tag: "Academic Outreach Partner", logo: "/assets/logos/logo-tdtu.png" },
  ],
  eyebrow = "ACADEMIC & CAMPUS PARTNERS",
  title = "Trusted by top universities & academic communities",
  description = "Collaborating with leading universities across Vietnam for workshops, career orientation, and student community building.",
}: CinematicLogoCloudProps) {
  return (
    <section className="trust-by-section toki-r" id="trusted-by">
      <div className="trust-by-header">
        <span className="trust-by-eyebrow">{eyebrow}</span>
        <h2 className="trust-by-title">{title}</h2>
        {description && <p className="trust-by-desc">{description}</p>}
      </div>

      <div className="trust-by-marquee-wrapper" aria-hidden="true">
        <div className="trust-by-marquee-track">
          {[...clients, ...clients, ...clients, ...clients].map((client, idx) => (
            <div key={`${client.name}-${idx}`} className="trust-by-pill">
              {client.logo ? (
                <img src={client.logo} alt={client.name} className="trust-by-pill-logo" loading="eager" decoding="async" />
              ) : (
                <img src={`https://cdn.simpleicons.org/${client.slug}`} alt={client.name} className="trust-by-pill-logo dark:invert" loading="eager" decoding="async" />
              )}
              <span className="trust-by-pill-name">{client.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CinematicLogoCloud;
