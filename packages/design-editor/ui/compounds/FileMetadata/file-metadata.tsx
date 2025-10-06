"use client";

import { Info } from "lucide-react";
import styles from "./file-metadata.module.scss";
import { cn } from "@/lib/utils";

interface FileMetadataProps {
  name: string;
  layers: number;
  components: number;
  lastModified: string;
}

export function FileMetadata({
  name,
  layers,
  components,
  lastModified,
}: FileMetadataProps) {
  return (
    <div className={styles.fileMetadata}>
      <div className={styles.fileMetadataHeader}>
        <h2 className={styles.fileMetadataTitle}>Layers & Library</h2>
      </div>
      <div className={styles.fileMetadataContent}>
        <div className={styles.fileMetadataRow}>
          <Info className={styles.icon} />
          <span>{name}</span>
        </div>
        <div className={styles.fileMetadataStats}>
          <span>{layers} layers</span>
          <span>{components} components</span>
          <span>Modified {lastModified}</span>
        </div>
      </div>
    </div>
  );
}
