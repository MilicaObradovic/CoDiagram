import type {CustomNodeData} from "../types/diagram.ts";
import {memo, useCallback, useState} from "react";
import {Handle, NodeResizer, Position} from "@xyflow/react";

const CustomNodeDiv = ({
    data,
    id,
    editingNodeId,
    setEditingNodeId,
    editText,
    setEditText,
    setNodes, selected
}: {
    data: CustomNodeData;
    id: string;
    editingNodeId: string | null;
    setEditingNodeId: (id: string | null) => void;
    editText: string;
    setEditText: (text: string) => void;
    setNodes: any;
    selected:boolean;
}) => {

    const [isHovered, setIsHovered] = useState(false);
    // Handle save inside CustomNode
    const handleSave = useCallback(() => {
        console.log('Saving edit for node:', id, 'with text:', editText);
        setNodes((nds: any[]) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, label: editText } as CustomNodeData,
                    };
                }
                return node;
            })
        );
        setEditingNodeId(null);
        setEditText('');
    }, [id, editText, setNodes, setEditingNodeId, setEditText]);

    // Handle cancel inside CustomNode
    const handleCancel = useCallback(() => {
        console.log('Canceling edit for node:', id);
        setEditingNodeId(null);
        setEditText('');
    }, [setEditingNodeId, setEditText]);


    console.log('CustomNode rendering:', id, 'editing:', editingNodeId === id, 'editText:', editText);

    if (editingNodeId === id) {
        return (
            <>
            <NodeResizer
                color="bg-blue-600"
                isVisible={selected}
                minWidth={100}
                minHeight={30}
            />
            <textarea
                ref={(textarea) => {
                    if (textarea) {
                        // Auto-resize to fit content but within node bounds
                        textarea.style.height = 'auto';
                        const nodeHeight = 60; // Match your node height
                        textarea.style.height = Math.min(textarea.scrollHeight, nodeHeight) + 'px';

                        // Set cursor to the end of text
                        textarea.focus();
                        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                    }
                }}
                value={editText}
                onChange={(e) => {
                    setEditText(e.target.value);
                    // Auto-resize as user types
                    const textarea = e.target;
                    textarea.style.height = 'auto';
                    const nodeHeight = 60;
                    textarea.style.height = Math.min(textarea.scrollHeight, nodeHeight) + 'px';
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSave();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancel();
                    }
                }}
                onBlur={handleSave}
                className="w-full h-full bg-transparent text-inherit focus:outline-none resize-none border-none placeholder-gray-100 placeholder:italic placeholder:opacity-75"
                style={{
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    fontSize: 'inherit', // Use same font size
                    fontWeight: 'inherit', // Use same font weight
                }}
                placeholder="Type here..."
            />
                <Handle
                    type="source"
                    position={Position.Top}
                    className="w-3 h-3 bg-blue-500" id="top"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 bg-green-500" id="bottom"
                />
                <Handle
                    type="source"
                    position={Position.Left}
                    className="w-3 h-3 bg-blue-500" id="left"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    className="w-3 h-3 bg-green-500" id="right"
                />
            </>
        );
    }

    return (
        <div onMouseEnter={() => setIsHovered(true)}
             onMouseLeave={() => setIsHovered(false)}>
            <div>
            <NodeResizer
                color="bg-blue-600"
                isVisible={selected}
                minWidth={100}
                minHeight={30}
            />
                <Handle
                    type="source"
                    position={Position.Top}
                    className={`w-3 h-3 transition-all duration-200 ${
                        isHovered
                            ? 'bg-blue-500 opacity-100'
                            : 'bg-transparent opacity-0'
                    }`}
                    id="top"
                />

                <Handle
                    type="source"
                    position={Position.Left}
                    className={`w-3 h-3 transition-all duration-200 ${
                        isHovered
                            ? 'bg-blue-500 opacity-100'
                            : 'bg-transparent opacity-0'
                    }`}
                    id="left"
                />

                <div className="text-center">
                    {data.label}
                </div>

                <Handle
                    type="source"
                    position={Position.Bottom}
                    className={`w-3 h-3 transition-all duration-200 ${
                        isHovered
                            ? 'bg-blue-500 opacity-100'
                            : 'bg-transparent opacity-0'
                    }`}
                    id="bottom"
                />

                <Handle
                    type="source"
                    position={Position.Right}
                    className={`w-3 h-3 transition-all duration-200 ${
                        isHovered
                            ? 'bg-blue-500 opacity-100'
                            : 'bg-transparent opacity-0'
                    }`}
                    id="right"
                />
            </div>
        </div>
    );

};
export default memo(CustomNodeDiv);
