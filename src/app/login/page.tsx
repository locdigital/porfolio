import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "CMS Login | Lộc Digital",
  description: "Private CMS login for Lộc Digital.",
  robots: "noindex, nofollow",
};

export default function Page() {
  // Check if we are in production
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    redirect("/404");
  }

  return (
    <LoginForm />
  );
}
