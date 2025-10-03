/**
 * @fileoverview Modal composer component
 * @author @darianrosebrook
 */

import React, { useEffect, useRef } from "react";
import { defaultTokens as tokens } from "@paths-design/design-tokens";
import { Box } from "../primitives/Box";

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Modal composer - dialog overlay with backdrop
 *
 * @example
 * ```tsx
 * <Modal isOpen={showModal} onClose={closeModal} title="Settings">
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  className = "",
  style = {},
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll prevention
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      // Store the current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px"; // Prevent layout shift
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, preventScroll]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the modal
      modalRef.current.focus();

      // Focus the first focusable element inside the modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: { width: "400px", maxWidth: "90vw" },
    md: { width: "500px", maxWidth: "90vw" },
    lg: { width: "600px", maxWidth: "90vw" },
    xl: { width: "800px", maxWidth: "95vw" },
    full: { width: "95vw", height: "95vh" },
  };

  const modalStyles: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: tokens.zIndex.modal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    ...style,
  };

  const backdropStyles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    cursor: closeOnOverlayClick ? "pointer" : "default",
  };

  const dialogStyles: React.CSSProperties = {
    backgroundColor: tokens.color.background.primary,
    borderRadius: tokens.radius.lg,
    boxShadow: tokens.shadow.xl,
    border: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    ...sizeStyles[size],
  };

  const headerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${tokens.space.lg}px ${tokens.space.xl}px`,
    borderBottom: `${tokens.borderWidth.sm}px solid ${tokens.color.border.subtle}`,
    backgroundColor: tokens.color.background.secondary,
    borderRadius: `${tokens.radius.lg}px ${tokens.radius.lg}px 0 0`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: tokens.type.size.lg,
    fontWeight: tokens.type.weight.semibold,
    color: tokens.color.text.primary,
    margin: 0,
  };

  const closeButtonStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: tokens.space.sm,
    borderRadius: tokens.radius.md,
    cursor: "pointer",
    color: tokens.color.text.secondary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease-in-out",
  };

  const contentStyles: React.CSSProperties = {
    padding: tokens.space.xl,
    flex: 1,
    overflowY: "auto",
    color: tokens.color.text.primary,
    fontSize: tokens.type.size.md,
    lineHeight: tokens.type.lineHeight.normal,
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`modal ${size} ${isOpen ? "open" : "closed"} ${className}`}
      style={modalStyles}
      onClick={handleBackdropClick}
    >
      <div style={backdropStyles} />

      <div
        ref={modalRef}
        className="modal-dialog"
        style={dialogStyles}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {title && (
          <div style={headerStyles}>
            <h2 id="modal-title" style={titleStyles}>
              {title}
            </h2>
            {onClose && (
              <button
                style={closeButtonStyles}
                onClick={onClose}
                aria-label="Close modal"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    tokens.color.background.tertiary;
                  e.currentTarget.style.color = tokens.color.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = tokens.color.text.secondary;
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        <div style={contentStyles}>{children}</div>
      </div>
    </div>
  );
};
