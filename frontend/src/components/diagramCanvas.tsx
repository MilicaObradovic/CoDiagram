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
    type Edge, ConnectionLineType

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
        };

        const styles: { [key: string]: any } = {
            rectangle: {
                ...baseStyle,
                background: '#3B82F6',
                color: 'white',
                border: '2px solid #1E40AF',
            },
            circle: {
                ...baseStyle,
                background: '#10B981',
                color: 'white',
                border: '2px solid #047857',
                borderRadius: '50%',
            },
            triangle: {
                ...baseStyle,
                background: '#F59E0B',
                color: 'white',
                border: '2px solid #D97706',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            },
            diamond: {
                ...baseStyle,
                background: '#8B5CF6',
                color: 'white',
                border: '2px solid #7C3AED',
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            },
            text: {
                ...baseStyle,
                background: 'transparent',
                color: '#374151',
                border: '1px dashed #D1D5DB',
                width: 150,
                height: 'auto',
            }
        };

        return styles[shapeType] || styles.rectangle;
    };

    const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
        console.log('Node double-clicked:', node.id, 'Current editingNodeId:', editingNodeId);
        setEditingNodeId(node.id);
        const nodeData = node.data as unknown as CustomNodeData;
        console.log('Setting editText to:', nodeData?.label);
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
                <Controls/>
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
                <DownloadButton />
            </ReactFlow>
        </div>
    );
};

export default DiagramCanvas;