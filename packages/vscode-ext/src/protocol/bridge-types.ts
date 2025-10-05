/**
 * @fileoverview Typed Bridge API for DESIGNER-022 Canvas Webview
 * @author @darianrosebrook
 *
 * Defines the message contracts between webview and extension as specified
 * in DESIGNER-022. All messages are validated with Zod schemas.
 */

import { z } from "zod";
import type { CanvasDocumentType } from "@paths-design/canvas-schema";

/**
 * Protocol version for bridge compatibility
 */
export const BRIDGE_VERSION = "0.1.0";

/**
 * Base message envelope for all bridge communications
 */
const BridgeEnvelope = z.object({
  id: z.string().uuid(),
  version: z.literal(BRIDGE_VERSION),
  timestamp: z.number(),
});

/**
 * Canvas mutation types as defined in DESIGNER-022
 */
export const CanvasMutation = z.discriminatedUnion("type", [
  // Create node mutation
  z.object({
    type: z.literal("createNode"),
    node: z.object({
      id: z.string(),
      type: z.string(),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      properties: z.record(z.unknown()),
    }),
  }),
  // Update node mutation
  z.object({
    type: z.literal("updateNode"),
    id: z.string(),
    props: z.record(z.unknown()),
  }),
  // Delete node mutation
  z.object({
    type: z.literal("deleteNode"),
    id: z.string(),
  }),
  // Reorder mutation
  z.object({
    type: z.literal("reorder"),
    parentId: z.string(),
    id: z.string(),
    toIndex: z.number(),
  }),
  // Group mutation
  z.object({
    type: z.literal("group"),
    ids: z.array(z.string()),
    as: z.enum(["group", "frame"]),
  }),
  // Ungroup mutation
  z.object({
    type: z.literal("ungroup"),
    id: z.string(),
  }),
  // Rename mutation
  z.object({
    type: z.literal("rename"),
    id: z.string(),
    name: z.string(),
  }),
  // Toggle visibility mutation
  z.object({
    type: z.literal("toggleVisibility"),
    id: z.string(),
    visible: z.boolean(),
  }),
  // Toggle lock mutation
  z.object({
    type: z.literal("toggleLock"),
    id: z.string(),
    locked: z.boolean(),
  }),
]);

export type CanvasMutationType = z.infer<typeof CanvasMutation>;

/**
 * Selection state for bridge communication
 */
export const SelectionState = z.object({
  selectedNodeIds: z.array(z.string()),
  focusedNodeId: z.string().nullable(),
});

export type SelectionStateType = z.infer<typeof SelectionState>;

/**
 * Selection mode configuration
 */
export const SelectionModeConfig = z.object({
  multiSelect: z.boolean().optional(),
  preserveSelection: z.boolean().optional(),
});

export type SelectionModeConfigType = z.infer<typeof SelectionModeConfig>;

/**
 * Property change event for bridge
 */
export const PropertyChangeEvent = z.object({
  nodeId: z.string(),
  propertyKey: z.string(),
  value: z.unknown(),
  oldValue: z.unknown().optional(),
  sectionId: z.string().optional(),
});

export type PropertyChangeEventType = z.infer<typeof PropertyChangeEvent>;

/**
 * Font metadata for bridge
 */
export const FontMetadata = z.object({
  label: z.string(),
  value: z.string(),
});

export type FontMetadataType = z.infer<typeof FontMetadata>;

/**
 * Panel visibility state
 */
export const PanelVisibilityState = z.object({
  left: z.boolean(),
  right: z.boolean(),
  actionBar: z.boolean(),
});

export type PanelVisibilityStateType = z.infer<typeof PanelVisibilityState>;

/**
 * Panel resize event
 */
export const PanelResizeEvent = z.object({
  panel: z.enum(["left", "right"]),
  widthPx: z.number(),
});

export type PanelResizeEventType = z.infer<typeof PanelResizeEvent>;

/**
 * ============================================================================
 * INCOMING MESSAGES (Extension → Webview)
 * ============================================================================
 */

