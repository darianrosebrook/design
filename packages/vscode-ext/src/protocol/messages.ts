/**
 * @fileoverview Secure message protocol for Designer VS Code extension
 * @author @darianrosebrook
 *
 * All messages between webview and extension are validated with Zod schemas
 * to prevent security vulnerabilities and ensure type safety.
 */

import { z } from "zod";
import {
  CanvasDocument,
  ULID,
  Patch,
} from "@paths-design/designer/canvas-schema";

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
 * Union of all request message types
 */
export const WebviewMessage = z.discriminatedUnion("type", [
  LoadDocumentRequest,
  SaveDocumentRequest,
  UpdateNodeRequest,
  ListDocumentsRequest,
  ValidateDocumentRequest,
]);

export type WebviewMessageType = z.infer<typeof WebviewMessage>;
export type LoadDocumentRequestType = z.infer<typeof LoadDocumentRequest>;
export type SaveDocumentRequestType = z.infer<typeof SaveDocumentRequest>;
export type UpdateNodeRequestType = z.infer<typeof UpdateNodeRequest>;
export type ListDocumentsRequestType = z.infer<typeof ListDocumentsRequest>;
export type ValidateDocumentRequestType = z.infer<
  typeof ValidateDocumentRequest
>;

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
