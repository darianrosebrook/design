/**
 * @fileoverview Conflict detection for Designer canvas documents
 * Aligned with Phase 2 merge strategy planning.
 * author @darianrosebrook
 */

import {
  type CanvasDocumentType,
  type Conflict,
  type ConflictCategory,
  type ConflictDetectionOptions,
  type ConflictDetectionResult,
  type ConflictSeverity,
  type MergeDocuments,
  type NodeSnapshot,
} from "./types.js";
import { buildNodeIndex, sortConflicts } from "./utils.js";

interface ConflictDetectorContext {
  documents: MergeDocuments;
  baseIndex: ReturnType<typeof buildNodeIndex>;
  localIndex: ReturnType<typeof buildNodeIndex>;
  remoteIndex: ReturnType<typeof buildNodeIndex>;
}

const DEFAULT_OPTIONS: Required<ConflictDetectionOptions> = {
  enableStructural: true,
  enableProperty: true,
  enableContent: true,
  enableMetadata: true,
};

/**
 * Detect conflicts between base, local, remote documents.
 */
export function detectConflicts(
  documents: MergeDocuments,
  options: ConflictDetectionOptions = {}
): ConflictDetectionResult {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const context: ConflictDetectorContext = {
    documents,
    baseIndex: buildNodeIndex(documents.base),
    localIndex: buildNodeIndex(documents.local),
    remoteIndex: buildNodeIndex(documents.remote),
  };

  const conflicts: Conflict[] = [];

  if (resolvedOptions.enableStructural) {
    conflicts.push(...detectStructuralConflicts(context));
  }

  if (resolvedOptions.enableProperty) {
    conflicts.push(...detectPropertyConflicts(context));
  }

  if (resolvedOptions.enableContent) {
    // TODO: Content conflict detection (C-*) coming next iteration
  }

  if (resolvedOptions.enableMetadata) {
    // TODO: Metadata conflict detection (M-*) coming next iteration
  }

  return {
    conflicts: sortConflicts(conflicts),
    warnings: [],
  };
}

function detectStructuralConflicts(
  context: ConflictDetectorContext
): Conflict[] {
  const { baseIndex, localIndex, remoteIndex } = context;
  const conflicts: Conflict[] = [];

  const baseIds = new Set(baseIndex.byId.keys());
  const localIds = new Set(localIndex.byId.keys());
  const remoteIds = new Set(remoteIndex.byId.keys());

  const allIds = new Set<string>([...baseIds, ...localIds, ...remoteIds]);

  for (const id of allIds) {
    const baseSnapshot = baseIndex.byId.get(id);
    const localSnapshot = localIndex.byId.get(id);
    const remoteSnapshot = remoteIndex.byId.get(id);

    // Case: Node deleted locally but exists in remote (and base)
    if (
      baseSnapshot &&
      !localSnapshot &&
      remoteSnapshot &&
      !isRootSnapshot(remoteSnapshot)
    ) {
      conflicts.push(
        createConflict({
          id,
          type: "structural",
          code: "S-DEL-MOD",
          severity: "error",
          path: remoteSnapshot.path,
          autoResolvable: false,
          baseValue: baseSnapshot.node,
          localValue: undefined,
          remoteValue: remoteSnapshot.node,
          message: `Node ${id} deleted locally but modified remotely`,
        })
      );
      continue;
    }

    // Case: Node deleted remotely but exists in local
    if (
      baseSnapshot &&
      localSnapshot &&
      !remoteSnapshot &&
      !isRootSnapshot(localSnapshot)
    ) {
      conflicts.push(
        createConflict({
          id,
          type: "structural",
          code: "S-DEL-MOD",
          severity: "error",
          path: localSnapshot.path,
          autoResolvable: false,
          baseValue: baseSnapshot.node,
          localValue: localSnapshot.node,
          remoteValue: undefined,
          message: `Node ${id} deleted remotely but modified locally`,
        })
      );
      continue;
    }

    // Case: Node added in both branches with same ID but different data
    if (
      !baseSnapshot &&
      localSnapshot &&
      remoteSnapshot &&
      !isRootSnapshot(localSnapshot)
    ) {
      conflicts.push(
        createConflict({
          id,
          type: "structural",
          code: "S-ADD-ADD",
          severity: "warning",
          path: localSnapshot.path,
          autoResolvable: false,
          baseValue: undefined,
          localValue: localSnapshot.node,
          remoteValue: remoteSnapshot.node,
          message: `Node ${id} added in both local and remote branches`,
        })
      );
      continue;
    }

    if (!baseSnapshot || !localSnapshot || !remoteSnapshot) {
      continue; // other cases handled elsewhere
    }

    // Case: Node moved to different parents
    const parentLocal = localSnapshot.parentId;
    const parentRemote = remoteSnapshot.parentId;
    const baseParent = baseSnapshot.parentId;
    if (
      baseSnapshot.parentId &&
      parentLocal &&
      parentRemote &&
      parentLocal !== parentRemote &&
      baseSnapshot.parentId !== parentLocal &&
      baseSnapshot.parentId !== parentRemote &&
      localSnapshot.node.type === "frame" &&
      remoteSnapshot.node.type === "frame"
    ) {
      conflicts.push(
        createConflict({
          id,
          type: "structural",
          code: "S-MOVE-MOVE",
          severity: "warning",
          path: localSnapshot.path,
          autoResolvable: false,
          baseValue: baseSnapshot.parentId,
          localValue: parentLocal,
          remoteValue: parentRemote,
          message: `Node ${id} moved to different parents (local: ${parentLocal}, remote: ${parentRemote})`,
        })
      );
    }
  }

  return conflicts;
}

