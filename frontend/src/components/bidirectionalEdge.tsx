import {
    getSmoothStepPath,
    BaseEdge,
    type EdgeProps, getStraightPath, getSimpleBezierPath,
} from '@xyflow/react';

export default function CustomEdge({
                                       sourceX,
                                       sourceY,
                                       targetX,
                                       targetY,
                                       sourcePosition,
                                       targetPosition,
                                       markerEnd, selected, type, data
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

    switch (type) {
        case 'straight':
            [path] = getStraightPath(edgePathParams);
            break;
        case 'bezier':
            [path] = getSimpleBezierPath(edgePathParams);
            break;
        case 'smoothstep':
            [path] = getSmoothStepPath({...edgePathParams, borderRadius: 10});
            break;
        case 'step':
        default:
            [path] = getSmoothStepPath({...edgePathParams, borderRadius: 0});
            break;
    }
    const lineStyle = data?.lineStyle || 'solid';
    const strokeDasharray =
        lineStyle === 'dashed' ? '5,5' :
            lineStyle === 'dotted' ? '2,2' : 'none';
    return <BaseEdge path={path} markerEnd={markerEnd} style={{
        stroke: '#000000',
        strokeWidth: selected ? 0.7 : 0.5,
        strokeDasharray,
    }}/>;
}
