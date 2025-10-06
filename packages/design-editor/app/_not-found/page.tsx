import type { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.errorTitle}>Page Not Found</h2>
        <p className={styles.errorDescription}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <a href="/" className={styles.homeButton}>
          Go Home
        </a>
      </div>
    </div>
  );
}
