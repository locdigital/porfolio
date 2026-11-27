export interface UiCopy {
  siteName: string;
  authorName: string;
  workspaceTitle: string;
  photosWindowTitle: string;
  workspaceMeta: string;
  mobileBackToPhotos: string;
  mobileBackToWorkspace: string;
  openNavMenu: string;
  closeNavMenu: string;
  navAriaLabel: string;
  navPagesAriaLabel: string;
  homeAriaLabel: string;
  breadcrumbsAriaLabel: string;
  footerAriaLabel: string;
  footerCopyright: (year: number) => string;
  footerPrivacyLink: string;
  footerResumeLink: string;
  openApp: (appLabel: string) => string;
  windowControls: {
    titleBarAria: string;
    controlsAria: string;
    close: (appLabel: string) => string;
    minimize: (appLabel: string) => string;
    restore: (appLabel: string) => string;
    maximize: (appLabel: string) => string;
    restoreSize: string;
  };
  nav: {
    workspaceGroup: string;
    personalGroup: string;
    overview: string;
    about: string;
    work: string;
    services: string;
    writing: string;
    growth: string;
    gear: string;
    resume: string;
    privacy: string;
    photos: string;
  };
  search: {
    triggerLabel: string;
    placeholder: string;
    dialogTitle: string;
    dialogDescription: string;
    empty: string;
    quickActionsHeading: string;
    copyEmail: string;
    copiedEmail: string;
    copyLink: string;
    copiedLink: string;
    sharePageUrl: string;
    copyShortcut: string;
    groups: {
      Apps: string;
      Navigation: string;
      Work: string;
      Writing: string;
      Growth: string;
      Photography: string;
      Netflix: string;
      Spotify: string;
    };
    navDescriptions: {
      overview: string;
      about: string;
      work: string;
      services: string;
      writing: string;
      growth: string;
      metrics: string;
      gear: string;
      resume: string;
      privacy: string;
    };
    appDescriptions: {
      workspace: string;
      photos: (count: number) => string;
      spotify: string;
      netflix: string;
    };
  };
  desktop: {
    dockAria: string;
    pinMode: string;
    exitPinMode: string;
    pinShort: string;
    exitPinShort: string;
    switcher: string;
    shortcuts: string;
    shortcutsTitle: string;
    shortcutsBack: string;
    shortcutList: {
      search: string;
      nextApp: string;
      prevApp: string;
      switcherMove: string;
      switcherOpen: string;
      escape: string;
    };
    closeAll: string;
    open: string;
    quit: string;
    switcherAria: string;
    switchTo: (name: string) => string;
    switcherHint: string;
    moveResize: string;
    fillArrange: string;
    tilingAria: string;
    tileLabels: Record<string, string>;
    appTitles: {
      netflix: string;
      spotify: string;
      photos: string;
      workspace: string;
      photoshop: string;
    };
  };
  passGate: {
    title: string;
    description: string;
    inputLabel: string;
    placeholder: string;
    buttonLabel: string;
    checkingLabel: string;
    successLabel: string;
    errorMessage: string;
  };
  beforeAfter: {
    sliderAria: string;
    before: string;
    after: string;
  };
  photosUi: {
    pageTitle: string;
    seoTitle: string;
    seoDescription: (count: number) => string;
    toolbarAria: string;
    toggleSidebar: string;
    thumbnailSizeAria: string;
    smallerThumbnails: string;
    largerThumbnails: string;
    gridColumnsAria: string;
    timeViewAria: string;
    years: string;
    months: string;
    allPhotos: string;
    showInfo: string;
    searchPlaceholder: string;
    searchAria: string;
    sidebarAria: string;
    sectionPhotos: string;
    library: string;
    map: string;
    sectionCollections: string;
    trips: string;
    featured: string;
    albums: string;
    sectionRegions: string;
    regionLabels: Record<string, string>;
    subheading: (count: number) => string;
    filterBy: string;
    allItems: string;
    filterMenuAria: string;
    emptyMsg: string;
    showAllPhotos: string;
    tripUnit: (n: number) => string;
    photoCount: (n: number) => string;
    albumMeta: (count: number, region: string) => string;
    loadingMap: string;
    tryAgain: string;
    closePreview: string;
    openAlbum: string;
    legal: string;
    mapControlsAria: string;
    zoomOut: string;
    zoomIn: string;
    resetView: string;
    footerSummary: (photos: number, destinations: number) => string;
    footerGear: string;
    detail: {
      breadcrumbPhotos: string;
      flipHint: string;
      photoNotes: string;
      date: string;
      time: string;
      place: string;
      frame: string;
      story: string;
      storyComingSoon: string;
      notUpdated: string;
      tapToFlip: string;
      scrollToRead: string;
      flipAria: (title: string) => string;
      region: string;
      bestSeason: string;
      recommendedStay: string;
      budgetNote: string;
      wouldReturn: string;
      gallery: string;
      updated: string;
      fieldNotesKicker: string;
      fieldNotesHeading: (place: string) => string;
      favoriteDetails: string;
      whatIWouldDoAgain: string;
      whoItSuits: string;
      lessIdealIf: string;
      practicalLogistics: string;
      gettingThere: string;
      gettingAround: string;
      bestLightTiming: string;
      crowds: string;
      difficulty: string;
      weatherNote: string;
      journalKicker: string;
      historyHeading: string;
      perspectiveHeading: string;
      highlightsHeading: string;
      photoTipsHeading: string;
      sourcesHeading: string;
      relatedHeading: string;
      allGalleries: (count: number) => string;
      crowdLabels: Record<string, string>;
      difficultyLabels: Record<string, string>;
      wouldReturnLabels: Record<string, string>;
      fallbackIntro: (photoCount: number, place: string, country: string, totalLocations: number) => {
        beforePhotosLink: string;
        photosLinkText: string;
        betweenLinks: string;
        contactLinkText: string;
        afterContactLink: string;
      };
    };
  };
}

