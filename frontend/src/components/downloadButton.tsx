import {useReactFlow, ControlButton} from '@xyflow/react';
import {toPng} from 'html-to-image';
import {getRectOfNodes, getTransformForBounds} from "reactflow";

function downloadImage(dataUrl: string) {
    const a = document.createElement('a');

    a.setAttribute('download', 'CoDiagram.png');
    a.setAttribute('href', dataUrl);
    a.click();
}

const imageWidth = 3840;
const imageHeight = 2160;

function DownloadButton() {
    const {getNodes} = useReactFlow();
    const onClick = () => {
        // transform done so that all nodes are visible
        const nodesBounds = getRectOfNodes(getNodes());
        const transform = getTransformForBounds(
            nodesBounds,
            imageWidth,
            imageHeight
        );

        toPng(document.querySelector(".react-flow__viewport") as HTMLElement, {
            backgroundColor: "white",
            width: imageWidth,
            height: imageHeight,
            pixelRatio: 2,
            style: {
                width: imageWidth,
                height: imageHeight,
                transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`
            }
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
