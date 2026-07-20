import rough from "roughjs";
import { WhiteboardElement } from "@repo/common/types";
import { drawElement } from "./drawElement";

export const initDraw = (
    canvas: HTMLCanvasElement,
    elements: WhiteboardElement[]
) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rc = rough.canvas(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    elements.forEach(element => {
        drawElement(rc, element);
    });
};
