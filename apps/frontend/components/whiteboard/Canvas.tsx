'use client'
import { useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import { useWhiteboardStore } from "../../stores/whiteboardStore";
import { initDraw } from "../../lib/initDraw";
import { WhiteboardElement, ElementType } from "@repo/common/types";

export default function Canvas({ roomId }: { roomId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {elements, action, selectedTool, setElements, addElement, updateElement, setAction} = useWhiteboardStore();
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                setElements([...useWhiteboardStore.getState().elements]);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setElements]);
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        initDraw(canvas, elements);
    }, [elements]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const { clientX, clientY } = e;
        if (selectedTool === ElementType.RECTANGLE || selectedTool === ElementType.ELLIPSE || selectedTool === ElementType.LINE || selectedTool === ElementType.ARROW) {
            setAction("drawing");
            const newElement: WhiteboardElement = {
                id: Date.now().toString(),
                type: selectedTool,
                x: clientX,
                y: clientY,
                width: 0,
                height: 0,
                strokeColor: "white",
                seed: Math.floor(Math.random() * 2 ** 31),
            };
            addElement(newElement);
        }
    };
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (action === "drawing") {
            const { clientX, clientY } = e;
            const currentElements = useWhiteboardStore.getState().elements;
            const index = currentElements.length - 1;
            const currentElement = currentElements[index];
            updateElement(currentElement.id, {
                width: clientX - currentElement.x,
                height: clientY - currentElement.y,
            });
        }
    };
    const handlePointerUp = () => {
        setAction("none");
    };
    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        />
    );
}