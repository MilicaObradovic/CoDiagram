import type {CustomNodeData} from "../types/diagram.ts";
import {memo, useCallback} from "react";
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
                    className="w-3 h-3 bg-blue-500"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 bg-green-500"
                />
            </>
        );
    }

    return (
        <>
        <NodeResizer
            color="bg-blue-600"
            isVisible={selected}
            minWidth={100}
            minHeight={30}
        />
            <Handle
                type="source"
                position={Position.Top}
                className="w-3 h-3 bg-blue-500" id="right"
            />
            <div className="text-center">{data.label}</div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-green-500" id="left"
            />
        </>
    );

};
export default memo(CustomNodeDiv);
