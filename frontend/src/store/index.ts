import { create } from 'zustand';

import type {StoreState} from '../types/store.ts';
import { UndoRedo } from './undo-redo';
import {addEdge, type Edge, updateEdge} from "reactflow";
import {applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange} from "@xyflow/react";

UndoRedo.addHistory({nodes: [], edges: []});

// useStore hook that can be used in components to get parts of the store and call actions
const useStore = create<StoreState>((set, get) => ({
    nodes: [],
    edges: [],
    nextNodeId: 1,

    setNodes: (nodes: Node[]) => {
        set({nodes});
        UndoRedo.addHistory({nodes: get().nodes, edges: get().edges}); // Add history
    },
    setEdges: (edges: Edge[]) => {
        set({edges});
        UndoRedo.addHistory({nodes: get().nodes, edges: get().edges}); // Add history
    },
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
        const shouldSaveHistory = changes.some(change =>
            change.type === 'remove' ||
            (change.type === 'position' && change.dragging === false) // Only when drag ends
        );

        if (shouldSaveHistory) {
            UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
        }
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        const edges = get().edges;
        const connectionEdge: Edge[] = [];
        const pattern = `${changes.length}-${changes[0]?.type}-${changes[1]?.type}`;
        // When a node removed with 1 in edge and 1 out edge, add a connection ege
        if (pattern === '2-remove-remove') {
            const edge1 = edges.find(el => el.id === (changes[0] as any).id);
            const edge2 = edges.find(el => el.id === (changes[1] as any).id);
            if (edge1 && edge2 && edge1.target === edge2.source) {
                connectionEdge.push({...edge1, ...{target: edge2.target}});
            }
        }
        set({ edges: applyEdgeChanges(changes, edges).concat(connectionEdge) });
        const shouldSaveHistory = changes.some(change =>
            change.type === 'remove'
        );

        if (shouldSaveHistory) {
            UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
        }
    },

    onEdgeUpdate: (oldEdge, newConnection) => {
        // replace the updated edge id as the format of source-target
        const newId = `${newConnection.source}-${newConnection.target}`
        const edges = get().edges;
        const oldEdgeNdx = edges.findIndex(el => el.id === oldEdge.id);
        oldEdge.id = newId;
        edges[oldEdgeNdx].id = newId;

        set({
            edges: updateEdge(oldEdge, newConnection, edges)
        });

        UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
    },

    onConnect: (connection: Connection) => {
        const existingEdges: any[] = get().edges;
        const newEdges = addEdge(connection, existingEdges);
        set({ edges: newEdges });
        UndoRedo.addHistory({ nodes: get().nodes, edges: newEdges });
    },

    updateNodeLabel: (nodeId: string, label: string) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) {
                    node.data = { ...node.data, label }; // it's important to create a new object here
                }

                return node;
            }),
        });
        UndoRedo.addHistory({nodes: get().nodes, edges: get().edges});
    },

    updateEdgeLabel: (edgeId: string, label: string) => {
        set({
            edges: get().edges.map((edge) => {
                if (edge.id === edgeId) {
                    edge.label = label;
                }

                return edge;
            }),
        });
    },

    undo: () => {
        const state = UndoRedo.undo();
        if (state) {
            set({nodes: state.nodes, edges: state.edges});
        }
    },

    redo: () => {
        const state = UndoRedo.redo();
        if (state) {
            set({nodes: state.nodes, edges: state.edges});
        }
    },
    canUndo: () => UndoRedo.canUndo(),
    canRedo: () => UndoRedo.canRedo(),
}));

export { useStore };
