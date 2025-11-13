import {create} from 'zustand';
import type { StoreState} from '../types/store.ts';
import {UndoRedoManager} from './undo-redo';
import {useCallback} from "react";
import {applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange} from "@xyflow/react";
import * as Y from 'yjs';
import type {Edge} from "reactflow";
import {type EdgeType, getShapeDimensions, type LineStyle} from "../types/diagram.ts";

const useStore = create<StoreState>((set, get) => ({
    createOnNodesChange: (yDoc: Y.Doc, nodes: Node[], setNodes: (nodes: Node[]) => void) => {
        return useCallback((changes: NodeChange[]) => {
            if (!yDoc) return;

            const yNodes = yDoc.getMap('nodes');
            UndoRedoManager.makeChange(() => {
                changes.forEach(change => {
                    if (change.type === 'dimensions' && change.resizing === true) {
                        // Resize started - store current position
                        const node = nodes.find(n => n.id === change.id);
                        if (node) {
                            const updatedNode = {
                                ...node,
                                position: node.position
                            };
                            yNodes.set(change.id, updatedNode);
                        }
                    }
                });
            });
            const updatedNodes = applyNodeChanges(changes, nodes);
            setNodes(updatedNodes);

            const shouldSyncToYjs = changes.some(change =>
                change.type === 'remove' ||
                (change.type === 'position' && change.dragging === false) ||
                (change.type === 'dimensions' && change.resizing === false)
            );

            if (shouldSyncToYjs && yDoc) {
                UndoRedoManager.makeChange(() => {
                    changes.forEach(change => {
                        if (change.type === 'position' && change.dragging === false) {
                            const existingNode = yNodes.get(change.id);
                            if (existingNode) {
                                yNodes.set(change.id, {
                                    ...existingNode,
                                    position: change.position
                                });
                            }
                        } else if (change.type === 'dimensions' && change.resizing === false) {
                            const existingNode = yNodes.get(change.id);
                            if (existingNode && change.dimensions) {
                                yNodes.set(change.id, {
                                    ...existingNode,
                                    width: Math.max(20, change.dimensions.width),
                                    height: Math.max(20, change.dimensions.height),
                                });
                            }
                        } else if (change.type === 'remove') {
                            yNodes.delete(change.id);
                        }
                    });
                });
                UndoRedoManager.useDebouncedSave();
            }
        }, [yDoc, nodes]);
    },

    createOnEdgesChange: (yDoc: Y.Doc, setEdges: (edges: Edge[]) => void) => {
        return useCallback((changes: EdgeChange[]) => {
            if (!yDoc) return;

            const yEdgesMap = yDoc.getMap('edges');
            const currentEdges = Array.from(yEdgesMap.values());
            const updatedEdges = applyEdgeChanges(changes, currentEdges);
            setEdges(updatedEdges);

            UndoRedoManager.makeChange(() => {
                const yEdges = yDoc.getMap('edges');
                changes.forEach(change => {
                    if (change.type === 'remove') {
                        yEdges.delete(change.id);
                        UndoRedoManager.useDebouncedSave();
                    }
                });
            });
        }, [yDoc]);
    },

    createOnConnect: (yDoc: Y.Doc, selectedEdgeType: EdgeType, selectedLineStyle: LineStyle, provider: any) => {
        return useCallback((connection: Connection) => {
            if (!yDoc) return;

            UndoRedoManager.makeChange(() => {
                const yEdges = yDoc.getMap('edges');
                const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

                const newEdge: Edge = {
                    id: edgeId,
                    source: connection.source,
                    target: connection.target,
                    sourceHandle: connection.sourceHandle,
                    targetHandle: connection.targetHandle,
                    type: selectedEdgeType,
                    data: {
                        createdBy: provider?.awareness.clientID.toString(),
                        lastModifiedBy: provider?.awareness.clientID.toString(),
                        createdAt: Date.now(),
                        lineStyle: selectedLineStyle
                    }
                };
                yEdges.set(newEdge.id, newEdge);
                UndoRedoManager.useDebouncedSave();
            });
        }, [yDoc, selectedEdgeType, selectedLineStyle, provider]);
    },

    handleEdgeClick: (yDoc: Y.Doc, provider: any) => {
        return useCallback((edgeId: string, edgeType: EdgeType, lineStyle?: LineStyle, origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
            if (!yDoc) return;

            const userId = sessionStorage.getItem('user');
            UndoRedoManager.makeChange(() => {
                const yEdges = yDoc.getMap('edges');
                const existingEdge = yEdges.get(edgeId);

                if (existingEdge) {
                    const updatedEdge = {
                        ...existingEdge,
                        type: edgeType,
                        ...(origin === 'user' && userId && {
                            data: {
                                ...existingEdge.data,
                                lastModifiedBy: userId,
                                lastModifiedAt: Date.now(),
                                ...(lineStyle && {lineStyle})
                            }
                        })
                    };

                    if (lineStyle && (origin !== 'user' || !userId)) {
                        updatedEdge.data = {
                            ...updatedEdge.data,
                            lineStyle: lineStyle
                        };
                    }
                    yEdges.set(edgeId, updatedEdge);
                    UndoRedoManager.useDebouncedSave();
                }
            });
        }, [yDoc, provider]);
    },

    createNewShape: (reactFlowInstance: any, yDoc: Y.Doc, onShapeCreated: () => void, provider: any) => {
        return useCallback((shapeType: string) => {
            if (!reactFlowInstance || !yDoc) return;

            UndoRedoManager.makeChange(() => {
                const position = reactFlowInstance.screenToFlowPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                });
                const dimensions = getShapeDimensions(shapeType);
                const newNode: Node = {
                    id: `${shapeType}-${Date.now()}`,
                    type: 'default',
                    position,
                    data: {
                        label: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`,
                        shapeType: shapeType,
                        createdBy: provider?.awareness.clientID.toString(),
                        createdAt: Date.now()
                    },
                    width: dimensions.width,
                    height: dimensions.height,
                };
                const yNodes = yDoc.getMap('nodes');
                yNodes.set(newNode.id, newNode);
                UndoRedoManager.useDebouncedSave();
            });
            onShapeCreated();
        }, [reactFlowInstance, yDoc, onShapeCreated, provider]);
    },
    updateNodeLabel: (nodeId: string, label: string, origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
        if (!UndoRedoManager.yDoc || !UndoRedoManager.userId) {
            console.warn('Cannot update node label: store not initialized or no user');
            return;
        }

        // Get Y.js document reference from UndoRedoManager
        const yDoc = UndoRedoManager.yDoc;
        if (!yDoc) {
            console.warn('Cannot update node label: Y.js document not available');
            return;
        }

        const yNodes = yDoc.getMap('nodes');
        const existingNode = yNodes.get(nodeId);

        if (!existingNode) {
            console.warn(`Cannot update node label: node ${nodeId} not found`);
            return;
        }
        if (origin === 'user') {
            // Use UndoRedoManager for user actions (undoable)
            UndoRedoManager.makeChange(() => {
                const updatedNode = {
                    ...existingNode,
                    data: {
                        ...existingNode.data,
                        label: label,
                        lastModifiedBy: UndoRedoManager.userId,
                        lastModifiedAt: Date.now()
                    }
                };
                yNodes.set(nodeId, updatedNode);
                UndoRedoManager.useDebouncedSave();
            });
        }
    }
}));

export {useStore};