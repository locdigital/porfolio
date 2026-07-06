import { optimizePhotos, getPhotoAsset } from "@/lib/photo-assets";
import DraggableCollage from "@/components/ui/draggable-collage";
import MobileAboutPanel from "@/components/ui/MobileAboutPanel";
import AnimatedPageHeadline from "@/components/ui/animated-page-headline";
import BentoInfiniteGallery from "@/components/ui/bento-infinite-gallery";
import ClickBlurGroup from "@/components/ui/click-blur-group";
import ScrollBlurList from "@/components/ui/scroll-blur-list";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import Link from "next/link";
import React from "react";

const makePortfolioPhoto = (number: number) => ({
  src: `/assets/photos/img-portfolio/photo-${number}.webp`,
  alt: `Photo ${number}`,
  w: 0,
  h: 0,
});

export default async function Page() {
  const homeBentoPhotos = await optimizePhotos(
    Array.from({ length: 20 }, (_, index) => index + 1).map(makePortfolioPhoto),
    {
      previewWidth: 960,
      previewWidths: [320, 480, 720, 960, 1200],
      previewSizes: "(max-width: 760px) 76vw, 32rem",
      fullWidth: 1920,
      fullQuality: 80,
      withWebpFallback: false,
    },
  );

  const homeBentoItems = homeBentoPhotos.map((photo, index) => {
    const spanCycle = [
      "hero",
      "standard",
      "standard",
      "tall",
      "wide",
      "standard",
      "tall",
      "standard",
      "wide",
      "standard",
      "standard",
      "tall",
      "wide",
      "standard",
      "standard",
      "hero",
      "standard",
      "wide",
      "tall",
      "standard",
    ] as const;
    
    const titles = [
      "Sea Light",
      "Blue Distance",
      "Quiet Coast",
      "Cliff Walk",
      "Island Wind",
      "Green Shore",
      "Open Water",
      "Late Horizon",
      "Rock Garden",
      "Soft Morning",
      "Salt Air",
      "Low Tide",
      "Blue Ridge",
      "Hidden Bay",
      "Green Path",
      "Wide Sky",
      "Still Water",
      "Island Edge",
      "Far Shore",
      "Sun Drift",
    ];

    return {
      id: index + 1,
      title: titles[index] ?? `Photo ${index + 1}`,
      desc: "A frame from my travel archive.",
      url: photo.previewSrc,
      fullUrl: photo.fullSrc,
      span: spanCycle[index] ?? "standard",
    };
  });

  const heroAbout = getPhotoAsset("/assets/photos/img-portfolio/hero-about.webp");
  
  const pageTitle = "Nguyen Phuc Loc | Senior Performance Marketing Executive";
  const pageDescription = "Senior Performance Marketing Executive scaling multi-channel paid media, TikTok Shop GMV, SEO growth, and AI-powered conversion funnels.";
  
  const jsonLd = safeJsonLd([
    pageSchema({
      url: absoluteUrl("/"),
      title: pageTitle,
      description: pageDescription,
      type: "ProfilePage",
    }),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl("/")}#selected-work`,
      name: "Selected work experience",
      itemListElement: [
        "WorkFlow Space",
        "PlayAh! Vietnam",
        "POPS Worldwide",
        "TOMATO Children's Home",
      ].map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
      })),
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <main style={{ display: 'flex', flexDirection: 'column' }}>

        {/* HERO ------------------------------------ */}
        <section className="hero" id="hero" aria-label="Introduction">
          <div className="container hero-container">
            <div className="hero-layout">
              <AnimatedPageHeadline
                className="hero-title hero-title--animated"
                headline={"Phuc Loc Nguyen — paid media, SEO, TikTok Shop & <em>growth systems that turn attention into revenue.</em>"}
              />
            </div>
          </div>
        </section>

        {/* EXPERIENCE ------------------------------ */}
        <section className="work toki-r" id="work" data-d="2" aria-label="Work experience">
          <div className="container">
            <div className="sh">
              <span className="sh-title" data-parallax=".1">Experience</span>
              <span className="sh-number" data-parallax=".3">01</span>
            </div>

            <ClickBlurGroup className="experience-click-blur" itemSelector=".timeline-row">
            <ScrollBlurList>
              <ul>
                <li className="timeline-row">
                  <div className="tl-left">
                    <div className="tl-logo" aria-hidden="true">
                      <img src="/assets/logos/logo-workflow.webp" alt="WorkFlow Space" loading="lazy" />
                    </div>
                    <div className="tl-info">
                      <span className="tl-company">
                        <a href="https://www.workflowspace.vn/" target="_blank" rel="noopener noreferrer">
                          WorkFlow Space
                        </a>
                      </span>
                      <span className="tl-desc">Digital Marketing Executive: paid launches, leads &amp; creative systems.</span>
                    </div>
                  </div>
                  <span className="tl-dates">2024-Present</span>
                </li>
                <li className="timeline-row">
                  <div className="tl-left">
                    <div className="tl-logo" aria-hidden="true">
                      <img src="/assets/logos/logo-playah.webp" alt="PlayAh!" loading="lazy" />
                    </div>
                    <div className="tl-info">
                      <span className="tl-company">
                        <a href="https://playahvietnam.com/" target="_blank" rel="noopener noreferrer">
                          PlayAh!
                        </a>
                      </span>
                      <span className="tl-desc">Performance Senior Executive: TikTok, Meta &amp; Google revenue growth.</span>
                    </div>
                  </div>
                  <span className="tl-dates">Dec 2024-Present</span>
                </li>
                <li className="timeline-row">
                  <div className="tl-left">
                    <div className="tl-logo" aria-hidden="true">
                      <img src="/assets/logos/logo-pops.webp" alt="POPS Worldwide" loading="lazy" />
                    </div>
                    <div className="tl-info">
                      <span className="tl-company">
                        <a href="https://pops.vn/" target="_blank" rel="noopener noreferrer">
                          POPS Worldwide
                        </a>
                      </span>
                      <span className="tl-desc">SEO Executive: technical roadmap &amp; organic user growth.</span>
                    </div>
                  </div>
                  <span className="tl-dates">2022-2023</span>
                </li>
                <li className="timeline-row">
                  <div className="tl-left">
                    <div className="tl-logo" aria-hidden="true">
                      <img src="/assets/logos/logo-tomato.webp" alt="TOMATO Children's Home" loading="lazy" />
                    </div>
                    <div className="tl-info">
                      <span className="tl-company">
                        <Link href="/work/tomato-childrens-home">
                          TOMATO Children's Home
                        </Link>
                      </span>
                      <span className="tl-desc">Digital Marketing Executive: integrated Marketing 360 &amp; enrollment growth.</span>
                    </div>
                  </div>
                  <span className="tl-dates">2023-2024</span>
                </li>
              </ul>
            </ScrollBlurList>
            </ClickBlurGroup>
          </div>
        </section>

        {/* PHOTOGRAPHY ----------------------------- */}
        <BentoInfiniteGallery
          id="photography"
          kicker="Photography"
          showIntro={false}
          showSectionHeader={true}
          sectionNumber="02"
          items={homeBentoItems}
        />

        {/* PLAYGROUND ------------------------------ */}
        <section className="relative w-full h-auto md:h-[100dvh] overflow-visible md:overflow-hidden toki-r" data-d="5" aria-label="Interactive collage">
          <MobileAboutPanel portraitSrc={heroAbout.src} />
          <div className="hidden md:block h-full w-full">
            <DraggableCollage portraitSrc={heroAbout.src} />
          </div>
        </section>

      </main>
    </>
  );
}