export const UI_COPY: UiCopy = {
  siteName: "Phuc Loc Nguyen — Workspace",
  authorName: "Phuc Loc Nguyen",
  workspaceTitle: "Phuc Loc Nguyen — Workspace",
  photosWindowTitle: "Photos — Photography",
  workspaceMeta: "Personal workspace",
  mobileBackToPhotos: "Back to Photos library",
  mobileBackToWorkspace: "Back to Workspace",
  openNavMenu: "Open navigation menu",
  closeNavMenu: "Close navigation menu",
  navAriaLabel: "Workspace Navigation",
  navPagesAriaLabel: "Workspace Pages",
  homeAriaLabel: "Phuc Loc Nguyen Home",
  breadcrumbsAriaLabel: "Breadcrumbs",
  footerAriaLabel: "Footer",
  footerCopyright: (year) => `© ${year} Phuc Loc Nguyen.`,
  footerPrivacyLink: "Privacy",
  footerResumeLink: "Resume",
  openApp: (appLabel) => `Open ${appLabel}`,
  windowControls: {
    titleBarAria: "Application Window Title Bar",
    controlsAria: "Window controls",
    close: (appLabel) => `Close ${appLabel}`,
    minimize: (appLabel) => `Minimize ${appLabel}`,
    restore: (appLabel) => `Restore ${appLabel}`,
    maximize: (appLabel) => `Maximize ${appLabel}`,
    restoreSize: "Restore window size",
  },
  nav: {
    workspaceGroup: "Workspace",
    personalGroup: "Personal",
    overview: "Overview",
    about: "About",
    work: "Work",
    services: "Services",
    writing: "Writing",
    growth: "Growth Hub",
    gear: "Gear",
    resume: "Resume",
    privacy: "Privacy",
    photos: "Photos",
  },
  search: {
    triggerLabel: "Search",
    placeholder: "Search pages, work, writing, photos...",
    dialogTitle: "Search workspace",
    dialogDescription: "Search pages, case studies, writing, growth playbooks, and photography.",
    empty: "No results found. Try another title, topic, or place.",
    quickActionsHeading: "Quick actions",
    copyEmail: "Copy email address",
    copiedEmail: "Copied email to clipboard",
    copyLink: "Copy current page link",
    copiedLink: "Copied link to clipboard",
    sharePageUrl: "Share this page URL",
    copyShortcut: "Copy",
    groups: {
      Apps: "Apps",
      Navigation: "Navigation",
      Work: "Work",
      Writing: "Writing",
      Growth: "Growth",
      Photography: "Photography",
      Netflix: "Netflix",
      Spotify: "Spotify",
    },
    navDescriptions: {
      overview: "Phuc Loc Nguyen's personal workspace",
      about: "Background, experience, and approach",
      work: "Selected performance marketing case studies",
      services: "Growth and performance marketing services",
      writing: "Essays, notes, and field observations",
      growth: "Playbooks, systems, and marketing formulas",
      metrics: "ROAS, MER, CAC, CVR, AOV, and contribution profit",
      gear: "Cameras, computers, and everyday tools",
      resume: "Education, chronological experience, and skill clusters",
      privacy: "How browsing data, storage, and contact inquiries are handled",
    },
    appDescriptions: {
      workspace: "Open Phuc Loc Nguyen's main workspace window",
      photos: (count) => `Open Photos app — ${count} destinations & photography archive`,
      spotify: "Open Spotify app — curated personal music playlist",
      netflix: "Open Netflix app — personal film & series library",
    },
  },
  desktop: {
    dockAria: "Applications Dock",
    pinMode: "Pin mode",
    exitPinMode: "Exit pin mode",
    pinShort: "Pin Mode",
    exitPinShort: "Exit Pin",
    switcher: "Switcher",
    shortcuts: "Shortcuts",
    shortcutsTitle: "Keyboard shortcuts",
    shortcutsBack: "Back",
    shortcutList: {
      search: "Search the site",
      nextApp: "Switch to next app",
      prevApp: "Switch to previous app",
      switcherMove: "Move in app switcher",
      switcherOpen: "Open selected app",
      escape: "Close menus & dialogs",
    },
    closeAll: "Close All",
    open: "Open",
    quit: "Quit",
    switcherAria: "App Switcher",
    switchTo: (name) => `Switch to ${name}`,
    switcherHint: "Tab / Click to switch · Enter to open · Esc to close",
    moveResize: "Move & Resize",
    fillArrange: "Fill & Arrange",
    tilingAria: "Window tiling options",
    tileLabels: {
      left: "Left",
      right: "Right",
      top: "Top",
      bottom: "Bottom",
      fill: "Fill",
      "left-right": "Left & Right",
      "left-two-right": "Left & 2 Right",
      quarters: "Quarters",
    },
    appTitles: {
      netflix: "Netflix — Personal Library",
      spotify: "Spotify — My Music",
      photos: "Photos — Photography",
      workspace: "Phuc Loc Nguyen — Workspace",
      photoshop: "Color Lab — Nikon Imaging Recipes",
    },
  },
  passGate: {
    title: "Private project details",
    description: "Campaign reports, visuals, and notes shared with authorized viewers.",
    inputLabel: "Access code",
    placeholder: "Enter access code",
    buttonLabel: "Unlock",
    checkingLabel: "Checking...",
    successLabel: "Unlocked",
    errorMessage: "Incorrect access code. Please try again.",
  },
  beforeAfter: {
    sliderAria: "Before and after performance comparison slider",
    before: "Before",
    after: "After",
  },
  photosUi: {
    pageTitle: "Photos",
    seoTitle: "Photos — Photography",
    seoDescription: (count) =>
      `First-hand travel photography and field notes across ${count} destinations in Vietnam and Southeast Asia: mountain passes, karst rivers, coastal towns, and street scenes.`,
    toolbarAria: "Photos toolbar",
    toggleSidebar: "Toggle Sidebar",
    thumbnailSizeAria: "Thumbnail size",
    smallerThumbnails: "Smaller thumbnails",
    largerThumbnails: "Larger thumbnails",
    gridColumnsAria: "Grid columns",
    timeViewAria: "Time & Library view",
    years: "Years",
    months: "Months",
    allPhotos: "All Photos",
    showInfo: "Show Info",
    searchPlaceholder: "Search",
    searchAria: "Search photos and albums",
    sidebarAria: "Photos Library Navigation",
    sectionPhotos: "Photos",
    library: "Library",
    map: "Map",
    sectionCollections: "Collections",
    trips: "Trips",
    featured: "Featured",
    albums: "Albums",
    sectionRegions: "Regions",
    regionLabels: {
      North: "North",
      Highlands: "Highlands",
      Central: "Central",
      South: "South",
      International: "International",
      Vietnam: "Vietnam",
    },
    subheading: (count) => `${count} Destinations · Leica Q3, Nikon Zf & iPhone`,
    filterBy: "Filter By:",
    allItems: "All Items",
    filterMenuAria: "Filter items",
    emptyMsg: "No photos match your filter.",
    showAllPhotos: "Show All Photos",
    tripUnit: (n) => `${n} ${n === 1 ? "Trip" : "Trips"}`,
    photoCount: (n) => `${n} Photos`,
    albumMeta: (count, region) => `${count} Photos · ${region}`,
    loadingMap: "Loading map…",
    tryAgain: "Try again",
    closePreview: "Close destination preview",
    openAlbum: "Open Album →",
    legal: "Legal",
    mapControlsAria: "Map controls",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    resetView: "Reset View",
    footerSummary: (photos, destinations) =>
      `${photos.toLocaleString("en-US")} Photos, ${destinations} Destinations`,
    footerGear: "Shot on Leica Q3, Nikon Zf & iPhone",
    detail: {
      breadcrumbPhotos: "Photography",
      flipHint: "Tap a photo to read its story.",
      photoNotes: "Photo notes",
      date: "Date",
      time: "Time",
      place: "Place",
      frame: "Frame",
      story: "Story",
      storyComingSoon: "Story coming soon.",
      notUpdated: "Not updated",
      tapToFlip: "Tap to flip",
      scrollToRead: " · Scroll to read",
      flipAria: (title) => `Flip photo: ${title}`,
      region: "Region",
      bestSeason: "Best Season (Visited)",
      recommendedStay: "Recommended Stay",
      budgetNote: "Budget Note",
      wouldReturn: "Would Return",
      gallery: "Gallery",
      updated: "Updated",
      fieldNotesKicker: "First-Hand Field Notes",
      fieldNotesHeading: (place) => `Trip notes & practical planning for ${place}`,
      favoriteDetails: "Favorite Details",
      whatIWouldDoAgain: "What I Would Do Again",
      whoItSuits: "Who It Suits",
      lessIdealIf: "Less ideal if",
      practicalLogistics: "Practical Logistics",
      gettingThere: "Getting there:",
      gettingAround: "Getting around:",
      bestLightTiming: "Best light & timing:",
      crowds: "Crowds:",
      difficulty: "Difficulty:",
      weatherNote: "Weather note:",
      journalKicker: "Travel Journal · Personal Observations",
      historyHeading: "Historical & Cultural Context (External Reference Summary)",
      perspectiveHeading: "Photographer’s Perspective",
      highlightsHeading: "Standout Highlights",
      photoTipsHeading: "Photography & Lighting Notes",
      sourcesHeading: "Historical & Reference Sources:",
      relatedHeading: "Explore nearby & related destinations",
      allGalleries: (count) => `All ${count} galleries →`,
      crowdLabels: {
        quiet: "Quiet",
        moderate: "Moderate",
        busy_weekends: "Busy on weekends",
        very_busy: "Very busy",
      },
      difficultyLabels: {
        very_easy: "Very easy",
        easy: "Easy",
        moderate: "Moderate",
        requires_preparation: "Requires preparation",
      },
      wouldReturnLabels: {
        definitely: "Definitely",
        maybe: "Maybe",
        unsure: "Unsure",
        no: "No",
      },
      fallbackIntro: (photoCount, place, country, totalLocations) => ({
        beforePhotosLink: `This collection brings together ${photoCount} photographs from ${place}, ${country}, by Phuc Loc Nguyen. It is part of a personal photography archive covering ${totalLocations} destinations across Vietnam and Southeast Asia. Flip a photograph to read its notes, or explore other collections in the `,
        photosLinkText: "Photography directory",
        betweenLinks: ". For image use or a collaboration inquiry, ",
        contactLinkText: "contact Loc",
        afterContactLink: " with a link to this gallery and identify the photograph you have in mind.",
      }),
    },
  },
};

export function getUiCopy(): UiCopy {
  return UI_COPY;
}
