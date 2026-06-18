export interface Project {
  slug: string;
  number: string;
  title: string;
  client: string;
  year: string;
  role: string;
  summary: string;
  description: string;
  tags: string[];
  coverImage: string; // path relative to /public or a placeholder flag
  images: string[];
  link?: string;
  linkLabel?: string;
  caseStudyLink?: string;
}

export const projects: Project[] = [
  {
    slug: "playah",
    number: "01",
    title: "PlayAh! — Brand Growth & Performance",
    client: "PlayAh! Vietnam",
    year: "2024–Present",
    role: "Digital Marketing Specialist",
    summary:
      "Brand campaigns, multi-channel paid media, and community-driven growth for PlayAh!, a leading Vietnamese entertainment platform.",
    description:
      "Planned and executed full-funnel digital campaigns across Meta, TikTok, and Google Ads. Built a data-driven content calendar, optimized for ROAS, and scaled paid acquisition while maintaining brand voice.\n\nKey outcomes include a 3× uplift in monthly active users across social channels and a 40% reduction in cost-per-lead through creative iteration and audience segmentation.\n\nThe work spanned brand strategy, performance media buying, influencer partnerships, and weekly analytics reporting to the leadership team.",
    tags: ["Meta Ads", "TikTok Ads", "Brand Strategy", "Community Growth", "Analytics"],
    coverImage: "/assets/logos/logo-playah.png",
    images: [],
    link: "https://playahvietnam.com/",
    linkLabel: "Visit PlayAh! ↗",
    caseStudyLink: "",
  },
  {
    slug: "workflow-space",
    number: "02",
    title: "WorkFlow Space — Community & Content",
    client: "WorkFlow Space",
    year: "2024–Present",
    role: "Digital Marketing Specialist",
    summary:
      "Content strategy, community building, and organic + paid growth for WorkFlow Space — a premium co-working brand in Ho Chi Minh City.",
    description:
      "Developed a content-first growth strategy combining organic social, SEO blog content, and paid campaigns. Managed a team of freelance content creators, coordinated shoots, and set KPI frameworks tracked weekly.\n\nGrew Instagram from 2,000 to 18,000 followers in 8 months through systematic posting, reel strategy, and community engagement. Ran Google Ads and Meta retargeting to drive workspace bookings.\n\nDeliverables included a brand guide refresh, content playbook, and monthly performance dashboards for stakeholders.",
    tags: ["Content Strategy", "SEO", "Meta Ads", "Google Ads", "Instagram Growth"],
    coverImage: "/assets/logos/logo-workflow.png",
    images: [],
    link: "https://www.workflowspace.vn/",
    linkLabel: "Visit WorkFlow Space ↗",
    caseStudyLink: "",
  },
  {
    slug: "pops-worldwide",
    number: "03",
    title: "POPS Worldwide — SEO & Organic Growth",
    client: "POPS Worldwide",
    year: "2023–2024",
    role: "SEO Executive",
    summary:
      "Organic search strategy and technical SEO for POPS Worldwide — Southeast Asia's largest digital entertainment network.",
    description:
      "Led on-page and technical SEO initiatives across the POPS content platform, targeting competitive keywords in the entertainment vertical. Conducted full site audits, fixed crawl errors, and implemented structured data markup for video content.\n\nBuilt an internal linking strategy that improved crawl depth and boosted average page rank position by 22 spots for target keywords over six months.\n\nCollaborated with content, development, and product teams to ensure SEO best practices were embedded in the publishing workflow.",
    tags: ["Technical SEO", "On-Page SEO", "Structured Data", "Analytics", "Content SEO"],
    coverImage: "/assets/logos/logo-pops.png",
    images: [],
    link: "https://pops.vn/",
    linkLabel: "Visit POPS ↗",
    caseStudyLink: "",
  },
  {
    slug: "pnj",
    number: "04",
    title: "PNJ — E-commerce Campaigns",
    client: "PNJ (Phú Nhuận Jewelry)",
    year: "2022–2023",
    role: "Digital Marketing Specialist",
    summary:
      "Multi-channel paid media and e-commerce performance campaigns for PNJ — Vietnam's largest jewelry retail chain.",
    description:
      "Planned and managed seasonal e-commerce campaigns across Meta Ads, Google Shopping, and Zalo Ads. Coordinated with the creative studio on ad assets and A/B tested landing pages to maximize conversion rate.\n\nDuring peak sale events (Valentine's, 8/3, 20/10), managed daily budgets exceeding 200M VND with ROAS targets consistently exceeded by 15–30%.\n\nDeveloped post-campaign reports with attribution models and recommendations, contributing to a 25% increase in digital revenue YoY.",
    tags: ["Google Shopping", "Meta Ads", "E-commerce", "A/B Testing", "Attribution"],
    coverImage: "/assets/logos/logo-pnj.png",
    images: [],
    link: "https://www.pnj.com.vn/",
    linkLabel: "Visit PNJ ↗",
    caseStudyLink: "",
  },
  {
    slug: "sony-vietnam",
    number: "05",
    title: "Sony Vietnam — Brand Awareness & Lead Gen",
    client: "Sony Vietnam",
    year: "2021–2022",
    role: "Digital Marketing Specialist",
    summary:
      "Brand awareness campaigns and performance lead generation for Sony Vietnam across electronics product lines.",
    description:
      "Supported Sony Vietnam's digital marketing team in planning and executing awareness and lead-gen campaigns for the consumer electronics division. Key categories included audio, cameras, and television product lines.\n\nManaged Meta and Google display campaigns targeting tech-enthusiast segments. Handled creative briefing, media planning, and performance reporting.\n\nInternalized D2C marketing principles and contributed to a cross-channel playbook later adopted as the standard operating procedure for product launch campaigns.",
    tags: ["Meta Ads", "Google Display", "Brand Campaigns", "Lead Generation", "D2C"],
    coverImage: "/assets/logos/logo-sony.png",
    images: [],
    link: "https://www.sony.com.vn/",
    linkLabel: "Visit Sony Vietnam ↗",
    caseStudyLink: "",
  },
];
