import React, {memo, useCallback, useState} from "react";
import {Handle, type NodeProps, NodeResizer, Position} from "@xyflow/react";
import ShapeRenderer from "./renderShape.tsx";
import {useStore} from "../store";

interface CustomNodeDivProps extends NodeProps {
    editingNodeId: string | null;
    setEditingNodeId: (id: string | null) => void;
    editText: string;
    setEditText: (text: string) => void;
}

const CustomNodeDiv = ({
                           data,
                           id,
                           editingNodeId,
                           setEditingNodeId,
                           editText,
                           setEditText,
                           selected,
                           width,
                           height
                       }: CustomNodeDivProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const {updateNodeLabel} = useStore();

    // Use the props that React Flow provides
    const currentLabel = data?.label as React.ReactNode;
    const shapeType = data?.shapeType || 'rectangle';
    const handleSave = useCallback(() => {
        updateNodeLabel(id, editText, 'user');
        setEditingNodeId(null);
    }, [id, editText, setEditingNodeId, setEditText]);

    const handleCancel = useCallback(() => {
        setEditingNodeId(null);
        setEditText('');
    }, [setEditingNodeId, setEditText]);

    if (editingNodeId === id) {
        return (
            <div
                className="text-foreground"
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <NodeResizer
                    color="#3b82f6"
                    isVisible={selected}
                    minWidth={50}
                    minHeight={30}
                    handleStyle={{border: '2px solid #3b82f6', background: 'white', zIndex: 20}}
                />

                {/* Shape stays in background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none' // Allow clicks to pass through to textarea
                }}>
                    <ShapeRenderer
                        shapeType={shapeType}
                        width={width}
                        height={height}
                        currentLabel={""}
                        selected={selected}
                    />
                </div>

                {/* Textarea overlay */}
                <textarea
                    ref={(textarea) => {
                        if (textarea) {
                            textarea.style.height = 'auto';
                            const nodeHeight = 60;
                            textarea.style.height = Math.min(textarea.scrollHeight, nodeHeight) + 'px';
                            textarea.focus();
                            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                        }
                    }}
                    value={editText}
                    onChange={(e) => {
                        setEditText(e.target.value);
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
                    onBlur={handleCancel}
                    className="w-full h-full bg-transparent text-inherit focus:outline-none resize-none border-none placeholder-gray-100 placeholder:italic placeholder:opacity-75"
                    style={{
                        textAlign: 'center',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        position: 'relative',
                        zIndex: 10,
                        background: 'transparent',
                    }}
                    placeholder="Type here..."
                />

                <Handle
                    type="source"
                    position={Position.Top}
                    className="w-3 h-3 bg-blue-500"
                    id="top"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 bg-green-500"
                    id="bottom"
                />
                <Handle
                    type="source"
                    position={Position.Left}
                    className="w-3 h-3 bg-blue-500"
                    id="left"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    className="w-3 h-3 bg-green-500"
                    id="right"
                />
            </div>
        );
    }

    return (
        <div
            className="text-foreground"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{width: '100%', height: '100%', background: 'transparent'}}
        >
            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={50}
                minHeight={30}
                handleStyle={{border: '2px solid #3b82f6', background: 'transparent'}}
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
