import React, {useCallback, useEffect, useMemo, useState} from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge, type ReactFlowInstance, type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type {CustomNode, CustomNodeData, ShapeType, ToolbarState} from "../types/diagram.ts";
import CustomNodeDiv from './customNodeDiv.tsx'
interface DiagramCanvasProps {
    toolbarState: ToolbarState;
    selectedShape: ShapeType;
}

const initialNodes: CustomNode[] = [
    {
        id: '1',
        type: 'default',
        position: {x: 100, y: 100},
        data: {label: 'Welcome to Diagram App!'},
        style: {
            background: '#3B82F6',
            color: 'white',
            border: '2px solid #1E40AF',
            borderRadius: '8px',
            padding: '10px',
        },
    },
    {
        id: '2',
        type: 'default',
        position: {x: 400, y: 200},
        data: {label: 'Add more shapes from the sidebar'},
        style: {
            background: '#10B981',
            color: 'white',
            border: '2px solid #047857',
            borderRadius: '8px',
            padding: '10px',
        },
    },
    {
        id: '3',
        type: 'default',
        position: {x: 200, y: 350},
        data: {label: 'Drag me around!'},
        style: {
            background: '#F59E0B',
            color: 'white',
            border: '2px solid #D97706',
            borderRadius: '8px',
            padding: '10px',
        },
    },
];

const initialEdges: Edge[] = [
    // { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
    // { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
];

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
                                                         toolbarState,
                                                         selectedShape // Destructure it from props
                                                     }) => {
    console.log('selectedShape:', selectedShape);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
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
            },
            line: {
                ...baseStyle,
                background: 'transparent',
                border: '2px solid #EF4444',
                width: 100,
                height: 2,
            },
            arrow: {
                ...baseStyle,
                background: '#EC4899',
                color: 'white',
                border: '2px solid #DB2777',
                clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%, 0% 70%, 70% 50%, 0% 30%)',
            },
            cylinder: {
                ...baseStyle,
                background: '#6B7280',
                color: 'white',
                border: '2px solid #4B5563',
            },
        };

        return styles[shapeType] || styles.rectangle;
    };

    const onNodeDoubleClick: NodeMouseHandler = useCallback((event, node) => {
        console.log('Node double-clicked:', node.id, 'Current editingNodeId:', editingNodeId);
        setEditingNodeId(node.id);
        const nodeData = node.data as CustomNodeData;
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
        />
    ), [editingNodeId, editText, setNodes]);

    const nodeTypes = useMemo(() => ({
        default: CustomNodeWithProps,
    }), [CustomNodeWithProps]);

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
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={10}
            >
                <Controls/>
                <MiniMap
                    nodeBorderRadius={8}
                    nodeColor={(node) => {
                        // Color nodes based on their background color
                        const bgColor = node.style?.background as string || '#6ede87';
                        return bgColor;
                    }}
                    position="bottom-right"
                    style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                    }}
                    zoomable
                    pannable
                />
                <Background  gap={20} size={1} />
            </ReactFlow>
        </div>
    );
};

export default DiagramCanvas;