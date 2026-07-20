'use client'
import { useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import { useWhiteboardStore } from "../../stores/whiteboardStore";
import { initDraw } from "../../lib/initDraw";
import { WhiteboardElement } from "../../types/whiteboard";

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { 
        elements, 
        action, 
        selectedTool, 
        setElements, 
        addElement, 
        updateElement, 
        setAction 
    } = useWhiteboardStore();
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
        
        if (selectedTool === "rectangle" || selectedTool === "ellipse" || selectedTool === "line" || selectedTool === "arrow") {
            setAction("drawing");
            const newElement: WhiteboardElement = {
                id: Date.now().toString(),
                type: selectedTool,
                x: clientX,
                y: clientY,
                width: 0,
                height: 0,
                strokeColor: "white",
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