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
    const [status, setStatus] = useState<number>(0);
    const video = useRef<HTMLVideoElement>(null);
    const poses = usePoseNet(video.current!);
    const prediction = predict(poses);
    const canvas = useRef<HTMLCanvasElement>(null);

    draw(canvas.current, video.current, poses);

    useEffect(() => {
        (async () => {
            await setupCamera(video.current);
        })();
    }, []);

    return (
        <>
            <h1>实时姿势识别分类</h1>
            <h2>基于神经网络和迁移学习的应用</h2>

            <button onClick={(e) => {setStatus(1);video.current!.play();}}>Start</button>
            <button onClick={(e) => {setStatus(2);video.current!.pause();}}>Stop</button>

            <video
                ref={video}
                width="640"
                height="480"
                style={{display:"none"}}
                autoPlay
            >
            </video>
            <canvas ref={canvas} width="640" height="480"/>
            <h1>分类: {prediction.className}</h1>
            <h2>概率: {prediction.probability}</h2>

            <h3>作者: 朱先忠(南开大学)</h3>
        </>
    );
}
const videoWidth = 640;
const videoHeight = 480;
function predict(poses: Pose[]) {
    const className = "正对";
    const maxPose : Pose = poses.reduce((a,b)=>a.score>b.score?a:b, {score:0} as Pose);
    if (maxPose.score === 0){
        return {className:"未知", probability: 1}
    } else {
        console.log(maxPose.keypoints.map(k=>k.part));
        const leftEar = maxPose.keypoints.filter(k=>k.part==="leftEar")[0];
        const rightEar = maxPose.keypoints.filter(k=>k.part==="rightEar")[0];
        if (leftEar.score < 0.2){
            return {className:"向左", probability: rightEar.score}
        }
        if (rightEar.score < 0.2){
            return {className:"向右", probability: leftEar.score}
        }
        return {className:"正对", probability: leftEar.score}
    }
}
function draw(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null, poses: Pose []) {
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
