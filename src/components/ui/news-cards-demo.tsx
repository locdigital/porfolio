"use client";

import { NewsCards } from "@/components/ui/news-cards";
import { useState } from "react";

export default function NewsCardsDemo() {
  const [enableAnimations, setEnableAnimations] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8">
        <NewsCards
          enableAnimations={enableAnimations}
        />
      </div>
    </div>
  );
}
