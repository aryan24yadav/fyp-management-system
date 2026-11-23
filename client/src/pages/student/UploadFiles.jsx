import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  uploadFiles,
  fetchProject,
  downloadFile,
} from "../../store/slices/studentSlice";
import { Archive, FileText, FileCode, FilePlus, File } from "lucide-react";
import { downloadWithThunk, formatFileSize } from "../../lib/download";

// Must match the server limits in server/middlewares/upload.js
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const getFileIcon = (fileName = "") => {
  const extension = fileName.split(".").pop().toLowerCase();
  const color =
    extension === "pdf"
      ? "text-red-500"
      : ["doc", "docx"].includes(extension)
        ? "text-blue-500"
        : ["ppt", "pptx"].includes(extension)
          ? "text-orange-500"
          : "text-slate-500";

  return <File className={`w-8 h-8 ${color}`} />;
};

const UploadFiles = () => {
  const dispatch = useDispatch();
  const { project, files } = useSelector((state) => state.student);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Always refresh: the cached project may be stale.
    dispatch(fetchProject());
  }, [dispatch]);

  const canUpload =
    !!project?._id && !["rejected", "completed"].includes(project.status);

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";

    const tooBig = picked.filter((f) => f.size > MAX_FILE_SIZE);
    if (tooBig.length) {
      toast.error(
        `${tooBig.map((f) => f.name).join(", ")} exceed${tooBig.length === 1 ? "s" : ""} the 10MB limit`,
      );
    }

    const existing = new Set(selectedFiles.map(fileKey));
    let next = [
      ...selectedFiles,
      ...picked.filter(
        (f) => f.size <= MAX_FILE_SIZE && !existing.has(fileKey(f)),
      ),
    ];
    if (next.length > MAX_FILES) {
      toast.error(`You can upload at most ${MAX_FILES} files at once`);
      next = next.slice(0, MAX_FILES);
    }
    setSelectedFiles(next);
  };

  const handleUpload = async () => {
    if (!project?._id) {
      toast.error("Submit a project proposal before uploading files");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Choose at least one file first");
      return;
    }

    setIsUploading(true);
    const result = await dispatch(
      uploadFiles({ projectId: project._id, files: selectedFiles }),
    );
    setIsUploading(false);
    // Keep the selection if the upload failed so the user can retry.
    if (uploadFiles.fulfilled.match(result)) setSelectedFiles([]);
  };

  const removeSelected = (key) => {
    setSelectedFiles((prev) => prev.filter((f) => fileKey(f) !== key));
  };

  const handleDownloadFile = (file) =>
    downloadWithThunk(
      dispatch,
      downloadFile,
      { projectId: project._id, fileId: file._id },
      file.originalName,
    );

  const uploadCards = [
    {
      title: "Project Report",
      hint: "Upload your project report (PDF, DOC, DOCX)",
      accept: ".pdf,.doc,.docx",
      Icon: FileText,
    },
    {
      title: "Presentation",
      hint: "Upload your presentation (PDF, PPT, PPTX)",
      accept: ".pdf,.ppt,.pptx",
      Icon: Archive,
    },
    {
      title: "Code Files",
      hint: "Upload your code (zip, rar, 7z, tar, gz)",
      accept: ".zip,.rar,.7z,.tar,.gz,.tgz",
      Icon: FileCode,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title"> Upload Project Files</h1>
            <p className="card-subtitle">
              Upload your project report, presentation and source code (max
              10MB per file, {MAX_FILES} files at once).
            </p>
          </div>

          {!project?._id && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              You need to submit a project proposal before uploading files.
            </div>
          )}
          {project?._id && !canUpload && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              Files cannot be uploaded to a {project.status} project.
            </div>
          )}

          {/* upload section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {uploadCards.map(({ title, hint, accept, Icon }) => (
              <div
                key={title}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
              >
                <div className="mb-4">
                  <Icon className="w-12 h-12 text-slate-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">{hint}</p>
                <label
                  className={`btn-outline inline-block ${canUpload ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                >
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept={accept}
                    onChange={handleFilePick}
                    disabled={!canUpload}
                    multiple
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleUpload}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canUpload || isUploading || selectedFiles.length === 0}
            >
              {isUploading ? "Uploading..." : "Upload Selected Files"}
            </button>
          </div>
        </div>

        {/* selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title"> Ready to Upload</h2>
            </div>

            <div className="space-y-3">
              {selectedFiles.map((file) => {
                const key = fileKey(file);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {getFileIcon(file.name)}
                      <div>
                        <p className="font-medium text-slate-800">{file.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSelected(key)}
                      className="btn-danger btn-small"
                      disabled={isUploading}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Uploaded Files List*/}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Uploaded Files</h2>
            <p className="card-subtitle">Manage your uploaded project files</p>
          </div>

          {(files || []).length === 0 ? (
            <div className="text-center py-4">
              <FilePlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file._id || file.fileUrl}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {getFileIcon(file.originalName)}
                    <div>
                      <p className="font-medium text-slate-800">
                        {file.originalName}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>{file.fileType || "File"}</span>
                        {file.size ? <span>{formatFileSize(file.size)}</span> : null}
                        {file.uploadedAt && (
                          <span>
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      className="btn-outline btn-small"
                      onClick={() => handleDownloadFile(file)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UploadFiles;
