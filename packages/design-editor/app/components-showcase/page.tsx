import type { Metadata } from "next";
import { ComponentShowcaseClient } from "./client";

export const metadata: Metadata = {
  title: "Component Showcase - Design System Verification",
  description: "Visual verification of all migrated SCSS components",
};

export default function ComponentShowcasePage() {
  return <ComponentShowcaseClient />;
}
