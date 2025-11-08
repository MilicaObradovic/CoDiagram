import type {Edge} from "reactflow";
import type { Node} from "@xyflow/react";
import * as Y from "yjs";

export interface StoreState {
    currentUserId: string | null;
    isInitialized: boolean;
    setCurrentUser: (userId: string) => void;
    initializeYjs: (doc: Y.Doc) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    addUserHistory: (state: HistoryState) => void;
    updateNodeLabel: (nodeId: string, label: string, origin: string) => void;
}


export interface HistoryState {
    nodes: Node[];
    edges: Edge[];
    type: string;
}