import { useState, useEffect } from "react";
import { Upload, Modal, message, Button } from "antd";
import { UploadOutlined, FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import { useFrappeFileUpload, useFrappeGetDocList, useFrappeDeleteDoc } from "frappe-react-sdk";
import { mapFrappeFilesToAntdUpload } from "../lib/utils";

const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel"
];

const FileAttachment = ({ doctype = "Task", docname = null }) => {

    const file_upload = useFrappeFileUpload();
    const { deleteDoc } = useFrappeDeleteDoc();

    const files_query = useFrappeGetDocList("File", {
        filters: { attached_to_doctype: doctype, attached_to_name: docname },
        fields: ["*"],
    });

    const [serverFiles, setServerFiles] = useState([]);
    const [frappeFileIds, setFrappeFileIds] = useState({});
    const [localFiles, setLocalFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!files_query.data) return;

        const mapped = mapFrappeFilesToAntdUpload(files_query.data);
        setServerFiles(mapped);

        const idMap = {};
        files_query.data.forEach(f => { idMap[f.file_name] = f.name; });
        setFrappeFileIds(idMap);
    }, [files_query.data]);

    // Upload new files
    useEffect(() => {
        const newFiles = localFiles.filter(f => f.originFileObj instanceof File);
        if (!newFiles.length) return;

        const uploadFiles = async () => {
            setUploading(true);
            try {
                for (const file of newFiles) {
                    const res = await file_upload.upload(file.originFileObj, { doctype, docname });
                    setServerFiles(prev => [
                        ...prev,
                        { uid: res.name, name: res.file_name, url: res.file_url, status: "done" }
                    ]);
                }
                setLocalFiles([]);
                message.success("Files uploaded successfully");
                files_query.refetch?.();
            } catch (err) {
                message.error("File upload failed");
            } finally {
                setUploading(false);
            }
        };

        uploadFiles();
    }, [localFiles]);

    // Validate file type before upload
    const beforeUpload = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            message.error("Only images, PDF, Word, or Excel files allowed");
            return Upload.LIST_IGNORE;
        }
        return false;
    };

    // Preview file
    const handlePreview = (file) => {
        const fileUrl = file.url || file.response?.file_url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : null);

        if (!fileUrl) return;

        if (fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            setPreviewFile(fileUrl);
            setPreviewOpen(true);
        } else if (fileUrl.endsWith(".pdf")) {
            window.open(fileUrl, "_blank");
        } else {
            message.info("Preview not available");
        }
    };

    const handleRemove = async (file) => {
        try {
            const frappeFileId = frappeFileIds[file.name];

            if (frappeFileId) {
                setServerFiles(prev => prev.filter(f => f.name !== file.name));
                setFrappeFileIds(prev => { const copy = { ...prev }; delete copy[file.name]; return copy; });
                await deleteDoc("File", frappeFileId);
                message.success("File deleted successfully");
                files_query.refetch?.();
            } else if (file.originFileObj instanceof File) {
                setLocalFiles(prev => prev.filter(f => f !== file));
                message.success("File removed from upload queue");
            }
            return true;
        } catch {
            message.error("Failed to delete file");
            files_query.refetch?.();
            return false;
        }
    };

    const combinedFiles = [...serverFiles, ...localFiles];

    return (
        <>
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Attachments</h3>
            </div>
            <Upload
                multiple
                beforeUpload={beforeUpload}
                fileList={combinedFiles}
                onPreview={handlePreview}
                onRemove={handleRemove}
                disabled={uploading}
                onChange={(info) => setLocalFiles(info.fileList.filter(f => f.originFileObj instanceof File))}
            >
                <Button icon={<UploadOutlined />} loading={uploading}>
                    {uploading ? "Uploading..." : "Select Files"}
                </Button>
            </Upload>

            <Modal
                open={previewOpen}
                footer={null}
                onCancel={() => { setPreviewOpen(false); setIsFullscreen(false); }}
                centered
                width={isFullscreen ? "100vw" : "80vw"}
                style={isFullscreen ? { position: "fixed", top: 0, left: 0, margin: 0, padding: 0 } : {}}
                bodyStyle={isFullscreen ? { padding: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" } : { padding: "20px" }}
                title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Image Preview</span>
                        <Button
                            type="text"
                            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                            onClick={() => setIsFullscreen(!isFullscreen)}
                        >
                            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        </Button>
                    </div>
                }
            >
                <img
                    alt="preview"
                    style={{
                        width: "100%",
                        height: isFullscreen ? "100vh" : "auto",
                        objectFit: "contain",
                        maxWidth: "100%"
                    }}
                    src={previewFile}
                />
            </Modal>
        </>
    );
};

export default FileAttachment;
