"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

export interface CertificateItem {
  id: string;
  type: "professional-certificate" | "specialization" | "course";
  title: string;
  issuer: string;
  year: string;
  category: string;
  description: string;
  credentialId?: string;
  verifyUrl?: string;
  logo?: string;
  skills: string[];
}

const CERTIFICATES_DATA: CertificateItem[] = [
  {
    id: "google-digital-marketing-ecommerce",
    type: "professional-certificate",
    title: "Google Digital Marketing & E-commerce Professional Certificate",
    issuer: "Google Career Certificates / Coursera",
    year: "Coursera",
    category: "Digital Marketing & E-commerce",
    description:
      "A career certificate covering search, email, analytics, e-commerce stores, customer loyalty, and marketing performance reporting.",
    verifyUrl: "https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce",
    skills: ["Google Ads", "SEO", "E-commerce", "Performance Measurement"],
  },
  {
    id: "meta-social-media-marketing",
    type: "professional-certificate",
    title: "Meta Social Media Marketing Professional Certificate",
    issuer: "Meta / Coursera",
    year: "Coursera",
    category: "Social Media Marketing",
    description:
      "A six-course program for social presence, content planning, Meta Ads Manager campaigns, analytics, and campaign optimization.",
    verifyUrl: "https://www.coursera.org/professional-certificates/facebook-social-media-marketing",
    skills: ["Meta Ads Manager", "Paid Media", "Social Analytics", "Campaign Management"],
  },
  {
    id: "meta-marketing-analytics",
    type: "professional-certificate",
    title: "Meta Marketing Analytics Professional Certificate",
    issuer: "Meta / Coursera",
    year: "Coursera",
    category: "Marketing Analytics",
    description:
      "A job-ready path for marketing measurement, data analysis, Meta Ads Manager reporting, statistics, and marketing science.",
    verifyUrl: "https://www.coursera.org/professional-certificates/facebook-marketing-analytics",
    skills: ["Marketing Analytics", "Data Analysis", "Meta Ads Manager", "Statistics"],
  },
  {
    id: "seo-uc-davis",
    type: "specialization",
    title: "Search Engine Optimization (SEO) Specialization",
    issuer: "University of California, Davis / Coursera",
    year: "Coursera",
    category: "Search Engine Optimization",
    description:
      "A five-course specialization for search algorithms, on-page and off-page SEO, audits, local/international SEO, and strategy.",
    verifyUrl: "https://www.coursera.org/specializations/seo",
    skills: ["SEO Audits", "Content Strategy", "Web Analytics", "Competitive Analysis"],
  },
  {
    id: "coursera-social-media-marketing",
    type: "professional-certificate",
    title: "Social Media Marketing Professional Certificate",
    issuer: "Coursera",
    year: "Coursera",
    category: "Social Media & AI Campaigns",
    description:
      "A compact certificate path around generative AI, content production, Meta Ads Manager, ManyChat automation, and performance analysis.",
    verifyUrl: "https://www.coursera.org/professional-certificates/coursera-social-media-marketing",
    skills: ["Generative AI", "Content Creation", "Marketing Automation", "Social Analytics"],
  },
  {
    id: "marketing-analytics-foundation",
    type: "course",
    title: "Marketing Analytics Foundation",
    issuer: "Meta / Coursera",
    year: "Coursera",
    category: "Analytics Foundation",
    description:
      "A foundational course for marketing data, Meta pixel concepts, API/offline data flow, Google Analytics, and reporting context.",
    verifyUrl: "https://www.coursera.org/learn/marketing-analytics-foundation",
    skills: ["Google Analytics", "Data Collection", "Web Analytics", "Meta Pixel"],
  },
  {
    id: "ai-for-marketing",
    type: "course",
    title: "AI for Marketing",
    issuer: "AI CERTs / Coursera",
    year: "Coursera",
    category: "AI Marketing",
    description:
      "A practical course for applying AI to campaign optimization, audience targeting, content workflows, performance analytics, and ROI.",
    verifyUrl: "https://www.coursera.org/learn/ai-for-marketing",
    skills: ["AI Workflows", "Campaign Optimization", "Marketing Analytics", "Automation"],
  },
];

