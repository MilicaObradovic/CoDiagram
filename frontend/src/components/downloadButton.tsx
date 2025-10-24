import {useReactFlow, getNodesBounds, getViewportForBounds, ControlButton} from '@xyflow/react';
import {toPng} from 'html-to-image';

function downloadImage(dataUrl: string) {
    const a = document.createElement('a');

    a.setAttribute('download', 'reactflow.png');
    a.setAttribute('href', dataUrl);
    a.click();
}

const imageWidth = 1024;
const imageHeight = 768;

function DownloadButton() {
    const {getNodes} = useReactFlow();
    const onClick = () => {
        // calculate a transform for the nodes so that all nodes are visible
        const nodesBounds = getNodesBounds(getNodes());
        const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0);

        toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
            backgroundColor: 'white',
            width: imageWidth,
            height: imageHeight,
            style: {
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            },
        }).then(downloadImage);
    };

    return (
        <ControlButton onClick={onClick} title="Download diagram">
            <svg className="w-5 h-5 text-gray-700 !min-w-5 !min-h-5" fill="none" stroke="currentColor"
                 viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
        </ControlButton>
    );
}

export default DownloadButton;
