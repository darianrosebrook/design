/**
 * @fileoverview Conflict detection for Designer canvas documents
 * Aligned with Phase 2 merge strategy planning.
 * author @darianrosebrook
 */

import {
  // type CanvasDocumentType, // TODO: Remove if not needed
  type Conflict,
  type ConflictCategory,
  type ConflictDetectionOptions,
  type ConflictDetectionResult,
  type ConflictSeverity,
  type MergeDocuments,
  type NodeSnapshot,
} from "./types.js";
import { buildNodeIndex, sortConflicts } from "./utils.js";

export interface ConflictDetectorContext {
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
    conflicts.push(...detectContentConflicts(context));
  }

  if (resolvedOptions.enableMetadata) {
    conflicts.push(...detectMetadataConflicts(context));
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
    const _baseParent = baseSnapshot.parentId;
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

  // Case: Child ordering conflicts (S-ORDER)
  const orderConflicts = detectOrderConflicts(context);
  conflicts.push(...orderConflicts);

  return conflicts;
}

/**
 * Detect S-ORDER conflicts: when children of a container are reordered differently
 */
function detectOrderConflicts(context: ConflictDetectorContext): Conflict[] {
  const { baseIndex, localIndex, remoteIndex } = context;
  const conflicts: Conflict[] = [];

  // Find all parent IDs that exist in all three versions
  const baseParents = new Set(baseIndex.byParent.keys());
  const localParents = new Set(localIndex.byParent.keys());
  const remoteParents = new Set(remoteIndex.byParent.keys());

  const commonParents = new Set<string | undefined>();
  for (const parentId of baseParents) {
    if (localParents.has(parentId) && remoteParents.has(parentId)) {
      commonParents.add(parentId);
    }
  }

  for (const parentId of commonParents) {
    const baseChildren =
      baseIndex.byParent.get(parentId as string | undefined) || [];
    const localChildren =
      localIndex.byParent.get(parentId as string | undefined) || [];
    const remoteChildren =
      remoteIndex.byParent.get(parentId as string | undefined) || [];

    // Skip if any version has no children or different child counts
    if (
      baseChildren.length === 0 ||
      localChildren.length !== baseChildren.length ||
      remoteChildren.length !== baseChildren.length
    ) {
      continue;
    }

    // Check if the sets of children are the same
    const baseChildIds = baseChildren.map((c) => c.node.id).sort();
    const localChildIds = localChildren.map((c) => c.node.id).sort();
    const remoteChildIds = remoteChildren.map((c) => c.node.id).sort();

    if (
      JSON.stringify(baseChildIds) !== JSON.stringify(localChildIds) ||
      JSON.stringify(baseChildIds) !== JSON.stringify(remoteChildIds)
    ) {
      continue; // Different sets of children, not an ordering conflict
    }

    // Get the ordering of children in each version
    const baseOrder = baseChildren.map((c) => c.node.id);
    const localOrder = localChildren.map((c) => c.node.id);
    const remoteOrder = remoteChildren.map((c) => c.node.id);

    // Check if both local and remote have different orderings from base
    const localDiffers =
      JSON.stringify(baseOrder) !== JSON.stringify(localOrder);
    const remoteDiffers =
      JSON.stringify(baseOrder) !== JSON.stringify(remoteOrder);
    const branchesDiffer =
      JSON.stringify(localOrder) !== JSON.stringify(remoteOrder);

    if (localDiffers && remoteDiffers && branchesDiffer) {
      // Get the parent snapshot to construct the path
      const parentSnapshot = parentId
        ? baseIndex.byId.get(parentId)
        : undefined;
      if (parentSnapshot) {
        conflicts.push(
          createConflict({
            id: parentId ?? "root",
            type: "structural",
            code: "S-ORDER",
            severity: "info",
            path: [...parentSnapshot.path, "children"],
            autoResolvable: true,
            resolutionStrategy: "prefer-local",
            baseValue: baseOrder,
            localValue: localOrder,
            remoteValue: remoteOrder,
            message: `Child ordering conflicts for container "${parentSnapshot.node.name}"`,
          })
        );
      }
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

    // Check for layout conflicts: either all three have layout and differ,
    // or base has no layout but both branches add different layouts
    const hasLayoutConflict =
      baseLayout && localLayout && remoteLayout
        ? // All have layout - check if they differ from base and each other
          !layoutsEqual(baseLayout, localLayout) &&
          !layoutsEqual(baseLayout, remoteLayout) &&
          !layoutsEqual(localLayout, remoteLayout)
        : // Base has no layout - check if both branches add different layouts
          !baseLayout &&
          localLayout &&
          remoteLayout &&
          !layoutsEqual(localLayout, remoteLayout);

    if (hasLayoutConflict) {
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

    // P-STYLE: Style property conflicts (fills, strokes, opacity, shadow)
    const baseFills = baseSnapshot?.node.fills;
    const localFills = localSnapshot.node.fills;
    const remoteFills = remoteSnapshot.node.fills;

    const baseStrokes = baseSnapshot?.node.strokes;
    const localStrokes = localSnapshot.node.strokes;
    const remoteStrokes = remoteSnapshot.node.strokes;

    const baseOpacity = baseSnapshot?.node.opacity;
    const localOpacity = localSnapshot.node.opacity;
    const remoteOpacity = remoteSnapshot.node.opacity;

    const baseShadow = baseSnapshot?.node.shadow;
    const localShadow = localSnapshot.node.shadow;
    const remoteShadow = remoteSnapshot.node.shadow;

    // Check if any style properties differ
    const styleProperties = [
      {
        name: "fills",
        base: baseFills,
        local: localFills,
        remote: remoteFills,
      },
      {
        name: "strokes",
        base: baseStrokes,
        local: localStrokes,
        remote: remoteStrokes,
      },
      {
        name: "opacity",
        base: baseOpacity,
        local: localOpacity,
        remote: remoteOpacity,
      },
      {
        name: "shadow",
        base: baseShadow,
        local: localShadow,
        remote: remoteShadow,
      },
    ];

    for (const prop of styleProperties) {
      const baseStr = prop.base ? JSON.stringify(prop.base) : "";
      const localStr = prop.local ? JSON.stringify(prop.local) : "";
      const remoteStr = prop.remote ? JSON.stringify(prop.remote) : "";

      const localDiffers = baseStr !== localStr;
      const remoteDiffers = baseStr !== remoteStr;
      const branchesDiff = localStr !== remoteStr;

      if (localDiffers && remoteDiffers && branchesDiff) {
        conflicts.push(
          createConflict({
            id,
            type: "property",
            code: "P-STYLE",
            severity: "info",
            path: localSnapshot.path.concat(prop.name),
            autoResolvable: false,
            baseValue: prop.base,
            localValue: prop.local,
            remoteValue: prop.remote,
            message: `Style ${prop.name} conflicts for node ${id}`,
          })
        );
        break; // Only report one style conflict per node
      }
    }
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

function detectContentConflicts(context: ConflictDetectorContext): Conflict[] {
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

    // C-TEXT: Text content conflicts
    if (
      localSnapshot.node.type === "text" &&
      remoteSnapshot.node.type === "text"
    ) {
      const baseText =
        baseSnapshot?.node.type === "text" ? baseSnapshot.node.text : undefined;
      const localText = localSnapshot.node.text;
      const remoteText = remoteSnapshot.node.text;

      const localDiffers = baseText !== localText;
      const remoteDiffers = baseText !== remoteText;
      const branchesDiff = localText !== remoteText;

      if (localDiffers && remoteDiffers && branchesDiff) {
        conflicts.push(
          createConflict({
            id,
            type: "content",
            code: "C-TEXT",
            severity: "warning",
            path: localSnapshot.path.concat("text"),
            autoResolvable: false,
            baseValue: baseText,
            localValue: localText,
            remoteValue: remoteText,
            message: `Text content conflicts for node ${id}`,
          })
        );
      }
    }

    // C-COMPONENT-PROPS: Component property conflicts
    if (
      localSnapshot.node.type === "component" &&
      remoteSnapshot.node.type === "component" &&
      localSnapshot.node.componentKey === remoteSnapshot.node.componentKey
    ) {
      const baseProps =
        baseSnapshot?.node.type === "component"
          ? baseSnapshot.node.props
          : undefined;
      const localProps = localSnapshot.node.props;
      const remoteProps = remoteSnapshot.node.props;

      const localPropsStr = JSON.stringify(localProps);
      const remotePropsStr = JSON.stringify(remoteProps);
      const basePropsStr = baseProps ? JSON.stringify(baseProps) : "";

      const localDiffers = basePropsStr !== localPropsStr;
      const remoteDiffers = basePropsStr !== remotePropsStr;
      const branchesDiff = localPropsStr !== remotePropsStr;

      if (localDiffers && remoteDiffers && branchesDiff) {
        conflicts.push(
          createConflict({
            id,
            type: "content",
            code: "C-COMPONENT-PROPS",
            severity: "warning",
            path: localSnapshot.path.concat("props"),
            autoResolvable: false,
            baseValue: baseProps,
            localValue: localProps,
            remoteValue: remoteProps,
            message: `Component props conflicts for "${localSnapshot.node.componentKey}" instance ${id}`,
          })
        );
      }
    }

    // C-TOKENS: Token reference vs literal conflicts (future: when token system is implemented)
    // This would detect when one branch uses a token reference and another uses a literal value
  }

  return conflicts;
}

function detectMetadataConflicts(context: ConflictDetectorContext): Conflict[] {
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

    // M-NAME: Node name conflicts
    const baseName = baseSnapshot?.node.name;
    const localName = localSnapshot.node.name;
    const remoteName = remoteSnapshot.node.name;

    const localDiffers = baseName !== localName;
    const remoteDiffers = baseName !== remoteName;
    const branchesDiff = localName !== remoteName;

    if (localDiffers && remoteDiffers && branchesDiff) {
      conflicts.push(
        createConflict({
          id,
          type: "metadata",
          code: "M-NAME",
          severity: "info",
          path: localSnapshot.path.concat("name"),
          autoResolvable: true,
          resolutionStrategy: "prefer-remote",
          baseValue: baseName,
          localValue: localName,
          remoteValue: remoteName,
          message: `Node name conflicts for node ${id}`,
        })
      );
    }

    // M-TAGS: Tag/annotation conflicts (future: when tag system is implemented)
    // This would detect when tags/annotations diverge between branches
  }

  return conflicts;
}