const tabs = [
  { id: "all", label: "All", countKey: "all" },
  { id: "professional-certificates", label: "Professional", countKey: "professionalCertificates" },
  { id: "specializations", label: "Specializations", countKey: "specializations" },
  { id: "courses", label: "Courses", countKey: "courses" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function CertificatesGallery() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<CertificateItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedItem(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItem]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return CERTIFICATES_DATA.filter((item) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "professional-certificates" && item.type === "professional-certificate") ||
        (activeTab === "specializations" && item.type === "specialization") ||
        (activeTab === "courses" && item.type === "course");

      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.issuer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.skills.some((skill) => skill.toLowerCase().includes(query)) ||
        (item.credentialId && item.credentialId.toLowerCase().includes(query));

      return matchesTab && matchesQuery;
    });
  }, [activeTab, searchQuery]);

  const counts = useMemo(
    () => ({
      all: CERTIFICATES_DATA.length,
      professionalCertificates: CERTIFICATES_DATA.filter((item) => item.type === "professional-certificate").length,
      specializations: CERTIFICATES_DATA.filter((item) => item.type === "specialization").length,
      courses: CERTIFICATES_DATA.filter((item) => item.type === "course").length,
    }),
    [],
  );

  return (
    <div className="cert-gallery">
      <div className="cert-gallery-head">
        <div>
          <span>Credential archive</span>
          <h2>Coursera only, no extra noise.</h2>
        </div>
        <p>
          Search by program, skill, or issuing partner. Every item links back to its Coursera source.
        </p>
      </div>

      <div className="cert-toolbar">
        <div className="cert-tabs" aria-label="Credential categories">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : undefined}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <strong>{counts[tab.countKey]}</strong>
            </button>
          ))}
        </div>

        <div className="cert-search">
          <Search aria-hidden="true" />
          <label htmlFor="certificates-search" className="sr-only">Search credentials</label>
          <input
            id="certificates-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search credentials, skills..."
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="cert-list">
          {filteredItems.map((item, index) => (
            <article
              key={item.id}
              className="cert-row"
            >
              <button type="button" onClick={() => setSelectedItem(item)}>
                <span className="cert-row-index">{String(index + 1).padStart(2, "0")}</span>

                <div className="cert-row-copy">
                  <span className="cert-row-category">{item.category}</span>
                  <h3>{item.title}</h3>
                  <strong>{item.issuer}</strong>
                  <p>{item.description}</p>
                </div>

                <div className="cert-row-skills" aria-label="Validated skills">
                  {item.skills.slice(0, 4).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>

                <div className="cert-row-action">
                  <span>{item.year}</span>
                  <span>
                    Details
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                </div>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="cert-empty">
          <ShieldAlert aria-hidden="true" />
          <h3>No matching credentials found</h3>
          <p>Try a broader keyword or reset the filters to see the full archive.</p>
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSearchQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      )}

      {selectedItem && isMounted && createPortal(
        <div className="cert-modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="cert-modal" role="dialog" aria-modal="true" aria-labelledby="cert-modal-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="cert-modal-close" onClick={() => setSelectedItem(null)} aria-label="Close details">
              <X aria-hidden="true" />
            </button>

            <div className="cert-modal-header">
              <div className="cert-modal-mark" aria-hidden="true">C</div>
              <div>
                <div className="cert-modal-kicker">
                  <span>{selectedItem.category}</span>
                  <span>{selectedItem.year}</span>
                </div>
                <h2 id="cert-modal-title">{selectedItem.title}</h2>
                <p className="cert-modal-issuer">Issued by {selectedItem.issuer}</p>
              </div>
            </div>

            <div className="cert-modal-section">
              <span>Verification summary</span>
              <p>{selectedItem.description}</p>
            </div>

            <div className="cert-modal-section">
              <span>Validated scope</span>
              <div className="cert-modal-skills">
                {selectedItem.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="cert-modal-status">
              <span>Source status</span>
              <strong>
                <CheckCircle2 aria-hidden="true" />
                Coursera source available
              </strong>
              {selectedItem.credentialId && <small>{selectedItem.credentialId}</small>}
            </div>

            <div className="cert-modal-actions">
              <button type="button" onClick={() => setSelectedItem(null)}>
                Close
              </button>
              {selectedItem.verifyUrl && (
                <a href={selectedItem.verifyUrl} target="_blank" rel="noopener noreferrer">
                  Verify source
                  <ExternalLink aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
