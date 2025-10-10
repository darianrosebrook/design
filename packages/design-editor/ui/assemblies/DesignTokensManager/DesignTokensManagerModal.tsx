/**
 * @fileoverview Design Tokens Manager Modal - Portal-based modal for the tokens manager
 * @author @darianrosebrook
 */

"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  DesignTokensManager,
  type DesignTokensManagerProps,
} from "./DesignTokensManager";

export interface DesignTokensManagerModalProps
  extends DesignTokensManagerProps {
  container?: Element | null;
}

/**
 * Design Tokens Manager Modal - Portal-based modal wrapper
 */
export function DesignTokensManagerModal({
  isOpen,
  onClose,
  container,
  ...props
}: DesignTokensManagerModalProps) {
  if (!isOpen) return null;

  const targetContainer =
    container || (typeof document !== "undefined" ? document.body : null);

  if (!targetContainer) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50">
        <DesignTokensManager isOpen={isOpen} onClose={onClose} {...props} />
      </div>
    </div>,
    targetContainer
  );
}





















