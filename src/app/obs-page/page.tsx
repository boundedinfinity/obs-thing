"use client";

import { motion, useAnimate } from "motion/react";

export default function ObsThing() {
    const [scope, animate] = useAnimate();

    function doRotate() {
        console.log("doRotate");
        animate(
            scope.current,
            { rotate: 360 },
            { duration: 5, onComplete: () => {} }
        );
    }

    return (
        <div className="w-full h-full grid items-center justify-center ">
            <div className="w-[1920px] h-[1080px] grid items-center justify-center bg-green-500">
                <div className="flex gap-4">
                    <motion.div
                        ref={scope}
                        className="test-1 text-9xl text-white"
                    >
                        3
                    </motion.div>
                    <div className="text-9xl text-white">.</div>
                    <div className="text-9xl text-white">1415</div>
                </div>
            </div>
            <button
                onClick={doRotate}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Rotate
            </button>
        </div>
    );
}
