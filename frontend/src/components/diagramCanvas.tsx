import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    type Connection,
    ConnectionLineType,
    ConnectionMode,
    ControlButton,
    Controls,
    type EdgeChange,
    MiniMap,
    type Node,
    type NodeChange,
    type NodeMouseHandler,
    Panel,
    ReactFlow,
    type ReactFlowInstance
} from '@xyflow/react';
import 'reactflow/dist/style.css';
import {
    type CustomNodeData,
    type EdgeType,
    EdgeTypes,
    getShapeDimensions,
    type LineStyle,
    LineStyles,
    type ShapeType
} from "../types/diagram.ts";
import CustomNodeDiv from './customNodeDiv.tsx'
import DownloadButton from "./downloadButton.tsx";
import '@xyflow/react/dist/style.css';
import CustomEdge from './bidirectionalEdge.tsx';
import {useStore} from '../store';
import EdgeToolbar from "./edgeToolbar.tsx";
import {WebsocketProvider} from "y-websocket";
import * as Y from 'yjs';
import {CursorOverlay} from "./cursorOverlay.tsx";
import type {Edge} from "reactflow";
import {authApi} from "../services/service.ts";
import {useParams} from "react-router-dom";

interface DiagramCanvasProps {
    selectedShape: ShapeType;
    onShapeCreated: () => void;
    yDoc: Y.Doc | null;
    provider: WebsocketProvider | null;
}

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({selectedShape, onShapeCreated, yDoc, provider}) => {
    // Zustand store for undo/redo and state management
    const {undo, redo, canUndo, canRedo, setCurrentUser, addUserHistory, currentUserId} = useStore();
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [selectedEdgeType, setSelectedEdgeType] = useState<EdgeType>(EdgeTypes.STEP);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>(undefined);
    const [selectedLineStyle, setSelectedLineStyle] = useState<LineStyle>(LineStyles.SOLID);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const {id} = useParams();

    useEffect(() => {
        if (provider) {
            const userString = sessionStorage.getItem('user');
            const user = JSON.parse(userString);
            const userId = user.id;
            setCurrentUser(userId);
        }
    }, [provider]);

    useEffect(() => {
        if (!yDoc) return;

        const yNodes = yDoc.getMap('nodes');
        const yEdges = yDoc.getMap('edges');

        // Initial load
        setNodes(Array.from(yNodes.values()));
        setEdges(Array.from(yEdges.values()));

        // Listen for changes
        const nodesObserver = () => {
            setNodes(Array.from(yNodes.values()));
        };

        const edgesObserver = () => {
            setEdges(Array.from(yEdges.values()));
        };

        yNodes.observe(nodesObserver);
        yEdges.observe(edgesObserver);

        return () => {
            yNodes.unobserve(nodesObserver);
            yEdges.unobserve(edgesObserver);
        };
    }, [yDoc]);

    // Cursor management
    useEffect(() => {
        if (!provider || !yDoc) return;

        const yCursors = yDoc.getMap('cursors');
        const diagramContainer = document.getElementById('diagram-container');

        const handleMouseMove = (event: MouseEvent) => {
            const bounds = diagramContainer?.getBoundingClientRect();
            if (!bounds) return;

            const cursorPosition = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
                userId: provider.awareness.clientID,
                timestamp: Date.now()
            };

            yCursors.set(provider.awareness.clientID.toString(), cursorPosition);
        };

        const handleUserLeave = () => {
            const currentClients = Array.from(provider.awareness.getStates().keys());
            const cursorKeys = Array.from(yCursors.keys());

            cursorKeys.forEach(key => {
                if (!currentClients.includes(Number(key))) {
                    yCursors.delete(key);
                }
            });
        };

        if (diagramContainer) {
            diagramContainer.addEventListener('mousemove', handleMouseMove);
            provider.awareness.on('change', handleUserLeave);
        }

        return () => {
            if (diagramContainer) {
                diagramContainer.removeEventListener('mousemove', handleMouseMove);
            }
            provider.awareness.off('change', handleUserLeave);
            yCursors.delete(provider.awareness.clientID.toString());
        };
    }, [provider, yDoc]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        if (!yDoc) return;
        yDoc.transact(() => {
            const yNodes = yDoc.getMap('nodes');

            changes.forEach(change => {
                if (change.type === 'position') {
                    if (change.dragging !== false) {
                        const existingNode = yNodes.get(change.id);
                        if (existingNode) {
                            const updatedNode = {
                                ...existingNode,
                                position: change.position,
                                ...(currentUserId && {
                                    data: {
                                        ...existingNode.data,
                                        lastModifiedBy: currentUserId,
                                        lastModifiedAt: Date.now(),
                                    }
                                })
                            };
                            yNodes.set(change.id, updatedNode);
                        }
                    }
                } else if (change.type === 'dimensions') {
                    if (change.resizing === false) {
                        // Sync final resize value
                        const existingNode = yNodes.get(change.id);
                        if (existingNode && change.dimensions) {
                            const updatedNode = {
                                ...existingNode,
                                width: Math.max(20, change.dimensions.width),
                                height: Math.max(20, change.dimensions.height),
                                position: change.position ? change.position : existingNode.position,
                                ...(currentUserId && {
                                    data: {
                                        ...existingNode.data,
                                        lastModifiedBy: currentUserId,
                                        lastModifiedAt: Date.now(),
                                    }
                                })
                            };
                            yNodes.set(change.id, updatedNode);
                        }
                    }
                } else if (change.type === 'remove') {
                    yNodes.delete(change.id);
                }
            });
        });
        const shouldSaveHistory = changes.some(change =>
            change.type === 'remove' ||
            (change.type === 'position' && change.dragging === false) ||
            (change.type === 'dimensions' && change.resizing === false)
        );

        const updatedNodes = applyNodeChanges(changes, nodes);
        setNodes(updatedNodes);
        if (shouldSaveHistory) {
            addUserHistory({
                nodes: Array.from(yDoc.getMap('nodes').values()),
                edges: Array.from(yDoc.getMap('edges').values()),
                type: 'user'
            });
        }
    }, [yDoc, nodes, addUserHistory]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        if (!yDoc) return;

        let shouldSaveHistory = false;

        const yEdgesMap = yDoc.getMap('edges');
        const currentEdges = Array.from(yEdgesMap.values());
        const updatedEdges = applyEdgeChanges(changes, currentEdges);
        setEdges(updatedEdges); // Update your local state

        yDoc.transact(() => {
            const yEdges = yDoc.getMap('edges');

            changes.forEach(change => {
                console.log('Processing edge change:', change.type, change.id);
                if (change.type === 'remove') {
                    yEdges.delete(change.id);
                    shouldSaveHistory = true;
                }
            });
        });

        // Save to undo/redo history for significant changes
        if (shouldSaveHistory) {
            addUserHistory({
                nodes: Array.from(yDoc.getMap('nodes').values()),
                edges: Array.from(yDoc.getMap('edges').values()),
                type: 'user'
            });
        }

    }, [yDoc, provider, selectedEdgeType, selectedLineStyle, addUserHistory]);

    const onConnect = useCallback((connection: Connection) => {
        if (!yDoc) return;

        yDoc.transact(() => {
            const yEdges = yDoc.getMap('edges');

            // Generate unique edge ID
            const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

            const newEdge: Edge = {
                id: edgeId,
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle,
                type: selectedEdgeType,
                data: {
                    createdBy: currentUserId,
                    lastModifiedBy: currentUserId,
                    createdAt: Date.now(),
                    lineStyle: selectedLineStyle
                }
            };

            console.log('Creating new edge:', newEdge.id);
            yEdges.set(newEdge.id, newEdge);

            // Save to undo/redo history
            addUserHistory({
                nodes: Array.from(yDoc.getMap('nodes').values()),
                edges: Array.from(yEdges.values()),
                type: 'user'
            });
        });

    }, [yDoc, provider, selectedEdgeType, selectedLineStyle, addUserHistory]);

    const handleEdgeClick = useCallback((edgeId: string, edgeType: EdgeType, lineStyle?: LineStyle, origin: 'user' | 'yjs' | 'loaded' | 'undo-redo' = 'user') => {
        if (!yDoc) return;
        yDoc.transact(() => {
            const yEdges = yDoc.getMap('edges');
            const existingEdge = yEdges.get(edgeId);

            if (existingEdge) {
                const updatedEdge = {
                    ...existingEdge,
                    type: edgeType,
                    // Update last modified info for user actions
                    ...(origin === 'user' && currentUserId && {
                        data: {
                            ...existingEdge.data,
                            lastModifiedBy: currentUserId,
                            lastModifiedAt: Date.now(),
                            ...(lineStyle && {lineStyle})
                        }
                    })
                };

                // Handle lineStyle separately for non-user origins
                if (lineStyle && (origin !== 'user' || !currentUserId)) {
                    updatedEdge.data = {
                        ...updatedEdge.data,
                        lineStyle: lineStyle
                    };
                }

                yEdges.set(edgeId, updatedEdge);
                console.log('Updated edge style in Y.js:', edgeId, edgeType, lineStyle);
            }
        });

        // Save to user's history for user actions
        if (origin === 'user' && currentUserId) {
            addUserHistory({
                nodes: Array.from(yDoc.getMap('nodes').values()),
                edges: Array.from(yDoc.getMap('edges').values()),
                type: origin
            });
        }
    }, [yDoc, provider, addUserHistory]);

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const ctrl = event.ctrlKey ? 'Control-' : '';
        const alt = event.altKey ? 'Alt-' : '';
        const meta = event.metaKey ? 'Meta-' : '';
        const shift = event.shiftKey ? 'Shift-' : '';
        const key = `${ctrl}${alt}${shift}${meta}${event.key}`;
        if (key === 'Meta-z') undo();
        if (key === 'Shift-Meta-z') redo();
    };

    const createNewShape = useCallback((shapeType: string) => {
        if (!reactFlowInstance || !yDoc) {
            console.log('Cannot create shape: missing reactFlowInstance or yDoc');
            return;
        }

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
                createdBy: currentUserId,
                createdAt: Date.now(),
                lastModifiedBy: currentUserId
            },
            width: dimensions.width,
            height: dimensions.height,
        };

        // add to Yjs
        const yNodes = yDoc.getMap('nodes');
        yNodes.set(newNode.id, newNode);
        addUserHistory({
            nodes: Array.from(yNodes.values()),
            edges: Array.from(yDoc.getMap('edges').values()),
            type: 'user'
        });
        onShapeCreated();
    }, [reactFlowInstance, yDoc, onShapeCreated]);

    useEffect(() => {
        if (selectedShape && reactFlowInstance) {
            createNewShape(selectedShape);
        }
    }, [selectedShape, reactFlowInstance, createNewShape, onShapeCreated]);

    const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
        setEditingNodeId(node.id);
        const nodeData = node.data as unknown as CustomNodeData;
        setEditText(nodeData?.label || '');
    }, [editingNodeId]);

    const CustomNodeWithProps = useCallback((props: any) => (
        <CustomNodeDiv
            {...props}
            editingNodeId={editingNodeId}
            setEditingNodeId={setEditingNodeId}
            editText={editText}
            setEditText={setEditText}
            selected={props.selected}
            currentNode={nodes.find(node => node.id === props.id)}
        />
    ), [editingNodeId, editText]);

    const nodeTypes = useMemo(() => ({
        default: CustomNodeWithProps,
    }), [CustomNodeWithProps]);

    const edgeTypes = useMemo(() => ({
        [EdgeTypes.STEP]: CustomEdge,
        [EdgeTypes.SMOOTHSTEP]: CustomEdge,
        [EdgeTypes.STRAIGHT]: CustomEdge,
        [EdgeTypes.BEZIER]: CustomEdge,
        default: CustomEdge,
    }), []);

    const getConnectionLineType = useCallback((edgeType: EdgeType) => {
        switch (edgeType) {
            case EdgeTypes.STEP:
                return ConnectionLineType.Step;
            case EdgeTypes.SMOOTHSTEP:
                return ConnectionLineType.SmoothStep;
            case EdgeTypes.STRAIGHT:
                return ConnectionLineType.Straight;
            case EdgeTypes.BEZIER:
                return ConnectionLineType.SimpleBezier;
            default:
                return ConnectionLineType.Step;
        }
    }, []);

    const getConnectionLineStyle = useCallback((lineStyle: LineStyle) => {
        const baseStyle = {
            stroke: '#000000',
            strokeWidth: 1,
        };

        switch (lineStyle) {
            case LineStyles.DASHED:
                return {...baseStyle, strokeDasharray: '5,5'};
            case LineStyles.DOTTED:
                return {...baseStyle, strokeDasharray: '2,2'};
            case LineStyles.SOLID:
            default:
                return {...baseStyle, strokeDasharray: 'none'};
        }
    }, []);

    // Update defaultEdgeOptions based on selected edge type
    const defaultEdgeOptions = useMemo(() => ({
        type: selectedEdgeType,
        data: {
            lineStyle: selectedLineStyle
        },
        markerEnd: {
            type: 'arrowclosed',
            color: '#000000',
            width: 30,
            height: 30,
        },
    }), [selectedEdgeType, selectedLineStyle]);

    const onInit = (reactFlowInstance: {
        setViewport: (arg0: { x: number; y: number; zoom: number; }, arg1: { duration: number; }) => void;
    }) => {
        // Calculate center point of your translateExtent
        const translateExtent = [[-5000, -5000], [3000, 3000]];
        const centerX = (translateExtent[0][0] + translateExtent[1][0]) / 2;
        const centerY = (translateExtent[0][1] + translateExtent[1][1]) / 2;
        setReactFlowInstance(reactFlowInstance);
        // Center the viewport
        reactFlowInstance.setViewport({
            x: -centerX,
            y: -centerY,
            zoom: 1
        }, {duration: 0});
    };

    const useDebouncedSave = (diagramId: string | undefined, nodes: Node[], edges: Edge[], delay: number = 3000) => {
        const saveDiagram = useCallback(async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) return;

                await authApi.updateDiagram(diagramId, {nodes, edges}, token);
                console.log('Diagram auto-saved');
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, [diagramId, nodes, edges]);

        useEffect(() => {
            if (!diagramId || nodes.length === 0) return;

            const timer = setTimeout(saveDiagram, delay);
            return () => clearTimeout(timer);
        }, [saveDiagram, delay, diagramId, nodes.length]);
    };
    useDebouncedSave(id, nodes, edges, 3000);

    return (
        <div style={{width: '100%', height: '100%'}} className="flex relative">
            <div className="flex-1 relative" id="diagram-container">
                <ReactFlow
                    tabIndex={0}
                    translateExtent={[
                        [-5000, -5000],
                        [3000, 3000]
                    ]}
                    nodes={nodes}
                    edges={edges}
                    edgeTypes={edgeTypes}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onConnect={onConnect}
                    onInit={onInit}
                    onKeyDown={(e) => onKeyDown(e)}
                    onEdgeClick={(_event, edge) => {
                        setSelectedEdgeId(edge.id);
                        setSelectedEdgeType(edge.type as EdgeType || EdgeTypes.STEP);
                        setSelectedLineStyle(edge.data?.lineStyle || LineStyles.SOLID);
                    }}
                    onPaneClick={() => {
                        setSelectedEdgeId(undefined);
                    }}
                    defaultEdgeOptions={defaultEdgeOptions}
                    connectionLineType={getConnectionLineType(selectedEdgeType)}
                    connectionLineStyle={getConnectionLineStyle(selectedLineStyle)}
                    fitView={false}
                    minZoom={0.5}
                    maxZoom={1}
                    connectionMode={ConnectionMode.Loose}
                >
                    <Controls showZoom={true}
                              showFitView={false}
                              showInteractive={false}>
                        <ControlButton title="Undo"
                                       onClick={undo}
                                       disabled={!canUndo?.()}>
                            <div style={{fontSize: 24}}>&#x27F2;</div>
                        </ControlButton>
                        <ControlButton title="Redo"
                                       onClick={redo}
                                       disabled={!canRedo?.()}>
                            <div style={{fontSize: 24}}>&#x27F3;</div>
                        </ControlButton>
                        <DownloadButton/>
                    </Controls>
                    <Panel position="top-right" style={{right: 10, top: '30%', transform: 'translateY(-50%)'}}>
                        <EdgeToolbar
                            selectedEdgeType={selectedEdgeType}
                            onEdgeTypeSelect={setSelectedEdgeType}
                            selectedEdgeId={selectedEdgeId}
                            onUpdateEdge={handleEdgeClick}
                            selectedLineStyle={selectedLineStyle}
                            onLineStyleSelect={setSelectedLineStyle}
                        />
                    </Panel>
                    <MiniMap
                        nodeBorderRadius={8}
                        nodeColor={(node) => {
                            // Color nodes based on their background color
                            return node.style?.background as string || 'gray';
                        }}
                        position="bottom-right"
                        style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                        }}
                    />
                    <Background gap={20} size={1}/>
                    <CursorOverlay yDoc={yDoc} provider={provider}/>
                </ReactFlow>
            </div>
        </div>
    );
};

export default DiagramCanvas;