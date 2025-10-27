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
    EdgeTypes,
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
        onEdgeClick
    } = useStore();
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [selectedEdgeType, setSelectedEdgeType] = useState<EdgeType>(EdgeTypes.STEP);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>(undefined);
    const [selectedLineStyle, setSelectedLineStyle] = useState<LineStyle>(LineStyles.SOLID);


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
        if (!reactFlowInstance) return;

        const position = reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        const newNode: Node = {
            id: `${shapeType}-${Date.now()}`,
            type: 'default',
            position,
            data: {
                label: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`
            },
            style: getShapeStyle(shapeType),
        };
        const currentNodes = useStore.getState().nodes;
        useStore.getState().setNodes([...currentNodes, newNode]);
    }, [reactFlowInstance]);

    useEffect(() => {
        console.log('selectedShape changed:', selectedShape);
        if (selectedShape && reactFlowInstance) {
            console.log('Creating shape:', selectedShape);
            createNewShape(selectedShape);
            onShapeCreated();
        }
    }, [selectedShape, reactFlowInstance, createNewShape, onShapeCreated]);

    const getShapeStyle = (shapeType: string) => {
        const baseStyle = {
            padding: '10px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            width: 120,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center' as const,
            background: 'transparent',
            color: '#000000',
            border: '2px solid #000000',
        };

        const styles: { [key: string]: any } = {
            // Basic Shapes
            rectangle: {
                ...baseStyle,
            },
            circle: {
                ...baseStyle,
                borderRadius: '50%',
            },
            triangle: {
                ...baseStyle,
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            },
            diamond: {
                ...baseStyle,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            },
            text: {
                ...baseStyle,
                border: '1px dashed #000000',
                width: 150,
                height: 'auto',
            },
            line: {
                ...baseStyle,
                width: 100,
                height: 2,
                background: '#000000',
                border: 'none',
                padding: 0,
            },
            arrow: {
                ...baseStyle,
                width: 80,
                height: 40,
                clipPath: 'polygon(0% 0%, 80% 0%, 80% 30%, 100% 50%, 80% 70%, 80% 100%, 0% 100%)',
            },
            cylinder: {
                ...baseStyle,
                position: 'relative',
                overflow: 'hidden',
                '::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '20%',
                    background: '#000000',
                    borderRadius: '50%',
                },
                '::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '20%',
                    background: '#000000',
                    borderRadius: '50%',
                }
            },

            // UML Shapes
            uml_class: {
                ...baseStyle,
                border: '2px solid #000000',
                background: 'transparent',
            },
            uml_actor: {
                ...baseStyle,
                width: 60,
                height: 80,
                clipPath: 'path("M 30 0 L 60 30 L 45 30 L 45 50 L 15 50 L 15 30 L 0 30 Z")',
            },
            uml_use_case: {
                ...baseStyle,
                border: '2px solid #000000',
                borderRadius: '50%',
            },
            uml_component: {
                ...baseStyle,
                border: '2px solid #000000',
                position: 'relative',
                '::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: 10,
                    right: 10,
                    height: '2px',
                    background: '#000000',
                }
            },

            // Mind Map Shapes
            mindmap_central: {
                ...baseStyle,
                borderRadius: '50%',
                background: '#000000',
                color: '#ffffff',
            },
            mindmap_topic: {
                ...baseStyle,
                borderRadius: '20px',
                border: '2px solid #000000',
            },
            mindmap_subtopic: {
                ...baseStyle,
                borderRadius: '10px',
                border: '1px solid #000000',
                width: 100,
                height: 40,
            },

            // Conceptual Diagrams
            concept_entity: {
                ...baseStyle,
                border: '2px solid #000000',
                background: 'transparent',
            },
            concept_process: {
                ...baseStyle,
                border: '2px solid #000000',
                borderRadius: '5px',
            },
            concept_database: {
                ...baseStyle,
                position: 'relative',
                border: '2px solid #000000',
                borderRadius: '5px 5px 0 0',
                '::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-10px',
                    left: '5%',
                    right: '5%',
                    height: '10px',
                    border: '2px solid #000000',
                    borderTop: 'none',
                    borderRadius: '0 0 5px 5px',
                }
            }
        };

        return styles[shapeType] || styles.rectangle;
    };

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
                            return node.style?.background as string || '#6ede87';
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