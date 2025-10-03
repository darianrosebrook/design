/**
 * @fileoverview Secure message protocol for Designer VS Code extension
 * @author @darianrosebrook
 *
 * All messages between webview and extension are validated with Zod schemas
 * to prevent security vulnerabilities and ensure type safety.
 */

import { CanvasDocument, ULID, Patch } from "@paths-design/canvas-schema";
import { z } from "zod";

/**
 * Protocol version for backwards compatibility
 */
export const PROTOCOL_VERSION = "0.1.0";

/**
 * Message envelope wrapping all communications
 */
const MessageEnvelope = z.object({
  id: z.string().uuid(), // Request ID for correlation
  version: z.literal(PROTOCOL_VERSION),
  timestamp: z.number(),
});

/**
 * Load document request - load a canvas document from workspace
 */
export const LoadDocumentRequest = MessageEnvelope.extend({
  type: z.literal("loadDocument"),
  payload: z.object({
    path: z.string(),
  }),
});

/**
 * Save document request - persist canvas document to workspace
 */
export const SaveDocumentRequest = MessageEnvelope.extend({
  type: z.literal("saveDocument"),
  payload: z.object({
    path: z.string(),
    document: CanvasDocument,
  }),
});

/**
 * Update node request - apply patch to a node
 */
export const UpdateNodeRequest = MessageEnvelope.extend({
  type: z.literal("updateNode"),
  payload: z.object({
    documentId: ULID,
    nodeId: ULID,
    patch: Patch,
  }),
});

/**
 * Get document list request - list all canvas documents in workspace
 */
export const ListDocumentsRequest = MessageEnvelope.extend({
  type: z.literal("listDocuments"),
  payload: z.object({
    pattern: z.string().optional(), // Optional glob pattern
  }),
});

/**
 * Validate document request - check document schema validity
 */
export const ValidateDocumentRequest = MessageEnvelope.extend({
  type: z.literal("validateDocument"),
  payload: z.object({
    document: z.unknown(), // Accept any for validation
  }),
});

/**
 * Selection mode types
 */
const SelectionMode = z.enum(["single", "rectangle", "lasso"]);

/**
 * Selection change notification - notify extension of selection changes
 */
export const SelectionChangeNotification = MessageEnvelope.extend({
  type: z.literal("selectionChange"),
  payload: z.object({
    nodeIds: z.array(z.string()),
  }),
});

/**
 * Selection mode change request - change the active selection mode
 */
export const SelectionModeChangeRequest = MessageEnvelope.extend({
  type: z.literal("selectionModeChange"),
  payload: z.object({
    mode: SelectionMode,
    config: z
      .object({
        multiSelect: z.boolean().optional(),
        preserveSelection: z.boolean().optional(),
      })
      .optional(),
  }),
});

/**
 * Selection operation complete notification - report selection operation results
 */
export const SelectionOperationNotification = MessageEnvelope.extend({
  type: z.literal("selectionOperation"),
  payload: z.object({
    mode: SelectionMode,
    result: z.object({
      selectedNodeIds: z.array(z.string()),
      accuracy: z.number().min(0).max(1),
      duration: z.number().min(0),
    }),
  }),
});

/**
 * Property change notification - notify extension of property changes
 */
export const PropertyChangeNotification = MessageEnvelope.extend({
  type: z.literal("propertyChange"),
  payload: z.object({
    event: z.object({
      nodeId: z.string(),
      property: z.string(),
      value: z.unknown(),
      oldValue: z.unknown().optional(),
    }),
  }),
});

/**
 * Ready notification - webview is ready to receive messages
 */
export const ReadyNotification = MessageEnvelope.extend({
  type: z.literal("ready"),
  payload: z.object({}).optional(),
});

/**
 * View mode change notification - notify extension of view mode changes
 */
export const ViewModeChangeNotification = MessageEnvelope.extend({
  type: z.literal("viewModeChange"),
  payload: z.object({
    mode: z.enum(["canvas", "code"]),
  }),
});

/**
 * Wrap mode change notification - notify extension of wrap mode changes
 */
export const WrapModeChangeNotification = MessageEnvelope.extend({
  type: z.literal("wrapModeChange"),
  payload: z.object({
    mode: z.enum(["group", "frame", "section", "page"]),
  }),
});

/**
 * Type mode change notification - notify extension of type mode changes
 */
export const TypeModeChangeNotification = MessageEnvelope.extend({
  type: z.literal("typeModeChange"),
  payload: z.object({
    mode: z.enum(["text"]),
  }),
});

/**
 * Image mode change notification - notify extension of image mode changes
 */
export const ImageModeChangeNotification = MessageEnvelope.extend({
  type: z.literal("imageModeChange"),
  payload: z.object({
    mode: z.enum(["image", "video"]),
  }),
});

