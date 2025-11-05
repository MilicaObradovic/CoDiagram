import * as Y from 'yjs';
import {useEffect, useState} from "react";
import {WebsocketProvider} from "y-websocket";
import {useReactFlow, type Viewport} from "@xyflow/react";

interface CursorPosition {
    x: number;
    y: number;
    userId: number;
    timestamp: number;
}

interface CursorOverlayProps {
    yDoc: Y.Doc | null;
    provider: WebsocketProvider | null;
}

interface CursorPosition {
    x: number;
    y: number;
    userId: number;
    userName: string;
    color: string;
    timestamp: number;
    viewport: Viewport;
}

export const CursorOverlay = ({yDoc, provider}: CursorOverlayProps) => {
    const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
    const {screenToFlowPosition, getViewport, flowToScreenPosition} = useReactFlow();
    useEffect(() => {
        if (!yDoc || !provider) {
            return;
        }

        const yCursors = yDoc.getMap<CursorPosition>('cursors');
        const currentClientId = provider.awareness.clientID.toString();
        const updateCursors = () => {
            const currentCursors = new Map(Array.from(yCursors.entries()));

            // show only other users
            const otherCursors = new Map();
            currentCursors.forEach((cursor, userId) => {
                if (userId !== currentClientId) {
                    otherCursors.set(userId, cursor);
                }
            });
            setCursors(otherCursors);
        };
        yCursors.observe(updateCursors);

        const handleMouseMove = (event: MouseEvent) => {
            const container = document.getElementById('diagram-container');
            if (!container) return;

            const bounds = container.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;

            if (x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height) {
                const flowPosition = screenToFlowPosition({x: x, y: y});
                const cursorData = {
                    x: flowPosition.x,
                    y: flowPosition.y,
                    userId: provider.awareness.clientID,
                    userName: `User ${provider.awareness.clientID}`,
                    color: `hsl(${provider.awareness.clientID * 60 % 360}, 70%, 50%)`,
                    timestamp: Date.now(),
                    viewport: getViewport(),
                };

                yCursors.set(currentClientId, cursorData);
            }
        };

        const handleMouseLeave = () => {
            yCursors.delete(currentClientId);
        };
        yCursors.clear();
        const initTimer = setTimeout(() => {

            const container = document.getElementById('diagram-container');
            if (container) {
                container.addEventListener('mousemove', handleMouseMove);
                container.addEventListener('mouseleave', handleMouseLeave);
            }
            setTimeout(updateCursors, 100);

        }, 300);
        return () => {
            clearTimeout(initTimer);
            yCursors.unobserve(updateCursors);
            yCursors.delete(currentClientId);

            const container = document.getElementById('diagram-container');
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseleave', handleMouseLeave);
            }

        };
    }, [yDoc, provider, screenToFlowPosition, getViewport, flowToScreenPosition]);
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
        }}>
            {Array.from(cursors.entries()).map(([userId, cursor]) => {
                if(!cursor.viewport)
                    return null;
                const currViewport = getViewport();
                if (cursor.viewport.zoom != currViewport.zoom ) {
                    if (cursor.viewport.x > 0)
                        cursor.x += cursor.viewport.x;
                    else if (cursor.viewport.x < 0)
                        cursor.x -= cursor.viewport.x;
                }
                // convert flow position to screen render
                const screenPos = flowToScreenPosition({
                    x: cursor.x,
                    y: cursor.y
                });

                return (
                    <div
                        key={userId}
                        style={{
                            position: 'absolute',
                            left: screenPos.x,
                            top: screenPos.y,
                            width: '16px',
                            height: '16px',
                            backgroundColor: cursor.color,
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            transition: 'left 0.1s ease, top 0.1s ease',
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: '-24px',
                            left: '8px',
                            fontSize: '12px',
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                        }}>
                            {cursor.userName || `User ${userId}`}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};