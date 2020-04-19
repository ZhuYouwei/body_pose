import * as React from "react";
import "./styles.css";
import {useEffect, useRef, useState} from "react";
import {
    drawBoundingBox,
    drawKeypoints,
    drawSkeleton,
    isMobile,
    toggleLoadingUI,
    tryResNetButtonName,
    tryResNetButtonText,
    updateTryResNetButtonDatGuiCss
} from './util.js';
import {multiPoseDetection, usePoseNet} from "./hook"
import {Pose} from "@tensorflow-models/posenet";

export default function App() {
    const [start, setStart] = useState<boolean>(false);

    const video = useRef<HTMLVideoElement>(null);
    const poses = usePoseNet(video.current!);
    const canvas = useRef<HTMLCanvasElement>(null);

    draw(canvas.current, video.current, poses);

    useEffect(() => {
        (async () => {
            await setupCamera(video.current);
        })();
    }, []);

    return (
        <>
            <h1>Body Pose Demo</h1>
            <button onClick={(e) => setStart(true)}>Start</button>
            <video
                ref={video}
                width="640"
                height="480"
                style={{display:"none"}}
                autoPlay
            >
            </video>
            <canvas ref={canvas} width="640" height="480"/>
        </>
    );
}
const videoWidth = 640;
const videoHeight = 480;
function draw(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null, poses: Pose []) {
    console.log(poses)
    if (canvas === null || video === null) {
        return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx === null){
        return
    }
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-videoWidth, 0);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    ctx.restore();
    poses.forEach(({score, keypoints}) => {
        if (score >= multiPoseDetection.minPoseConfidence) {
            drawKeypoints(keypoints, multiPoseDetection.minPartConfidence, ctx);
            drawSkeleton(keypoints, multiPoseDetection.minPartConfidence, ctx);
            //drawBoundingBox(keypoints, ctx);
        }
    });
}

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera(video: any) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
    }
    video.width = videoWidth;
    video.height = videoHeight;
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: 'user',
            width: videoWidth,
            height: videoHeight
        }
    }).then(function (stream) {
        video.srcObject = stream;
        video.play();
    });
}
