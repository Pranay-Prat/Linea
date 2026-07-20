export type ElementType = "rectangle" | "ellipse" | "arrow" | "line" | "freedraw";

export type WhiteboardElement = {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    strokeColor: string;
};
