import {PosenetInput} from "@tensorflow-models/posenet/dist/types";
import {useEffect, useRef, useState} from "react";
import * as posenet from '@tensorflow-models/posenet';
import {Pose, PoseNet, ModelConfig} from "@tensorflow-models/posenet";
import {isMobile} from "./util";


const config = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: {width: 640, height: 480},
    multiplier: isMobile() ? 0.50 : 0.75,
    quantBytes: 2
}
export const multiPoseDetection = {
    maxPoseDetections: 5,
    minPoseConfidence: 0.15,
    minPartConfidence: 0.1,
    nmsRadius: 30.0,
};

export function usePoseNet(input: PosenetInput) {
    const [poses, setPoses] = useState<Pose[]>([]);
    const net = useRef<PoseNet>();

    useEffect(() => {
        (async () => {
            if (input === null) {
                return [];
            }
            net.current = await posenet.load({...config} as ModelConfig);

            if ("autoplay" in input) {
                //render(input, net.current, setPoses);
                window.requestAnimationFrame(render(input, net.current, setPoses));
            }
        })();
    }, [input]);
    return poses;
}

const render = (input: PosenetInput, net: PoseNet, setPoses: any) => async () => {
    const res: Pose [] = await net.estimatePoses(input, {
        flipHorizontal: true,
        decodingMethod: 'multi-person',
        maxDetections: multiPoseDetection.maxPoseDetections,
        scoreThreshold: multiPoseDetection.minPartConfidence,
        nmsRadius: multiPoseDetection.nmsRadius
    });
    setPoses(res);
    //setInterval(render(input, net, setPoses),500);
    window.requestAnimationFrame(render(input, net, setPoses));
};