function detectPropertyConflicts(context: ConflictDetectorContext): Conflict[] {
  const { baseIndex, localIndex, remoteIndex } = context;
  const conflicts: Conflict[] = [];

  const nodeIds = new Set<string>([
    ...baseIndex.byId.keys(),
    ...localIndex.byId.keys(),
    ...remoteIndex.byId.keys(),
  ]);

  for (const id of nodeIds) {
    const baseSnapshot = baseIndex.byId.get(id);
    const localSnapshot = localIndex.byId.get(id);
    const remoteSnapshot = remoteIndex.byId.get(id);

    if (!localSnapshot || !remoteSnapshot) {
      continue;
    }

    // P-GEOMETRY: Frame geometry conflicts
    const baseFrame = baseSnapshot?.node.frame;
    const localFrame = localSnapshot.node.frame;
    const remoteFrame = remoteSnapshot.node.frame;

    const localDiffersFromBase =
      baseFrame &&
      (localFrame.x !== baseFrame.x ||
        localFrame.y !== baseFrame.y ||
        localFrame.width !== baseFrame.width ||
        localFrame.height !== baseFrame.height);

    const remoteDiffersFromBase =
      baseFrame &&
      (remoteFrame.x !== baseFrame.x ||
        remoteFrame.y !== baseFrame.y ||
        remoteFrame.width !== baseFrame.width ||
        remoteFrame.height !== baseFrame.height);

    const localDiffersFromRemote =
      localFrame.x !== remoteFrame.x ||
      localFrame.y !== remoteFrame.y ||
      localFrame.width !== remoteFrame.width ||
      localFrame.height !== remoteFrame.height;

    if (
      localDiffersFromBase &&
      remoteDiffersFromBase &&
      localDiffersFromRemote
    ) {
      conflicts.push(
        createConflict({
          id,
          type: "property",
          code: "P-GEOMETRY",
          severity: "warning",
          path: localSnapshot.path.concat("frame"),
          autoResolvable: false,
          baseValue: baseFrame,
          localValue: localFrame,
          remoteValue: remoteFrame,
          message: `Frame geometry conflicts for node ${id}`,
        })
      );
    }

    // P-VISIBILITY: Visibility conflicts
    const baseVisibility = baseSnapshot?.node.visible ?? true;
    const localVisibility = localSnapshot.node.visible ?? true;
    const remoteVisibility = remoteSnapshot.node.visible ?? true;

    const branchesDiffer = localVisibility !== remoteVisibility;
    const differsFromBase =
      baseVisibility !== localVisibility || baseVisibility !== remoteVisibility;

    if (branchesDiffer && differsFromBase) {
      conflicts.push(
        createConflict({
          id,
          type: "property",
          code: "P-VISIBILITY",
          severity: "info",
          path: localSnapshot.path.concat("visible"),
          autoResolvable: false,
          baseValue: baseVisibility,
          localValue: localVisibility,
          remoteValue: remoteVisibility,
          message: `Visibility conflicts for node ${id}`,
        })
      );
    }

    // P-LAYOUT: Layout conflicts
    const baseLayout = baseSnapshot?.node.layout;
    const localLayout = localSnapshot.node.layout;
    const remoteLayout = remoteSnapshot.node.layout;

    if (baseLayout && localLayout && remoteLayout) {
      const localDiffers = !layoutsEqual(baseLayout, localLayout);
      const remoteDiffers = !layoutsEqual(baseLayout, remoteLayout);
      const branchesDiff = !layoutsEqual(localLayout, remoteLayout);

      if (localDiffers && remoteDiffers && branchesDiff) {
        conflicts.push(
          createConflict({
            id,
            type: "property",
            code: "P-LAYOUT",
            severity: "warning",
            path: localSnapshot.path.concat("layout"),
            autoResolvable: false,
            baseValue: baseLayout,
            localValue: localLayout,
            remoteValue: remoteLayout,
            message: `Layout conflicts for node ${id}`,
          })
        );
      }
    }

    // TODO: Add P-STYLE (style attributes) conflicts
  }

  return conflicts;
}

function isRootSnapshot(snapshot?: NodeSnapshot): boolean {
  return snapshot?.parentId === undefined;
}

interface CreateConflictParams {
  id: string;
  type: ConflictCategory;
  code: string;
  severity: ConflictSeverity;
  path: string[];
  autoResolvable: boolean;
  resolutionStrategy?: import("./types.js").ResolutionStrategy;
  baseValue?: unknown;
  localValue?: unknown;
  remoteValue?: unknown;
  message: string;
}

function createConflict(params: CreateConflictParams): Conflict {
  return {
    ...params,
    path: params.path,
    message: params.message,
    id: params.id,
    // Use deterministic conflict IDs in future if required
    // conflictId: generateConflictId(),
  };
}

function layoutsEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
