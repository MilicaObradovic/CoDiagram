import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
    type ShapeType,
    type ToolbarState
} from "../types/diagram.ts";
import CustomNodeDiv from './customNodeDiv.tsx'
import DownloadButton from "./downloadButton.tsx";
import '@xyflow/react/dist/style.css';
import CustomEdge from './bidirectionalEdge.tsx';
import {useStore} from '../store';
import EdgeToolbar from "./EdgeToolbar.tsx";
import {WebsocketProvider} from "y-websocket";
import * as Y from 'yjs';


interface DiagramCanvasProps {
    toolbarState: ToolbarState;
    selectedShape: ShapeType;
    onShapeCreated: () => void;
}

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({selectedShape, onShapeCreated}) => {
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
        setEdges
    } = useStore();
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [selectedEdgeType, setSelectedEdgeType] = useState<EdgeType>(EdgeTypes.STEP);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>(undefined);
    const [selectedLineStyle, setSelectedLineStyle] = useState<LineStyle>(LineStyles.SOLID);

    // Yjs state
    const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
    const [provider, setProvider] = useState<WebsocketProvider | null>(null);

    // Yjs initialization
    useEffect(() => {
        const doc = new Y.Doc();

        const wsProvider = new WebsocketProvider(
            'ws://localhost:1234/diagram-room-1',
            '', // Prazan room name
            doc
        );

        const yNodes = doc.getMap('nodes');
        const yEdges = doc.getMap('edges');

        console.log('Y.js initialized with simple server');
        const originalOnNodesChange = useStore.getState().onNodesChange;
        const originalOnEdgesChange = useStore.getState().onEdgesChange;
        const originalOnConnect = useStore.getState().onConnect;

        // Y.js -> React Flow
        yNodes.observe(() => {
            const yjsNodes = Array.from(yNodes.values());
            console.log('Y.js -> React Flow:', yjsNodes.length, 'nodes');
            setNodes(yjsNodes);
        });

        yEdges.observe(() => {
            const yjsEdges = Array.from(yEdges.values());
            console.log('Y.js -> React Flow:', yjsEdges.length, 'edges');
            setEdges(yjsEdges);
        });
        useStore.setState({
            onNodesChange: (changes) => {
                console.log('React Flow nodes changes:', changes);

                changes.forEach(change => {
                    console.log(`Processing change: ${change.type}`, change);

                    if (change.type === 'add') {
                        yNodes.set(change.item.id, change.item);
                        console.log('Added node to Y.js:', change.item.id);

                    } else if (change.type === 'remove') {
                        yNodes.delete(change.id);
                        console.log('Removed node from Y.js:', change.id);

                    } else if (change.type === 'position') {
                        console.log('Node position change:', change.id, change.position);

                        const existingNode = yNodes.get(change.id);
                        if (existingNode) {
                            const updatedNode = {
                                ...existingNode,
                                position: change.position
                            };
                            yNodes.set(change.id, updatedNode);
                            console.log('✅ Updated node position in Y.js');
                        }

                    } else if (change.type === 'dimensions') {
                        console.log('Node dimensions change:', change.id, change.dimensions);

                        const existingNode = yNodes.get(change.id);
                        if (existingNode && change.dimensions) {
                            const updatedNode = {
                                ...existingNode,
                                width: change.dimensions.width,
                                height: change.dimensions.height
                            };
                            yNodes.set(change.id, updatedNode);
                            console.log('Updated node dimensions in Y.js');
                        }

                    } else if (change.type === 'select') {
                        console.log('Node select change (ignoring):', change.id, change.selected);
                    }
                });

                originalOnNodesChange(changes);
            },

            onEdgesChange: (changes) => {
                console.log('React Flow edges changes:', changes);

                changes.forEach(change => {
                    if (change.type === 'add') {
                        yEdges.set(change.item.id, change.item);
                        console.log('Added edge to Y.js:', change.item.id);
                    } else if (change.type === 'remove') {
                        yEdges.delete(change.id);
                        console.log('Removed edge from Y.js:', change.id);
                    }
                });

                originalOnEdgesChange(changes);
            },

            onConnect: (connection) => {
                const edgesBefore = useStore.getState().edges;
                originalOnConnect(connection);

                // wait for state update-uje, then find new edge
                setTimeout(() => {
                    const edgesAfter = useStore.getState().edges;
                    console.log('📊 Edges after connection:', edgesAfter.length);

                    // find edge that is added (diff btw before/after)
                    const newEdge = edgesAfter.find(edgeAfter =>
                        !edgesBefore.some(edgeBefore => edgeBefore.id === edgeAfter.id)
                    );

                    if (newEdge) {
                        console.log('Found NEW edge:', newEdge);
                        const updatedEdge = {
                            ...newEdge,
                            type: selectedEdgeType,
                            data: {
                                ...newEdge.data,
                                lineStyle: selectedLineStyle
                            }
                        };

                        yEdges.set(updatedEdge.id, updatedEdge);
                        console.log('Updated edge in Y.js:', updatedEdge.id);

                        const updatedEdges = edgesAfter.map(edge =>
                            edge.id === newEdge.id ? updatedEdge : edge
                        );
                        useStore.getState().setEdges(updatedEdges);

                    } else {
                        console.error('Could not find newly created edge');
                        console.log('Before:', edgesBefore.map(e => e.id));
                        console.log('After:', edgesAfter.map(e => e.id));
                    }
                }, 10);
            }
        });

        setYDoc(doc);
        setProvider(wsProvider);

        return () => {
            useStore.setState({
                onNodesChange: originalOnNodesChange,
                onEdgesChange: originalOnEdgesChange,
                onConnect: originalOnConnect
            });
            wsProvider.destroy();
            doc.destroy();
        };
    }, [setNodes, setEdges, selectedEdgeType, selectedLineStyle]);


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

        console.log('✅ Added new shape via Y.js:', newNode.id);
        console.log('📊 Y.js nodes after creation:', Array.from(yNodes.keys()));

        onShapeCreated();
    }, [reactFlowInstance, yDoc, onShapeCreated]);

    useEffect(() => {
        console.log('selectedShape changed:', selectedShape);
        if (selectedShape && reactFlowInstance) {
            console.log('Creating shape:', selectedShape);
            createNewShape(selectedShape);
            onShapeCreated();
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
    const edgeTypes = {
        [EdgeTypes.STEP]: CustomEdge,
        [EdgeTypes.SMOOTHSTEP]: CustomEdge,
        [EdgeTypes.STRAIGHT]: CustomEdge,
        [EdgeTypes.BEZIER]: CustomEdge,
        default: CustomEdge,
    };
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
        <div style={{width: '100%', height: '100%'}} className="flex">
            <div className="flex-1">
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
                            onUpdateEdge={onEdgeClick}
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
                </ReactFlow>
            </div>
        </div>
    );
};

export default DiagramCanvas;