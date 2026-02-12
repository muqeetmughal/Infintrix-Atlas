export function mapFrappeFilesToAntdUpload(files = []) {

    const MIME_MAP = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        xls: "application/vnd.ms-excel"
    };

    return files.map((file, index) => {

        const ext = file.file_name.split(".").pop().toLowerCase();

        const uid = `frappe-file-${file.name}-${index}`;

        return {
            uid,
            name: file.file_name,
            size: file.file_size,
            type: MIME_MAP[ext] || "application/octet-stream",
            percent: 0,

            lastModified: new Date(file.modified).getTime(),
            lastModifiedDate: new Date(file.modified),

            originFileObj: {
                uid
            },

            status: "done",
            url: file.file_url
        };
    });
}
