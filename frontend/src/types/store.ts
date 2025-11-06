import type {Edge, OnEdgesChange} from "reactflow";
import type {OnConnect, Node, OnNodesChange} from "@xyflow/react";
import type {EdgeType, LineStyle} from "./diagram.ts";
import * as Y from "yjs";

export type StoreState = {
    nodes: Node[];
    edges: Edge[];
    yDoc: Y.Doc;
    currentUserId: string | null;
    setCurrentUser: (userId: string) => void;
    isInitialized: boolean;
    initializeYjs: (doc: Y.Doc)=>void;
    createNode: (node: Node) => void;
    setLoadedNodesAndEdges: (nodes: Node[], edges: Edge[])=>void;
    setNodes: (nodes: Node[], origin:string) => void;
    setEdges: (edges: Edge[], origin:string) => void;
    nextNodeId: number,
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    updateNodeLabel: (nodeId: string, label: string, origin?: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    onEdgeClick: (edgeId: string, edgeType: EdgeType, lineStyle?: LineStyle, origin?: string) => void;
};

export interface HistoryState {
    nodes: Node[];
    edges: Edge[];
    type: string;
}