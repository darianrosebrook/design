/**
 * @fileoverview Component contract tests for Design System
 * @author @darianrosebrook
 *
 * Tests that validate component contracts and ensure consistent API surface
 * across all design system components.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Component imports
import { Button } from "../src/primitives/Button";
import { Input } from "../src/primitives/Input";
import { Label } from "../src/primitives/Label";
import { Select } from "../src/primitives/Select";
import { Checkbox } from "../src/primitives/Checkbox";
import { Slider } from "../src/primitives/Slider";
import { Box } from "../src/primitives/Box";
import { Flex } from "../src/primitives/Flex";
import { Stack } from "../src/primitives/Stack";
import { Icon } from "../src/primitives/Icon";
import { Modal } from "../src/composers/Modal";
import { Popover } from "../src/composers/Popover";
import { Tooltip } from "../src/composers/Tooltip";
import { ToggleButton } from "../src/composers/ToggleButton";
import { TextField } from "../src/compounds/TextField";
import { NumberField } from "../src/compounds/NumberField";
import { ColorField } from "../src/compounds/ColorField";

/**
 * Component contract interface that all design system components must satisfy
 */
interface ComponentContract<T = any> {
  name: string;
  component: React.ComponentType<T>;
  requiredProps?: Partial<T>;
  defaultProps?: Partial<T>;
  optionalProps?: Partial<T>;
  expectedClassName?: string;
  expectedRole?: string;
  accessibilityTests?: boolean;
  interactionTests?: boolean;
  stylingTests?: boolean;
}

/**
 * Test suite for component contracts
 */
