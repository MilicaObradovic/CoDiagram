import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    addEdge,
    Background,
    Controls,
    MiniMap,
    type NodeMouseHandler,
    ReactFlow,
    type ReactFlowInstance,
    useEdgesState,
    useNodesState,
    ConnectionMode,
    type OnConnect,
    type Node,
    type Edge, ConnectionLineType, ControlButton
} from '@xyflow/react';
import 'reactflow/dist/style.css';
import type {CustomNodeData, ShapeType, ToolbarState} from "../types/diagram.ts";
import CustomNodeDiv from './customNodeDiv.tsx'
import DownloadButton from "./downloadButton.tsx";
import '@xyflow/react/dist/style.css';
import CustomEdge from './bidirectionalEdge.tsx';

interface DiagramCanvasProps {
    toolbarState: ToolbarState;
    selectedShape: ShapeType;
}

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
                                                         selectedShape // Destructure it from props
                                                     }) => {
    console.log('selectedShape:', selectedShape);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const onConnect: OnConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [],
    );

    const onInit = useCallback((instance: ReactFlowInstance) => {
        console.log('ReactFlow initialized');
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

        // Use functional update to get the latest nodes
        setNodes((nds) => {
            console.log('Adding new node:', newNode);
            return nds.concat(newNode);
        });
    }, [reactFlowInstance, setNodes]);

    useEffect(() => {
        console.log('selectedShape changed:', selectedShape);
        if (selectedShape && reactFlowInstance) {
            console.log('Creating shape:', selectedShape);
            createNewShape(selectedShape);
        }
    }, [selectedShape, reactFlowInstance, createNewShape]);

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
            setNodes={setNodes}
            selected={props.selected}
        />
    ), [editingNodeId, editText, setNodes]);

    const nodeTypes = useMemo(() => ({
        default: CustomNodeWithProps,
    }), [CustomNodeWithProps]);
    const edgeTypes = {
        default: CustomEdge,
    };
    return (
        <div style={{width: '100%', height: '100%'}}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDoubleClick={onNodeDoubleClick}
                onConnect={onConnect}
                onInit={onInit}
                defaultEdgeOptions={{
                    type: 'default',
                    markerEnd: {
                        type: 'arrowclosed',
                        color: '#000000',
                        width: 30,
                        height: 30,
                    },
                }}
                edgeTypes={edgeTypes}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.Step}
                fitView
                minZoom={0.1}
                maxZoom={10}
                connectionMode={ConnectionMode.Loose}
            >
                <Controls>
                        <DownloadButton />
                </Controls>
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
                <Background  gap={20} size={1} />
                {/*<DownloadButton />*/}
            </ReactFlow>
        </div>
    );
};

export default DiagramCanvas;