import {
    getSmoothStepPath,
    BaseEdge,
    type EdgeProps,
} from '@xyflow/react';
export default function CustomEdge({
       sourceX,
       sourceY,
       targetX,
       targetY,
       sourcePosition,
       targetPosition,
       markerEnd, selected,
   }: EdgeProps) {
    const edgePathParams = {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    };

    let path = '';

    [path] = getSmoothStepPath({...edgePathParams, borderRadius:0});

    return <BaseEdge path={path} markerEnd={markerEnd} style={{
        stroke: '#000000',
        strokeWidth: selected ? 0.65 : 0.5,
    }}/>;
}
