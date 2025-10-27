import type {CustomNodeData} from "../types/diagram.ts";
import React, {memo, useCallback, useState} from "react";
import {Handle, NodeResizer, Position} from "@xyflow/react";
import {useStore} from '../store';
import ShapeRenderer from "./renderShape.tsx";

const CustomNodeDiv = ({
                           data,
                           id,
                           editingNodeId,
                           setEditingNodeId,
                           editText,
                           setEditText, selected
                       }: {
    data: CustomNodeData;
    id: string;
    editingNodeId: string | null;
    setEditingNodeId: (id: string | null) => void;
    editText: string;
    setEditText: (text: string) => void;
    selected: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const nodes = useStore(state => state.nodes);
    const currentNode = nodes.find(node => node.id === id);
    const currentLabel = (currentNode?.data?.label || data.label) as React.ReactNode;
    const shapeType = data.shapeType || 'rectangle';
    const width = currentNode?.width || 100;
    const height = currentNode?.height || 60;

    // const handleSave = useCallback(() => {
    //     useStore.getState().updateNodeLabel(id, editText);
    //     setEditingNodeId(null);
    // }, [id, editText, setEditingNodeId, setEditText]);
    //
    // const handleCancel = useCallback(() => {
    //     setEditingNodeId(null);
    //     setEditText('');
    // }, [setEditingNodeId, setEditText]);

    // if (editingNodeId === id) {
    //     return (
    //         <>
    //             <NodeResizer
    //                 color="bg-blue-600"
    //                 isVisible={selected}
    //                 minWidth={100}
    //                 minHeight={30}
    //             />
    //             <textarea
    //                 ref={(textarea) => {
    //                     if (textarea) {
    //                         // Auto-resize to fit content but within node bounds
    //                         textarea.style.height = 'auto';
    //                         const nodeHeight = 60;
    //                         textarea.style.height = Math.min(textarea.scrollHeight, nodeHeight) + 'px';
    //
    //                         // Set cursor to the end of text
    //                         textarea.focus();
    //                         textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    //                     }
    //                 }}
    //                 value={editText}
    //                 onChange={(e) => {
    //                     setEditText(e.target.value);
    //                     // Auto-resize as user types
    //                     const textarea = e.target;
    //                     textarea.style.height = 'auto';
    //                     const nodeHeight = 60;
    //                     textarea.style.height = Math.min(textarea.scrollHeight, nodeHeight) + 'px';
    //                 }}
    //                 onKeyDown={(e) => {
    //                     if (e.key === 'Enter' && !e.shiftKey) {
    //                         e.preventDefault();
    //                         handleSave();
    //                     } else if (e.key === 'Escape') {
    //                         e.preventDefault();
    //                         handleCancel();
    //                     }
    //                 }}
    //                 onBlur={handleCancel}
    //                 className="w-full h-full bg-transparent text-inherit focus:outline-none resize-none border-none placeholder-gray-100 placeholder:italic placeholder:opacity-75"
    //                 style={{
    //                     textAlign: 'left',
    //                     fontFamily: 'inherit',
    //                     lineHeight: '1.4',
    //                     fontSize: 'inherit',
    //                     fontWeight: 'inherit',
    //                 }}
    //                 placeholder="Type here..."
    //             />
    //             <Handle
    //                 type="source"
    //                 position={Position.Top}
    //                 className="w-3 h-3 bg-blue-500" id="top"
    //             />
    //             <Handle
    //                 type="source"
    //                 position={Position.Bottom}
    //                 className="w-3 h-3 bg-green-500" id="bottom"
    //             />
    //             <Handle
    //                 type="source"
    //                 position={Position.Left}
    //                 className="w-3 h-3 bg-blue-500" id="left"
    //             />
    //             <Handle
    //                 type="source"
    //                 position={Position.Right}
    //                 className="w-3 h-3 bg-green-500" id="right"
    //             />
    //         </>
    //     );
    // }

    return (
        <div
            className="text-foreground"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={50}
                minHeight={30}
                handleStyle={{ border: '2px solid #3b82f6', background: 'transparent' }}
            />

            <Handle
                type="source"
                position={Position.Top}
                className={`w-3 h-3 transition-all duration-200 ${
                    isHovered ? 'bg-blue-500 opacity-100' : 'bg-transparent opacity-0'
                }`}
                id="top"
            />
            <Handle
                type="source"
                position={Position.Left}
                className={`w-3 h-3 transition-all duration-200 ${
                    isHovered ? 'bg-blue-500 opacity-100' : 'bg-transparent opacity-0'
                }`}
                id="left"
            />

            <ShapeRenderer
                shapeType={shapeType}
                width={width}
                height={height}
                currentLabel={currentLabel}
                selected={selected}
            />

            <Handle
                type="source"
                position={Position.Bottom}
                className={`w-3 h-3 transition-all duration-200 ${
                    isHovered ? 'bg-blue-500 opacity-100' : 'bg-transparent opacity-0'
                }`}
                id="bottom"
            />
            <Handle
                type="source"
                position={Position.Right}
                className={`w-3 h-3 transition-all duration-200 ${
                    isHovered ? 'bg-blue-500 opacity-100' : 'bg-transparent opacity-0'
                }`}
                id="right"
            />
        </div>
    );
};
export default memo(CustomNodeDiv);