/**
 * Set document message
 */
export const SetDocumentMessage = BridgeEnvelope.extend({
  type: z.literal("setDocument"),
  document: z.unknown().transform((doc) => doc as CanvasDocumentType),
});

/**
 * Set selection message
 */
export const SetSelectionMessage = BridgeEnvelope.extend({
  type: z.literal("setSelection"),
  selection: SelectionState,
});

/**
 * Set selection mode message
 */
export const SetSelectionModeMessage = BridgeEnvelope.extend({
  type: z.literal("setSelectionMode"),
  mode: z.enum(["single", "rectangle", "lasso"]),
  config: SelectionModeConfig.optional(),
});

/**
 * Apply mutation result message
 */
export const ApplyMutationResultMessage = BridgeEnvelope.extend({
  type: z.literal("applyMutationResult"),
  result: z.discriminatedUnion("ok", [
    z.object({
      ok: z.literal(true),
      document: z.unknown().transform((doc) => doc as CanvasDocumentType),
    }),
    z.object({
      ok: z.literal(false),
      error: z.string(),
    }),
  ]),
});

/**
 * Set fonts message
 */
export const SetFontsMessage = BridgeEnvelope.extend({
  type: z.literal("setFonts"),
  fonts: z.array(FontMetadata),
});

/**
 * Show error message
 */
export const ShowErrorMessage = BridgeEnvelope.extend({
  type: z.literal("showError"),
  error: z.string(),
});

/**
 * View mode change message
 */
export const ViewModeChangeMessage = BridgeEnvelope.extend({
  type: z.literal("viewModeChange"),
  mode: z.enum(["canvas", "code"]),
});

/**
 * Union of all incoming messages
 */
export const IncomingMessage = z.discriminatedUnion("type", [
  SetDocumentMessage,
  SetSelectionMessage,
  SetSelectionModeMessage,
  ApplyMutationResultMessage,
  SetFontsMessage,
  ShowErrorMessage,
  ViewModeChangeMessage,
]);

export type IncomingMessageType = z.infer<typeof IncomingMessage>;

/**
 * ============================================================================
 * OUTGOING MESSAGES (Webview → Extension)
 * ============================================================================
 */

/**
 * Ready message
 */
export const ReadyMessage = BridgeEnvelope.extend({
  type: z.literal("ready"),
});

/**
 * Selection change message
 */
export const SelectionChangeMessage = BridgeEnvelope.extend({
  type: z.literal("selectionChange"),
  nodeIds: z.array(z.string()),
});

/**
 * Selection mode change message
 */
export const SelectionModeChangeMessage = BridgeEnvelope.extend({
  type: z.literal("selectionModeChange"),
  mode: z.enum(["single", "rectangle", "lasso"]),
  config: SelectionModeConfig.optional(),
});

/**
 * Request mutation message
 */
export const RequestMutationMessage = BridgeEnvelope.extend({
  type: z.literal("requestMutation"),
  opId: z.string(),
  op: CanvasMutation,
});

/**
 * Property change message
 */
export const PropertyChangeMessage = BridgeEnvelope.extend({
  type: z.literal("propertyChange"),
  event: PropertyChangeEvent,
});

/**
 * Request save message
 */
export const RequestSaveMessage = BridgeEnvelope.extend({
  type: z.literal("requestSave"),
});

/**
 * View mode change message (outgoing)
 */
export const ViewModeChangeOutgoingMessage = BridgeEnvelope.extend({
  type: z.literal("viewModeChange"),
  mode: z.enum(["canvas", "code"]),
});

/**
 * Panel visibility message
 */
export const PanelVisibilityMessage = BridgeEnvelope.extend({
  type: z.literal("panelVisibility"),
  visibility: PanelVisibilityState,
});

/**
 * Panel resize message
 */
export const PanelResizeMessage = BridgeEnvelope.extend({
  type: z.literal("panelResize"),
  resize: PanelResizeEvent,
});

/**
 * Union of all outgoing messages
 */
