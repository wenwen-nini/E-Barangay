
export function formatId(id, prefix = "", length = 2) {
    if (id === null || id === undefined || id === "") {
        return "Unavailable";
    }

    const formattedId = String(id).padStart(length, "0");

    return prefix ? `${prefix}-${formattedId}` : formattedId;
}