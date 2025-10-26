import type {Edge, OnEdgesChange} from "reactflow";
import type {OnConnect, Node, OnNodesChange} from "@xyflow/react";
import type {EdgeType} from "./diagram.ts";

export type StoreState = {
    nodes: Node[];
    edges: Edge[];
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    nextNodeId: number,
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    updateNodeLabel: (nodeId: string, label: string) => void;
    updateEdgeLabel: (nodeId: string, label: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => void;
    canRedo: () => void;
    onEdgeClick: (edgeId: string, edgeType:EdgeType) => void;
};

export interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}