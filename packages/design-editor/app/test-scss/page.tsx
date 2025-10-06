"use client";

import styles from "./page.module.scss";
import { Button } from "@/ui/primitives/Button";
import { Checkbox } from "@/ui/primitives/Checkbox";
import { Input } from "@/ui/primitives/Input";

export default function TestSCSSPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>SCSS Migration Test</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Button Variants</h2>
        <div className={styles.buttonRow}>
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Button Sizes</h2>
        <div className={styles.buttonRow}>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Input</h2>
        <Input placeholder="Test input with SCSS styles" />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Checkbox</h2>
        <div className={styles.checkboxRow}>
          <Checkbox id="test-checkbox" />
          <label htmlFor="test-checkbox">Test checkbox with SCSS styles</label>
        </div>
      </div>
    </div>
  );
}
