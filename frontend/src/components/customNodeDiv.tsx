import type {CustomNodeData} from "../types/diagram.ts";
import React, {useCallback} from "react";
import {Handle, Position} from "reactflow";

const CustomNodeDiv = ({
    data,
    id,
    editingNodeId,
    setEditingNodeId,
    editText,
    setEditText,
    setNodes
}: {
    data: CustomNodeData;
    id: string;
    editingNodeId: string | null;
    setEditingNodeId: (id: string | null) => void;
    editText: string;
    setEditText: (text: string) => void;
    setNodes: any;
}) => {

    // Handle save inside CustomNode
    const handleSave = useCallback(() => {
        console.log('Saving edit for node:', id, 'with text:', editText);
        setNodes((nds: Node[]) =>
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
            <div
                className="rounded-md w-full h-full flex items-center justify-center p-2"
                style={{
                    background: 'inherit', // Use same background as display mode
                    color: 'inherit', // Use same text color
                    border: 'inherit', // Use same border
                }}
            >
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
                className="w-full h-full bg-transparent text-inherit focus:outline-none resize-none border-none"
                style={{
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    fontSize: 'inherit', // Use same font size
                    fontWeight: 'inherit', // Use same font weight
                }}
                placeholder="Type here... (Enter to save)"
            />
                <Handle
                    type="target"
                    position={Position.Top}
                    className="w-3 h-3 bg-blue-500"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 bg-green-500"
                />
            </div>
        );
    }

    return (
        <div
            className="rounded-md w-full h-full flex items-center justify-center p-2 "
            style={{
                background: 'inherit',
                color: 'inherit',
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-blue-500"
            />
            <div className="text-center">{data.label}</div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-green-500"
            />
        </div>
    );

};
export default CustomNodeDiv;