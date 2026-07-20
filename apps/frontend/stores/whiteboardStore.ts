import { create } from "zustand";
import { WhiteboardElement, ElementType } from "../types/whiteboard";
export type WhiteboardAction =
    | "none"
    | "drawing"
    | "moving"
    | "resizing";
    
export type WhiteboardTool =
    | ElementType
    | "pointer"
    | "eraser";

interface WhiteboardState {
    elements: WhiteboardElement[];
    action: WhiteboardAction;
    selectedTool: WhiteboardTool;
    selectedElementIds: string[];
    setElements: (elements: WhiteboardElement[]) => void;
    addElement: (element: WhiteboardElement) => void;
    updateElement: (id: string, updatedElement: Partial<WhiteboardElement>) => void;
    setAction: (action: "none" | "drawing" | "moving" | "resizing") => void;
    setSelectedTool: (tool: ElementType | "pointer" | "eraser") => void;
    setSelectedElementIds: (ids: string[]) => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
    elements: [],
    action: "none",
    selectedTool: "rectangle",
    selectedElementIds: [],

    setElements: (elements) => set({ elements }),
    addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),
    updateElement: (id, updatedElement) =>
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, ...updatedElement } : el
            ),
        })),
    setAction: (action) => set({ action }),
    setSelectedTool: (selectedTool) => set({ selectedTool }),
    setSelectedElementIds: (selectedElementIds) => set({ selectedElementIds }),
}));
