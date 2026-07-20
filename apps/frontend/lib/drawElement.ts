import type { RoughCanvas } from "roughjs/bin/canvas";
import { WhiteboardElement } from "@repo/common/types";

export const drawElement = (rc: RoughCanvas, element: WhiteboardElement) => {
    switch (element.type) {
        case "rectangle":
            rc.rectangle(element.x, element.y, element.width, element.height, {
                stroke: element.strokeColor,
                strokeWidth: 2,
                roughness: 1, // Rough.js sketchy style intensity
                seed: element.seed,
            });
            break;
        case "ellipse":
            // Rough.js ellipse draws from the center, so we offset by half width/height
            rc.ellipse(
                element.x + element.width / 2, 
                element.y + element.height / 2, 
                element.width, 
                element.height, 
                {
                    stroke: element.strokeColor,
                    strokeWidth: 2,
                    roughness: 1,
                    seed: element.seed,
                }
            );
            break;
        case "line":
            rc.line(
                element.x, 
                element.y, 
                element.x + element.width, 
                element.y + element.height, 
                {
                    stroke: element.strokeColor,
                    strokeWidth: 2,
                    roughness: 1,
                    seed: element.seed,
                }
            );
            break;
        // Expand here for other shapes like freedraw, arrow, etc.
    }
};
