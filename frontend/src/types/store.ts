import type {Edge, OnEdgesChange} from "reactflow";
import type {OnConnect, Node, OnNodesChange} from "@xyflow/react";
import type {EdgeType, LineStyle} from "./diagram.ts";
import * as Y from "yjs";

export type StoreState = {
    nodes: Node[];
    edges: Edge[];
    yDoc: Y.Doc;
    isInitialized: boolean;
    initializeYjs: (doc: Y.Doc)=>void;
    setNodes: (nodes: Node[], origin:string) => void;
    setEdges: (edges: Edge[], origin:string) => void;
    nextNodeId: number,
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    updateNodeLabel: (nodeId: string, label: string) => void;
    updateEdgeLabel: (nodeId: string, label: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    onEdgeClick: (edgeId: string, edgeType:EdgeType, lineStyle?: LineStyle) => void;
};

export interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}