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
                                       markerEnd, selected, type
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
    return <BaseEdge path={path} markerEnd={markerEnd} style={{
        stroke: '#000000',
        strokeWidth: selected ? 0.65 : 0.5,
    }}/>;
}
