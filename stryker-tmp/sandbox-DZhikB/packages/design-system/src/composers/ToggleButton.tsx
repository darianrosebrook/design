/**
 * @fileoverview ToggleButton composer component
 * @author @darianrosebrook
 *
 * Stateful button with tooltip and optional overflow menu.
 * Combines Button, Tooltip, and Popover for a split-button effect.
 */

import React, { useState, useCallback } from "react";
import { Button } from "../primitives/Button";
import { defaultTokens as tokens } from "../tokens.js";
import { Popover } from "./Popover";
import { Tooltip } from "./Tooltip";

/**
 * ToggleButton props
 */
export interface ToggleButtonProps {
  children?: React.ReactNode;
  tooltip?: React.ReactNode;
  tooltipPlacement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "bottom-start"
    | "top-start"
    | "top-end"
    | "bottom-end"
    | "left-start"
    | "left-end"
    | "right-start"
    | "right-end";

  // Button props
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;

  // Overflow menu props
  overflowItems?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;

  // State
  isActive?: boolean;
  className?: string;
}

/**
 * ToggleButton composer - stateful button with tooltip and overflow menu
 *
 * @example
 * ```tsx
 * <ToggleButton
 *   tooltip="Select tool"
 *   isActive={isSelectionMode}
 *   onClick={() => setSelectionMode(!isSelectionMode)}
 *   overflowItems={[
 *     { label: "Rectangle", onClick: () => setTool("rectangle") },
 *     { label: "Lasso", onClick: () => setTool("lasso") }
 *   ]}
 * >
 *   ✏️
 * </ToggleButton>
 * ```
 */
export const ToggleButton: React.FC<ToggleButtonProps> = ({
  children,
  tooltip,
  tooltipPlacement = "top",
  variant = "secondary",
  size = "sm",
  disabled = false,
  onClick,
  overflowItems = [],
  isActive = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMainClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const handleOverflowClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    },
    [isOpen]
  );

  const buttonVariant = isActive ? "primary" : variant;

  const buttonElement = (
    <div className={`toggle-button ${className}`}>
      <Button
        variant={buttonVariant}
        size={size}
        disabled={disabled}
        onClick={handleMainClick}
        className="toggle-button-main"
        aria-pressed={isActive}
      >
        {children}
      </Button>

      {overflowItems.length > 0 && (
        <>
          <div className="toggle-button-separator" />
          <Button
            variant={buttonVariant}
            size={size}
            disabled={disabled}
            onClick={handleOverflowClick}
            className="toggle-button-overflow"
            aria-label="More options"
            aria-expanded={isOpen}
          >
            {isOpen ? "▲" : "▼"}
          </Button>
        </>
      )}
    </div>
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom"
      triggerStrategy="click"
      closeOnOutsideClick={true}
      closeOnEscape={true}
    >
      <Popover.Trigger>
        {tooltip ? (
          <Tooltip content={tooltip} placement={tooltipPlacement}>
            {buttonElement}
          </Tooltip>
        ) : (
          buttonElement
        )}
      </Popover.Trigger>

      {overflowItems.length > 0 && (
        <Popover.Content className="toggle-button-menu">
          <div className="toggle-button-menu-content">
            {overflowItems.map((item, index) => (
              <button
                key={index}
                className={`toggle-button-menu-item ${
                  item.disabled ? "disabled" : ""
                }`}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Popover.Content>
      )}
    </Popover>
  );
};