export const OutgoingMessage = z.discriminatedUnion("type", [
  ReadyMessage,
  SelectionChangeMessage,
  SelectionModeChangeMessage,
  RequestMutationMessage,
  PropertyChangeMessage,
  RequestSaveMessage,
  ViewModeChangeOutgoingMessage,
  PanelVisibilityMessage,
  PanelResizeMessage,
]);

export type OutgoingMessageType = z.infer<typeof OutgoingMessage>;

/**
 * ============================================================================
 * MESSAGE CREATION HELPERS
 * ============================================================================
 */

/**
 * Create a bridge message with proper envelope
 */
export function createBridgeMessage<TType extends OutgoingMessageType["type"]>(
  type: TType,
  payload: Omit<
    Extract<OutgoingMessageType, { type: TType }>,
    "id" | "version" | "timestamp"
  >
): OutgoingMessageType {
  return {
    id: crypto.randomUUID(),
    version: BRIDGE_VERSION,
    timestamp: Date.now(),
    type,
    ...payload,
  } as OutgoingMessageType;
}

/**
 * Validate an incoming message from extension
 */
export function validateIncomingMessage(message: unknown): {
  success: boolean;
  data?: IncomingMessageType;
  error?: string;
  details?: unknown[];
} {
  try {
    const result = IncomingMessage.safeParse(message);

    if (!result.success) {
      return {
        success: false,
        error: "Invalid incoming message format",
        details: result.error.errors,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: "Message validation failed",
      details: [error],
    };
  }
}

/**
 * Validate an outgoing message from webview
 */
export function validateOutgoingMessage(message: unknown): {
  success: boolean;
  data?: OutgoingMessageType;
  error?: string;
  details?: unknown[];
} {
  try {
    const result = OutgoingMessage.safeParse(message);

    if (!result.success) {
      return {
        success: false,
        error: "Invalid outgoing message format",
        details: result.error.errors,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: "Message validation failed",
      details: [error],
    };
  }
}

/**
 * ============================================================================
 * CANVAS SURFACE TYPES
 * ============================================================================
 */

/**
 * Scene node for minimal working canvas
 */
export const SceneNode = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  fill: z.string(),
});

export type SceneNodeType = z.infer<typeof SceneNode>;

/**
 * Scene state for minimal working canvas
 */
export const SceneState = z.object({
  nodes: z.array(SceneNode),
  selection: z.array(z.string()),
});

export type SceneStateType = z.infer<typeof SceneState>;

/**
 * Canvas surface component props
 */
export const CanvasSurfaceProps = z.object({
  document: z
    .unknown()
    .nullable()
    .transform((doc) => doc as CanvasDocumentType | null),
  onSelectionChange: z.function().args(z.array(z.string())).returns(z.void()),
  onCreateNode: z
    .function()
    .args(
      z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .and(z.partial(SceneNode))
    )
    .returns(z.void()),
});

export type CanvasSurfacePropsType = z.infer<typeof CanvasSurfaceProps>;

/**
 * ============================================================================
 * COORDINATE SYSTEM TYPES
 * ============================================================================
 */

/**
 * Point in world or view coordinates
 */
export const Point = z.object({
  x: z.number(),
  y: z.number(),
});

export type PointType = z.infer<typeof Point>;

/**
 * Rectangle in world or view coordinates
 */
export const Rectangle = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type RectangleType = z.infer<typeof Rectangle>;

/**
 * Transform matrix for world to view conversion
 */
export const TransformMatrix = z.object({
  scaleX: z.number(),
  scaleY: z.number(),
  translateX: z.number(),
  translateY: z.number(),
  skewX: z.number().default(0),
  skewY: z.number().default(0),
});

export type TransformMatrixType = z.infer<typeof TransformMatrix>;

/**
 * Camera state for pan/zoom
 */
export const CameraState = z.object({
  panX: z.number(),
  panY: z.number(),
  zoom: z.number().min(0.1).max(8),
  focalPoint: Point.optional(),
});

export type CameraStateType = z.infer<typeof CameraState>;
