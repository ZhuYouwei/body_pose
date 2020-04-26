import * as React from "react";
import {useEffect, useRef, useState} from "react";
import "./styles.css";
import {drawKeypoints, drawSkeleton} from './util.js';
import {multiPoseDetection, usePoseNet} from "./hook"
import {Pose} from "@tensorflow-models/posenet";

export default function App() {
    const [status, setStatus] = useState<number>(0);
    const video = useRef<HTMLVideoElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const poses = usePoseNet(video.current!);

    useEffect(() => {
        (async () => {
            await setupCamera(video.current);
        })();
    }, []);

    const prediction = predict(poses);
    draw(canvas.current, video.current, poses);

    return (
        <>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                <h3>实时姿势识别分类</h3>
                <h4>基于神经网络和迁移学习的应用</h4>
                <div>
                    <button onClick={(e) => {
                        setStatus(1);
                        video.current!.play();
                    }}>Start
                    </button>
                    <button onClick={(e) => {
                        setStatus(2);
                        video.current!.pause();
                    }}>Stop
                    </button>
                </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px"}}>
                <video
                    ref={video}
                    width="300"
                    height="300"
                    style={{display: "none"}}
                    playsinline={true}
                >
                </video>
                <canvas ref={canvas} width="300" height="300"/>
                <h3>分类: {prediction.className}</h3>
                <h4>概率: {prediction.probability}</h4>
                <h4>制作方: 南开大学 软件学院</h4>
            </div>
        </>
    );
}
const videoWidth = 300;
const videoHeight = 300;

function predict(poses: Pose[]) {
    const className = "正对";
    const maxPose: Pose = poses.reduce((a, b) => a.score > b.score ? a : b, {score: 0} as Pose);
    if (maxPose.score === 0) {
        return {className: "未知", probability: 1}
    } else {
        //console.log(maxPose.keypoints.map(k=>k.part));
        const rightShoulder = maxPose.keypoints.filter(k => k.part === "rightShoulder")[0];
        const rightElbow = maxPose.keypoints.filter(k => k.part === "rightElbow")[0];
        const rightWrist = maxPose.keypoints.filter(k => k.part === "rightWrist")[0];
        console.log(`shoulder: ${rightShoulder.score} elbow: ${rightElbow.score} wrist: ${rightWrist.score}`);
        console.log(`shoulder: ${rightShoulder.position.x.valueOf()} elbow: ${rightElbow.position.x.valueOf()}`);
        const xdiff = rightWrist.position.x.valueOf() - rightElbow.position.x.valueOf();
        const ydiff = rightElbow.position.y.valueOf() - rightWrist.position.y.valueOf();
        const ratio = ydiff / xdiff;
        if (rightWrist.score < 0.15 || rightElbow.score < 0.15) {
            return {className: "距离太近", probability: rightShoulder.score}
        }
        if (ydiff < 0 && Math.abs(ratio) > 1) {
            return {className: "请抬高手腕", probability: rightShoulder.score}
        }
        if (ydiff > 0 && Math.abs(ratio) > 3) {
            return {className: "向上", probability: rightWrist.score}
        }
        if (xdiff > 0 && Math.abs(ratio) < 0.57) {
            return {className: "向右", probability: rightWrist.score}
        }
        if (xdiff < 0 && Math.abs(ratio) < 0.57) {
            return {className: "向左", probability: rightWrist.score}
        }
        return {className: "未知", probability: rightShoulder.score}
    }
}

function draw(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null, poses: Pose []) {
    if (canvas === null || video === null) {
        return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
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
    });
}
