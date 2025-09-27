
export const downloadBase64AsFile = (base64Data) => {        
    const generateMimeType = (base64Data) => {
        const match = base64Data.match(/^data:(.*?);base64,/);
        return match ? match[1] : null;
    };

    const generateFileName = (mimeType) => {
        const mimeToExt = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/gif": "gif",
            "image/webp": "webp",
            "application/pdf": "pdf",
            "text/plain": "txt",
            "application/json": "json",
            "application/zip": "zip",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        };

        // استخرج الجزء قبل "/" (image, application, text...)
        const category = mimeType.split("/")[0];
        // استخرج الامتداد من الخريطة أو fallback للجزء بعد "/"
        const ext = mimeToExt[mimeType] || mimeType.split("/")[1] || "bin";

        return `sharex_${category}.${ext}`;
    };

    const mimeType = generateMimeType(base64Data);
    const fileName = generateFileName(mimeType);

    const cleaned = base64Data.replace(/^data:.+;base64,/, '');
    const byteCharacters = atob(cleaned);
    const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
};