/**
 * Converts a library item to a canvas object
 * @param item The library item to convert
 * @param x The x position for the new object
 * @param y The y position for the new object
 * @returns A canvas object ready to be added to the canvas
 */
export function convertLibraryItemToCanvasObject(item, x = 100, y = 100) {
    const baseObject = {
        id: `${item.id}-${Date.now()}`, // Ensure unique ID
        name: item.name,
        x,
        y,
        width: 200,
        height: 100,
        rotation: 0,
        visible: true,
        locked: false,
        opacity: 100,
    };
    // Convert based on item type
    switch (item.type) {
        case "component":
            return {
                ...baseObject,
                type: "rectangle",
                fill: "#3a3a3a",
                stroke: "#5a5a5a",
                strokeWidth: 2,
                cornerRadius: 8,
                width: 200,
                height: 80,
            };
        case "snippet":
            return {
                ...baseObject,
                type: "text",
                text: item.name,
                fontSize: 16,
                fontFamily: "Inter",
                fontWeight: "500",
                textAlign: "left",
                lineHeight: 1.4,
                fill: "#ffffff",
                width: 250,
                height: 60,
            };
        case "page":
            return {
                ...baseObject,
                type: "frame",
                fill: "#1a1a1a",
                stroke: "#3a3a3a",
                strokeWidth: 2,
                cornerRadius: 12,
                width: 300,
                height: 200,
                expanded: true,
                children: [
                    {
                        id: `${item.id}-header-${Date.now()}`,
                        type: "text",
                        name: "Page Header",
                        x: 20,
                        y: 20,
                        width: 260,
                        height: 40,
                        rotation: 0,
                        visible: true,
                        locked: false,
                        opacity: 100,
                        text: item.name,
                        fontSize: 24,
                        fontFamily: "Inter",
                        fontWeight: "600",
                        textAlign: "left",
                        lineHeight: 1.2,
                        fill: "#ffffff",
                    },
                ],
            };
        default:
            return {
                ...baseObject,
                type: "rectangle",
                fill: "#2a2a2a",
                stroke: "#4a4a4a",
                strokeWidth: 1,
                cornerRadius: 4,
                width: 150,
                height: 60,
            };
    }
}
/**
 * Generates a unique ID for canvas objects
 */
export function generateCanvasObjectId(prefix = "object") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
