import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Background,
    ConnectionLineType,
    ConnectionMode,
    ControlButton,
    Controls,
    MiniMap,
    type Node,
    type NodeMouseHandler, Panel,
    ReactFlow,
    type ReactFlowInstance
} from '@xyflow/react';
import 'reactflow/dist/style.css';
import {
    type CustomNodeData,
    type EdgeType,
    EdgeTypes, getShapeDimensions,
    type LineStyle, LineStyles,
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


interface DiagramCanvasProps {
    selectedShape: ShapeType;
    onShapeCreated: () => void;
    yDoc: Y.Doc | null;
    provider:WebsocketProvider | null;
}

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({selectedShape, onShapeCreated, yDoc, provider}) => {
    // Zustand store for undo/redo and state management
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        undo,
        redo,
        canUndo,
        canRedo,
        onEdgeClick,
        setNodes,
        setEdges,
        createNode,
    } = useStore();
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [selectedEdgeType, setSelectedEdgeType] = useState<EdgeType>(EdgeTypes.STEP);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>(undefined);
    const [selectedLineStyle, setSelectedLineStyle] = useState<LineStyle>(LineStyles.SOLID);


    // Yjs -> React Flow synchronization
    useEffect(() => {
        if (!yDoc) return;

        const yNodes = yDoc.getMap('nodes');
        const yEdges = yDoc.getMap('edges');

        // Set up observers for Yjs -> React Flow sync
        yNodes.observe(() => {
            const yjsNodes = Array.from(yNodes.values());
            setNodes(yjsNodes, "yjs");
        });

        yEdges.observe(() => {
            const yjsEdges = Array.from(yEdges.values());
            setEdges(yjsEdges, "yjs");
        });

        return () => {
            // Cleanup observers if needed
        };
    }, [yDoc, setNodes, setEdges]);

    useEffect(() => {
        if (!yDoc) return;

        const yNodes = yDoc.getMap('nodes');
        const yEdges = yDoc.getMap('edges');
        const originalOnNodesChange = useStore.getState().onNodesChange;
        const originalOnEdgesChange = useStore.getState().onEdgesChange;
        const originalOnConnect = useStore.getState().onConnect;

        useStore.setState({
            onNodesChange: (changes) => {
                changes.forEach(change => {
                    if (change.type === 'add') {
                        yNodes.set(change.item.id, change.item);
                    } else if (change.type === 'remove') {
                        yNodes.delete(change.id);
                    } else if (change.type === 'position') {
                        // Skip position changes during resize
                        if (change.dragging !== false) { // Only sync when not dragging
                            const existingNode = yNodes.get(change.id);
                            if (existingNode) {
                                const updatedNode = {
                                    ...existingNode,
                                    position: change.position
                                };
                                yNodes.set(change.id, updatedNode);
                            }
                        }
                    } else if (change.type === 'dimensions') {
                        // Only sync when resize ends or use debounce for final value
                        if (change.resizing === false) {
                            // Sync final resize value
                            const existingNode = yNodes.get(change.id);
                            if (existingNode && change.dimensions) {
                                const updatedNode = {
                                    ...existingNode,
                                    width: Math.max(20, change.dimensions.width),
                                    height: Math.max(20, change.dimensions.height),
                                    position: change.position ? change.position : existingNode.position
                                };
                                yNodes.set(change.id, updatedNode);
                            }
                        }
                    } else if (change.type === 'select') {
                        const existingNode = yNodes.get(change.id);
                        if (existingNode) {
                            const updatedNode = {
                                ...existingNode,
                                selected: change.selected
                            };
                            yNodes.set(change.id, updatedNode);
                        }
                    }
                });

                originalOnNodesChange(changes);
            },
            onEdgesChange: (changes) => {
                changes.forEach(change => {
                    console.log('🔵 Processing edge change:', change.type, change.id);

                    if (change.type === 'add') {
                        yEdges.set(change.item.id, change.item);
                        console.log('Added edge to Y.js:', change.item.id);
                    } else if (change.type === 'remove') {
                        yEdges.delete(change.id);
                        console.log('Removed edge from Y.js:', change.id);
                    } else if (change.type === 'select') {
                        console.log('🔵 Edge selection change:', change.id, change.selected);
                        const existingEdge = yEdges.get(change.id);
                        if (existingEdge) {
                            const updatedEdge = {
                                ...existingEdge,
                                selected: change.selected
                            };
                            yEdges.set(change.id, updatedEdge);
                            console.log('Updated edge selection in Y.js');
                        }
                    }
                });

                originalOnEdgesChange(changes);
            },

            onConnect: (connection) => {
                const edgesBefore = useStore.getState().edges;
                originalOnConnect(connection);

                // wait for state update, then find new edge
                setTimeout(() => {
                    const edgesAfter = useStore.getState().edges;
                    // console.log('Edges after connection:', edgesAfter.length);

                    // find edge that is added (diff btw before/after)
                    const newEdge = edgesAfter.find(edgeAfter =>
                        !edgesBefore.some(edgeBefore => edgeBefore.id === edgeAfter.id)
                    );

                    if (newEdge) {
                        // console.log('Found NEW edge:', newEdge);
                        const updatedEdge = {
                            ...newEdge,
                            type: selectedEdgeType,
                            data: {
                                ...newEdge.data,
                                lineStyle: selectedLineStyle
                            }
                        };

                        yEdges.set(updatedEdge.id, updatedEdge);
                        // console.log('Updated edge in Y.js:', updatedEdge.id);


                    } else {
                        console.error('Could not find newly created edge');
                        // console.log('Before:', edgesBefore.map(e => e.id));
                        // console.log('After:', edgesAfter.map(e => e.id));
                    }
                }, 10);
            }
        });
        return () => {
            useStore.setState({
                onNodesChange: originalOnNodesChange,
                onEdgesChange: originalOnEdgesChange,
                onConnect: originalOnConnect
            });
        };
    }, [yDoc, selectedEdgeType, selectedLineStyle]);
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

    const handleEdgeClick = useCallback((edgeId: string, edgeType: EdgeType, lineStyle?: LineStyle) => {
        // update Y.js
        if (yDoc) {
            const yEdges = yDoc.getMap('edges');
            const existingEdge = yEdges.get(edgeId);

            if (existingEdge) {
                const updatedEdge = {
                    ...existingEdge,
                    type: edgeType,
                    data: {
                        ...existingEdge.data,
                        ...(lineStyle && {lineStyle})
                    }
                };
                yEdges.set(edgeId, updatedEdge);
                console.log('Updated edge in Y.js:', edgeId);
            }
        }
        onEdgeClick(edgeId, edgeType, lineStyle);
    }, [yDoc, onEdgeClick]);

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const ctrl = event.ctrlKey ? 'Control-' : '';
        const alt = event.altKey ? 'Alt-' : '';
        const meta = event.metaKey ? 'Meta-' : '';
        const shift = event.shiftKey ? 'Shift-' : '';
        const key = `${ctrl}${alt}${shift}${meta}${event.key}`;
        if (key === 'Meta-z') undo();
        if (key === 'Shift-Meta-z') redo();
    };

    const onInit = useCallback((instance: ReactFlowInstance) => {
        setReactFlowInstance(instance);
    }, []);

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
            },
            width: dimensions.width,
            height: dimensions.height,
        };

        // add to Yjs
        const yNodes = yDoc.getMap('nodes');
        yNodes.set(newNode.id, newNode);
        createNode(newNode);
        // console.log('Added new shape via Y.js:', newNode.id);
        // console.log('Y.js nodes after creation:', Array.from(yNodes.keys()));

        onShapeCreated();
    }, [reactFlowInstance, yDoc, onShapeCreated]);

    useEffect(() => {
        // console.log('selectedShape changed:', selectedShape);
        if (selectedShape && reactFlowInstance) {
            // console.log('Creating shape:', selectedShape);
            createNewShape(selectedShape);
        }
    }, [selectedShape, reactFlowInstance, createNewShape, onShapeCreated]);

    const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
        console.log('Node double-clicked:', node.id, 'Current editingNodeId:', editingNodeId);
        setEditingNodeId(node.id);
        const nodeData = node.data as unknown as CustomNodeData;
        setEditText(nodeData?.label || '');
    }, [editingNodeId]);

    // Create CustomNode with all necessary props
    const CustomNodeWithProps = useCallback((props: any) => (
        <CustomNodeDiv
            {...props}
            editingNodeId={editingNodeId}
            setEditingNodeId={setEditingNodeId}
            editText={editText}
            setEditText={setEditText}
            selected={props.selected}
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

    return (
        <div style={{width: '100%', height: '100%'}} className="flex relative">
            <div className="flex-1 relative" id="diagram-container">
                <ReactFlow
                    tabIndex={0}
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
                    defaultViewport={{
                        x: 0,
                        y: 0,
                        zoom: 1
                    }}
                    fitView={false}
                    minZoom={0.1}
                    maxZoom={10}
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