import { readCmsPayload } from "@/lib/cms-admin";
import { isCmsDisabledInProduction, getCmsAuthConfig } from "@/lib/cms-auth";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import CmsDashboard from "@/components/cms/CmsDashboard";
import "@/styles/cms.css";
import React from "react";

interface PageProps {
  params: Promise<{ section?: string[] }>;
}

async function isCmsAuthorizedNext() {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get("cms_session")?.value;
  const { sessionSecret, configured } = getCmsAuthConfig();
  if (!configured) return false;
  return sessionVal === sessionSecret;
}

export default async function Page({ params }: PageProps) {
  const { section } = await params;
  const secName = section?.[0] ?? "";

  const allowedSections = new Set(["", "writing", "writting", "gear", "work", "photos"]);
  if (!allowedSections.has(secName)) {
    redirect("/cms");
  }

  // Redirect if disabled in production
  if (isCmsDisabledInProduction()) {
    notFound();
  }

  // Check authorization
  const authorized = await isCmsAuthorizedNext();
  if (!authorized) {
    redirect("/login");
  }

  // Load payload
  const initialData = await readCmsPayload();

  return (
    <CmsDashboard initialData={initialData} />
  );
}