/**
 * Shape mode change notification - notify extension of shape mode changes
 */
export const ShapeModeChangeNotification = MessageEnvelope.extend({
  type: z.literal("shapeModeChange"),
  payload: z.object({
    mode: z.enum(["line", "rectangle", "ellipse", "polygon"]),
  }),
});

/**
 * Union of all request message types
 */
export const WebviewMessage = z.discriminatedUnion("type", [
  LoadDocumentRequest,
  SaveDocumentRequest,
  UpdateNodeRequest,
  ListDocumentsRequest,
  ValidateDocumentRequest,
  SelectionChangeNotification,
  SelectionModeChangeRequest,
  SelectionOperationNotification,
  PropertyChangeNotification,
  ViewModeChangeNotification,
  WrapModeChangeNotification,
  TypeModeChangeNotification,
  ImageModeChangeNotification,
  ShapeModeChangeNotification,
  ReadyNotification,
]);

export type WebviewMessageType = z.infer<typeof WebviewMessage>;
export type LoadDocumentRequestType = z.infer<typeof LoadDocumentRequest>;
export type SaveDocumentRequestType = z.infer<typeof SaveDocumentRequest>;
export type UpdateNodeRequestType = z.infer<typeof UpdateNodeRequest>;
export type ListDocumentsRequestType = z.infer<typeof ListDocumentsRequest>;
export type ValidateDocumentRequestType = z.infer<
  typeof ValidateDocumentRequest
>;
export type SelectionChangeNotificationType = z.infer<
  typeof SelectionChangeNotification
>;
export type SelectionModeChangeRequestType = z.infer<
  typeof SelectionModeChangeRequest
>;
export type SelectionOperationNotificationType = z.infer<
  typeof SelectionOperationNotification
>;
export type PropertyChangeNotificationType = z.infer<
  typeof PropertyChangeNotification
>;
export type ViewModeChangeNotificationType = z.infer<
  typeof ViewModeChangeNotification
>;
export type WrapModeChangeNotificationType = z.infer<
  typeof WrapModeChangeNotification
>;
export type TypeModeChangeNotificationType = z.infer<
  typeof TypeModeChangeNotification
>;
export type ImageModeChangeNotificationType = z.infer<
  typeof ImageModeChangeNotification
>;
export type ShapeModeChangeNotificationType = z.infer<
  typeof ShapeModeChangeNotification
>;
export type ReadyNotificationType = z.infer<typeof ReadyNotification>;

/**
 * Response messages
 */

export const SuccessResponse = z.object({
  success: z.literal(true),
  requestId: z.string().uuid(),
  data: z.unknown(),
});

export const ErrorResponse = z.object({
  success: z.literal(false),
  requestId: z.string().uuid(),
  error: z.string(),
  details: z.array(z.unknown()).optional(),
  code: z
    .enum([
      "INVALID_MESSAGE",
      "VALIDATION_ERROR",
      "PATH_ERROR",
      "FILE_NOT_FOUND",
      "PERMISSION_DENIED",
      "RESOURCE_LIMIT_EXCEEDED",
      "UNKNOWN_ERROR",
    ])
    .optional(),
});

export const MessageResponse = z.union([SuccessResponse, ErrorResponse]);

export type MessageResponseType = z.infer<typeof MessageResponse>;
export type SuccessResponseType = z.infer<typeof SuccessResponse>;
export type ErrorResponseType = z.infer<typeof ErrorResponse>;

/**
 * Helper to create error response
 */
export function createErrorResponse(
  requestId: string,
  error: string,
  code?: ErrorResponseType["code"],
  details?: unknown[]
): ErrorResponseType {
  return {
    success: false,
    requestId,
    error,
    code,
    details,
  };
}

/**
 * Helper to create success response
 */
export function createSuccessResponse(
  requestId: string,
  data: unknown
): SuccessResponseType {
  return {
    success: true,
    requestId,
    data,
  };
}

export function createMessage<TType extends WebviewMessageType["type"]>(
  type: TType,
  payload: Extract<WebviewMessageType, { type: TType }> extends {
    payload: infer TPayload;
  }
    ? TPayload
    : never
) {
  return {
    id: crypto.randomUUID(),
    version: PROTOCOL_VERSION,
    timestamp: Date.now(),
    type,
    payload,
  } as WebviewMessageType;
}

/**
 * Validate a message from webview
 * @param message Raw message from webview
 * @returns Validation result with parsed message or errors
 */
export function validateMessage(message: unknown): {
  success: boolean;
  data?: WebviewMessageType;
  error?: string;
  details?: unknown[];
} {
  try {
    const result = WebviewMessage.safeParse(message);

    if (!result.success) {
      return {
        success: false,
        error: "Invalid message format",
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
