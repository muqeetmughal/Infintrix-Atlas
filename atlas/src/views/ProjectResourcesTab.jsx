import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Spin, Upload, message } from "antd";
import { UploadOutlined, LinkOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined, FileImageOutlined, FileOutlined, DeleteOutlined, EyeOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useFrappeFileUpload, useFrappeGetCall, useFrappePostCall, useFrappeDeleteDoc } from "frappe-react-sdk";
import { Document, Page, pdfjs } from "react-pdf";
import { useHasRole } from "../hooks/useRole";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const fileIcon = (type) => {
  if (!type) return <FileOutlined />;
  const t = type.toLowerCase();
  if (t === "pdf") return <FilePdfOutlined style={{ color: "#e74c3c" }} />;
  if (t === "spreadsheet" || ["xls", "xlsx", "csv"].includes(t)) return <FileExcelOutlined style={{ color: "#27ae60" }} />;
  if (t === "presentation" || ["ppt", "pptx"].includes(t)) return <FilePptOutlined style={{ color: "#d35400" }} />;
  if (t === "image" || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(t)) return <FileImageOutlined style={{ color: "#8e44ad" }} />;
  if (t === "document" || ["doc", "docx", "odt", "rtf"].includes(t)) return <FileWordOutlined style={{ color: "#2b5797" }} />;
  if (t === "link") return <LinkOutlined style={{ color: "#6366f1" }} />;
  if (["md", "txt"].includes(t)) return <FileOutlined style={{ color: "#3498db" }} />;
  return <FileOutlined style={{ color: "#6366f1" }} />;
};

const isImage = (type) => ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(type?.toLowerCase());
const PREVIEW_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "pdf", "docx", "odt", "rtf", "txt", "md", "csv", "xlsx", "xls", "pptx", "ppt"];
const isPreviewable = (fileUrl) => {
  if (!fileUrl) return false;
  const ext = fileUrl.split(".").pop()?.toLowerCase();
  return PREVIEW_EXTS.includes(ext);
};

const ResourceCard = ({ resource, onPreview, onDelete }) => {
  const type = resource.type?.toLowerCase();
  const hasFile = !!resource.file;
  const ext = resource.file?.split(".").pop()?.toLowerCase();

  return (
    <div className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
      {/* Preview area */}
      <div
        className="h-40 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={() => onPreview(resource)}
      >
        {hasFile && isImage(ext) ? (
          <img
            src={resource.file}
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
            <span style={{ fontSize: 48 }}>{fileIcon(type)}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{type || "file"}</span>
          </div>
        )}
        <div className="hidden" />
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-bold truncate">{resource.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            {resource.visibility}
          </span>
          {hasFile && (
            <span className="text-[10px] text-slate-400">{ext?.toUpperCase()}</span>
          )}
        </div>
      </div>

      {/* Actions overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPreviewable(resource.file || resource.link) && (
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(resource); }}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow-sm text-slate-600 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700"
          >
            <EyeOutlined style={{ fontSize: 14 }} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(resource); }}
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 shadow-sm text-slate-600 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700"
        >
          <DeleteOutlined style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Link indicator */}
      {resource.link && !resource.file && (
        <a
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center gap-2 bg-indigo-600/80 text-white opacity-0 hover:opacity-100 transition-opacity text-sm font-bold"
        >
          <LinkOutlined /> Open Link
        </a>
      )}
    </div>
  );
};

