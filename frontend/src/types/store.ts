import type {Edge} from "reactflow";
import type {Node} from "@xyflow/react";

export interface StoreState {
    updateNodeLabel: (nodeId: string, label: string, origin: string) => void;
}

export interface HistoryState {
    nodes: Node[];
    edges: Edge[];
    type: string;
}