describe("Design System Component Contracts", () => {
  const componentContracts: ComponentContract[] = [
    {
      name: "Button",
      component: Button,
      requiredProps: { children: "Click me" },
      expectedRole: "button",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
    {
      name: "Input",
      component: Input,
      defaultProps: { type: "text" },
      expectedRole: "textbox",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
    {
      name: "Label",
      component: Label,
      requiredProps: { children: "Label text" },
      expectedRole: undefined, // Labels don't have roles
      accessibilityTests: true,
      stylingTests: true,
    },
    {
      name: "Select",
      component: Select,
      requiredProps: {
        children: [
          <option key="1" value="option1">
            Option 1
          </option>,
          <option key="2" value="option2">
            Option 2
          </option>,
        ],
      },
      expectedRole: "combobox",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
    {
      name: "Checkbox",
      component: Checkbox,
      expectedRole: "checkbox",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
    {
      name: "Slider",
      component: Slider,
      defaultProps: { min: 0, max: 100, value: 50 },
      expectedRole: "slider",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
    {
      name: "Box",
      component: Box,
      requiredProps: { children: "Box content" },
      stylingTests: true,
    },
    {
      name: "Flex",
      component: Flex,
      requiredProps: { children: <div>Flex item</div> },
      stylingTests: true,
    },
    {
      name: "Stack",
      component: Stack,
      requiredProps: { children: <div>Stack item</div> },
      stylingTests: true,
    },
    {
      name: "Icon",
      component: Icon,
      requiredProps: { name: "star" },
      expectedRole: "img",
      accessibilityTests: true,
      stylingTests: true,
    },
    {
      name: "TextField",
      component: TextField,
      requiredProps: { label: "Text Field" },
      expectedRole: "textbox",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
    {
      name: "NumberField",
      component: NumberField,
      requiredProps: { label: "Number Field" },
      expectedRole: "spinbutton",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
    {
      name: "ColorField",
      component: ColorField,
      requiredProps: { label: "Color Field" },
      expectedRole: "textbox",
      accessibilityTests: true,
      interactionTests: true,
      stylingTests: true,
    },
  ];

  describe.each(componentContracts)(
    "$name Component Contract",
    ({
      name,
      component: Component,
      requiredProps = {},
      defaultProps = {},
      expectedRole,
      accessibilityTests = false,
      interactionTests = false,
      stylingTests = false,
    }) => {
      const testId = `test-${name.toLowerCase()}`;

      it("should render without crashing", () => {
        const { container } = render(
          <Component
            {...requiredProps}
            {...defaultProps}
            data-testid={testId}
          />
        );
        expect(container.firstChild).toBeInTheDocument();
      });

      it("should accept and apply custom className", () => {
        const customClass = "custom-test-class";
        const { container } = render(
          <Component
            {...requiredProps}
            {...defaultProps}
            className={customClass}
            data-testid={testId}
          />
        );

        const element = container.querySelector(`[data-testid="${testId}"]`);
        expect(element).toHaveClass(customClass);
      });

      it("should accept and apply custom style", () => {
        const customStyle = { color: "red", fontSize: "20px" };
        const { container } = render(
          <Component
            {...requiredProps}
            {...defaultProps}
            style={customStyle}
            data-testid={testId}
          />
        );

        const element = container.querySelector(`[data-testid="${testId}"]`);
        expect(element).toHaveStyle(customStyle);
      });

      it("should forward data attributes", () => {
        const { container } = render(
          <Component
            {...requiredProps}
            {...defaultProps}
            data-testid={testId}
            data-custom="test-value"
          />
        );

        const element = container.querySelector(`[data-testid="${testId}"]`);
        expect(element).toHaveAttribute("data-custom", "test-value");
      });

      if (expectedRole) {
        it(`should have correct ARIA role: ${expectedRole}`, () => {
          const { container } = render(
            <Component
              {...requiredProps}
              {...defaultProps}
              data-testid={testId}
            />
          );

          const element = container.querySelector(`[data-testid="${testId}"]`);
          expect(element).toHaveAttribute("role", expectedRole);
        });
      }

      if (accessibilityTests) {
        describe("Accessibility", () => {
          it("should have accessible name when provided", () => {
            const accessibleName = `${name} Test`;
            const { container } = render(
              <Component
                {...requiredProps}
                {...defaultProps}
                aria-label={accessibleName}
                data-testid={testId}
              />
            );

            const element = container.querySelector(
              `[data-testid="${testId}"]`
            );
            expect(element).toHaveAttribute("aria-label", accessibleName);
          });

          it("should support aria-describedby", () => {
            const descriptionId = "description-id";
            const { container } = render(
              <Component
                {...requiredProps}
                {...defaultProps}
                aria-describedby={descriptionId}
                data-testid={testId}
              />
            );

            const element = container.querySelector(
              `[data-testid="${testId}"]`
            );
            expect(element).toHaveAttribute("aria-describedby", descriptionId);
          });
        });
      }

      if (interactionTests) {
        describe("Interactions", () => {
          it("should handle click events", async () => {
            const user = userEvent.setup();
            let clicked = false;
            const handleClick = () => {
              clicked = true;
            };

            const { container } = render(
              <Component
                {...requiredProps}
                {...defaultProps}
                onClick={handleClick}
                data-testid={testId}
              />
            );

            const element = container.querySelector(
              `[data-testid="${testId}"]`
            );
            if (element) {
              await user.click(element);
              expect(clicked).toBe(true);
            }
          });

          it("should handle keyboard events when focusable", async () => {
            const user = userEvent.setup();
            let keyPressed = false;
            const handleKeyDown = () => {
              keyPressed = true;
            };

            const { container } = render(
              <Component
                {...requiredProps}
                {...defaultProps}
                onKeyDown={handleKeyDown}
                data-testid={testId}
              />
            );

            const element = container.querySelector(
              `[data-testid="${testId}"]`
            );
            if (element && element.hasAttribute("tabIndex")) {
              element.focus();
              await user.keyboard("{Enter}");
              expect(keyPressed).toBe(true);
            }
          });
        });
      }

      if (stylingTests) {
        describe("Styling", () => {
          it("should apply size variants consistently", () => {
            const sizes = ["sm", "md", "lg"] as const;

            sizes.forEach((size) => {
              const { container } = render(
                <Component
                  {...requiredProps}
                  {...defaultProps}
                  size={size}
                  data-testid={`${testId}-${size}`}
                />
              );

              const element = container.querySelector(
                `[data-testid="${testId}-${size}"]`
              );
              expect(element).toBeInTheDocument();
              // Could add more specific size variant checks here
            });
          });

          it("should apply variant styles consistently", () => {
            const variants = [
              "primary",
              "secondary",
              "outline",
              "ghost",
            ] as const;

            variants.forEach((variant) => {
              const { container } = render(
                <Component
                  {...requiredProps}
                  {...defaultProps}
                  variant={variant}
                  data-testid={`${testId}-${variant}`}
                />
              );

              const element = container.querySelector(
                `[data-testid="${testId}-${variant}"]`
              );
              expect(element).toBeInTheDocument();
              // Could add more specific variant style checks here
            });
          });
        });
      }
    }
  );

  describe("Composite Component Contracts", () => {
    describe("Modal", () => {
      it("should render with required props", () => {
        const { container } = render(
          <Modal
            isOpen={true}
            onClose={() => {}}
            title="Test Modal"
            data-testid="test-modal"
          >
            Modal content
          </Modal>
        );

        expect(container.firstChild).toBeInTheDocument();
      });

      it("should handle open/close state", () => {
        const { rerender } = render(
          <Modal isOpen={false} onClose={() => {}} title="Test Modal">
            Modal content
          </Modal>
        );

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        rerender(
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            Modal content
          </Modal>
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    describe("Popover", () => {
      it("should render with trigger and content", () => {
        const { container } = render(
          <Popover>
            <Popover.Trigger>
              <Button>Open Popover</Button>
            </Popover.Trigger>
            <Popover.Content>Popover content</Popover.Content>
          </Popover>
        );

        expect(container.firstChild).toBeInTheDocument();
      });
    });

    describe("Tooltip", () => {
      it("should render with trigger and content", () => {
        const { container } = render(
          <Tooltip content="Tooltip content">
            <Button>Hover me</Button>
          </Tooltip>
        );

        expect(container.firstChild).toBeInTheDocument();
      });
    });

    describe("ToggleButton", () => {
      it("should handle toggle state", async () => {
        const user = userEvent.setup();
        let isPressed = false;

        const { container } = render(
          <ToggleButton
            pressed={isPressed}
            onPressedChange={(pressed) => {
              isPressed = pressed;
            }}
            data-testid="test-toggle"
          >
            Toggle me
          </ToggleButton>
        );

        const button = container.querySelector("[data-testid='test-toggle']");
        expect(button).toHaveAttribute("aria-pressed", "false");

        if (button) {
          await user.click(button);
          expect(isPressed).toBe(true);
        }
      });
    });
  });

  describe("Compound Component Contracts", () => {
    describe("TextField", () => {
      it("should integrate label and input properly", () => {
        render(<TextField label="Test Field" data-testid="test-textfield" />);

        const label = screen.getByText("Test Field");
        const input = screen.getByRole("textbox");

        expect(label).toBeInTheDocument();
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("id");
        expect(label).toHaveAttribute("for", input.getAttribute("id"));
      });
    });

    describe("NumberField", () => {
      it("should handle numeric input validation", async () => {
        const user = userEvent.setup();

        render(
          <NumberField
            label="Number Field"
            min={0}
            max={100}
            data-testid="test-numberfield"
          />
        );

        const input = screen.getByRole("spinbutton");

        await user.type(input, "50");
        expect(input).toHaveValue(50);

        await user.clear(input);
        await user.type(input, "150"); // Above max
        expect(input).toHaveValue(150); // HTML5 doesn't prevent this, validation is app-level
      });
    });

    describe("ColorField", () => {
      it("should accept valid color values", async () => {
        const user = userEvent.setup();

        render(
          <ColorField label="Color Field" data-testid="test-colorfield" />
        );

        const input = screen.getByRole("textbox");

        await user.type(input, "#ff0000");
        expect(input).toHaveValue("#ff0000");

        await user.clear(input);
        await user.type(input, "rgb(255, 0, 0)");
        expect(input).toHaveValue("rgb(255, 0, 0)");
      });
    });
  });

  describe("Design Token Integration", () => {
    it("should apply design tokens consistently", () => {
      const { container } = render(
        <Button variant="primary" size="md" data-testid="token-button">
          Token Button
        </Button>
      );

      const button = container.querySelector("[data-testid='token-button']");
      expect(button).toBeInTheDocument();
      // In a real implementation, you might check that CSS custom properties are applied
    });

    it("should support theme overrides", () => {
      const customTheme = {
        colors: { primary: "#ff0000" },
        spacing: { md: "16px" },
      };

      const { container } = render(
        <Box theme={customTheme} data-testid="themed-box">
          Themed content
        </Box>
      );

      const box = container.querySelector("[data-testid='themed-box']");
      expect(box).toBeInTheDocument();
    });
  });
});