const PreviewModal = ({ resource, open, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [docContent, setDocContent] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  const previewCall = useFrappePostCall("infintrix_atlas.api.v1.preview_document");

  useEffect(() => {
    if (open && resource) {
      setDocContent(null);
      const fileUrl = resource.file;
      if (!fileUrl) return;
      const ext = fileUrl.split(".").pop()?.toLowerCase();
      const previewableExts = ["docx", "txt", "odt", "rtf", "csv", "md", "xlsx", "xls", "pptx", "ppt"];
      if (previewableExts.includes(ext)) {
        setDocLoading(true);
        previewCall.call({ file_url: fileUrl }).then((res) => {
          setDocContent(res.message || res);
        }).catch(() => {
          setDocContent({ type: "error", content: "Failed to load document" });
        }).finally(() => setDocLoading(false));
      }
    }
  }, [open, resource]);

  if (!resource) return null;
  const fileUrl = resource.file || resource.link;
  const ext = resource.file?.split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf";
  const isImg = isImage(ext);
  const previewableExts = ["docx", "txt", "odt", "rtf", "csv", "md", "xlsx", "xls", "pptx", "ppt"];
  const isDoc = previewableExts.includes(ext);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPageNumber(1);
  };

  return (
    <Modal
      title={resource.title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <div className="flex items-center justify-center min-h-[300px] bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
        {isImg ? (
          <img src={fileUrl} alt={resource.title} className="max-w-full max-h-[70vh] object-contain" />
        ) : isPdf ? (
          <div className="w-full flex flex-col items-center">
            <Spin spinning={pdfLoading} className="py-8">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={() => { setPdfLoading(false); message.error("Failed to load PDF"); }}
                className="max-w-full"
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.min(720, window.innerWidth - 80)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </Spin>
            {numPages > 1 && (
              <div className="flex items-center gap-3 mt-3 pb-2">
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                />
                <span className="text-xs font-bold text-slate-500">
                  {pageNumber} / {numPages}
                </span>
                <Button
                  size="small"
                  icon={<RightOutlined />}
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                />
              </div>
            )}
          </div>
        ) : isDoc && docLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spin />
          </div>
        ) : isDoc && docContent ? (
          <div className="w-full max-h-[70vh] overflow-y-auto p-6 bg-white dark:bg-slate-800">
            {docContent.type === "error" ? (
              <div className="flex flex-col items-center gap-4 py-8 text-slate-400">
                <span style={{ fontSize: 48 }}>{fileIcon(resource.type)}</span>
                <p className="text-sm font-semibold">{docContent.content}</p>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button type="primary" icon={<EyeOutlined />}>Open File</Button>
                </a>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {docContent.content}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-slate-400">
            <span style={{ fontSize: 64 }}>{fileIcon(resource.type)}</span>
            <p className="text-sm font-semibold">Preview not available</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Button type="primary" icon={<EyeOutlined />}>Open File</Button>
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

const ProjectResourcesTab = ({ projectId }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState("");
  const [visibility, setVisibility] = useState("Internal");
  const [previewResource, setPreviewResource] = useState(null);
  const { has: isInternal } = useHasRole("Projects Manager");
  const isCustomer = !isInternal;
  const fileUpload = useFrappeFileUpload();
  const createResource = useFrappePostCall("infintrix_atlas.api.v1.create_project_resource");
  const { data, isLoading, mutate } = useFrappeGetCall(
    "infintrix_atlas.api.v1.list_project_resources",
    { project: projectId, include_internal: true },
    projectId ? ["project_resources", projectId] : null,
  );
  const { deleteDoc } = useFrappeDeleteDoc();
  const resources = data?.message || [];

  const handleUpload = async () => {
    setUploading(true);
    try {
      let fileUrl = null;
      if (file) {
        const res = await fileUpload.upload(file, { doctype: "Project Resource", docname: "temp" });
        fileUrl = res.file_url;
      }
      await createResource.call({
        project: projectId,
        phase: null,
        title: title.trim(),
        file_url: fileUrl,
        link: link || null,
        visibility: isCustomer ? "Both" : visibility,
      });
      message.success("Resource added");
      setTitle("");
      setFile(null);
      setLink("");
      setVisibility("Internal");
      mutate();
    } catch {
      message.error("Failed to add resource");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (resource) => {
    Modal.confirm({
      title: `Delete "${resource.title}"?`,
      content: "This cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteDoc("Project Resource", resource.name);
          message.success("Deleted");
          mutate();
        } catch {
          message.error("Failed to delete");
        }
      },
    });
  };

  const fileExt = file?.name?.split(".").pop()?.toLowerCase();

  return (
    <div className="p-6 space-y-8">
      {/* Upload Section */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5 text-center">Upload Resource</h4>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 w-full space-y-2">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="large"
                className="font-semibold"
              />
              <Input
                placeholder="Link URL (optional — leave blank to upload a file)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                size="large"
                prefix={<LinkOutlined />}
                disabled={!!file}
              />
              {isCustomer ? (
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 px-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Visible to you and client
                </div>
              ) : (
                <Select
                  value={visibility}
                  onChange={setVisibility}
                  size="large"
                  className="w-full"
                  options={[
                    { value: "Internal", label: "Internal (team only)" },
                    { value: "Both", label: "Both (team + client)" },
                  ]}
                />
              )}
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Upload
                beforeUpload={(f) => { setFile(f); return false; }}
                onRemove={() => setFile(null)}
                fileList={file ? [{ uid: "-1", name: file.name }] : []}
                maxCount={1}
                disabled={!!link}
                className="w-full"
              >
                <Button
                  icon={<UploadOutlined />}
                  disabled={!!link}
                  size="large"
                  className="w-full"
                >
                  {file ? "Change File" : "Select File"}
                </Button>
              </Upload>
              <Button
                type="primary"
                onClick={handleUpload}
                loading={uploading}
                size="large"
                className="w-full"
                icon={file || link ? <UploadOutlined /> : null}
              >
                {uploading ? "Uploading..." : "Add Resource"}
              </Button>
            </div>
          </div>
          {file && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span style={{ fontSize: 24 }}>{fileIcon(fileExt)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Resources <span className="text-slate-300">({resources.length})</span>
          </h4>
          <div className="flex gap-1">
            {["All", "PDF", "Image", "DOC", "Link"].map((f) => (
              <button
                key={f}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <Spin spinning={isLoading}>
          {resources.length === 0 ? (
            <div className="text-center py-16">
              <UploadOutlined style={{ fontSize: 48, color: "#cbd5e1" }} />
              <p className="mt-3 text-sm font-semibold text-slate-400">No resources yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload a file or add a link above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {resources.map((r) => (
                <ResourceCard
                  key={r.name}
                  resource={r}
                  onPreview={setPreviewResource}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </Spin>
      </div>

      <PreviewModal
        resource={previewResource}
        open={!!previewResource}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  );
};

export default ProjectResourcesTab;
