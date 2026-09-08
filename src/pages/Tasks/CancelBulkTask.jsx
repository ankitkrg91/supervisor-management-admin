import { useRef, useState } from "react";
import {
    Upload,
    FileSpreadsheet,
    Download,
    AlertTriangle,
} from "lucide-react";
import "./CancelBulkTask.css";

const CancelBulkTask = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const validExtensions = [".xlsx", ".xls"];
        const extension = file.name
            .substring(file.name.lastIndexOf("."))
            .toLowerCase();

        if (!validExtensions.includes(extension)) {
            setSelectedFile(null);
            setUploadStatus(
                "Please select a valid Excel file (.xlsx or .xls)."
            );
            return;
        }

        setSelectedFile(file);
        setUploadStatus("");
    };

    const handleUpload = () => {
        if (!selectedFile) {
            setUploadStatus(
                "Please select an Excel file first."
            );
            return;
        }

        /*
          Backend integration will happen later.
    
          Expected backend workflow:
    
          1. Receive Excel file
          2. Read task identifiers
          3. Validate each task
          4. Check whether task can be cancelled
          5. Cancel valid tasks
          6. Return success/error report
        */

        setUploadStatus(
            "File uploaded successfully. Bulk cancellation will be processed by the backend."
        );
    };

    const handleDownloadFormat = () => {
        /*
          Later this will download the official
          Cancel Bulk Task Excel template.
        */

        setUploadStatus(
            "Cancel Bulk Task Excel format will be connected to the backend later."
        );
    };

    const handleClear = () => {
        setSelectedFile(null);
        setUploadStatus("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="cancel-bulk-task-page">

            <section className="cancel-bulk-task-card">

                <div className="cancel-bulk-task-header">
                    <div>
                        <h1>Cancel Bulk Task</h1>

                        <p>
                            Upload an Excel file to cancel multiple
                            scheduled tasks at once.
                        </p>
                    </div>

                    <div className="cancel-bulk-task-icon">
                        <FileSpreadsheet size={25} />
                    </div>
                </div>

                <div className="cancel-bulk-task-divider" />

                {/* Download format */}

                <div className="cancel-bulk-format-row">
                    <div>
                        <h3>Excel Format</h3>

                        <p>
                            Download the template and enter the tasks
                            that need to be cancelled.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="cancel-bulk-download-button"
                        onClick={handleDownloadFormat}
                    >
                        <Download size={17} />
                        DOWNLOAD FORMAT
                    </button>
                </div>

                {/* Upload */}

                <div className="cancel-bulk-upload-box">

                    <div className="cancel-bulk-upload-content">

                        <Upload size={28} />

                        <h3>Select Excel File</h3>

                        <p>
                            Upload the completed Cancel Bulk Task
                            Excel template.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="cancel-bulk-file-input"
                        />

                        <button
                            type="button"
                            className="cancel-bulk-choose-button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                        >
                            CHOOSE FILE
                        </button>

                        <span className="cancel-bulk-file-name">
                            {selectedFile
                                ? selectedFile.name
                                : "No file selected"}
                        </span>

                    </div>
                </div>

                {/* Warning */}

                <div className="cancel-bulk-warning">
                    <AlertTriangle size={19} />

                    <div>
                        <strong>Before cancelling</strong>

                        <p>
                            Only tasks that are eligible for
                            cancellation should be included in the
                            Excel file. Completed tasks should not be
                            cancelled.
                        </p>
                    </div>
                </div>

                {/* Status */}

                {uploadStatus && (
                    <div className="cancel-bulk-status">
                        {uploadStatus}
                    </div>
                )}

                {/* Actions */}

                <div className="cancel-bulk-actions">

                    <button
                        type="button"
                        className="cancel-bulk-clear-button"
                        onClick={handleClear}
                    >
                        CLEAR
                    </button>

                    <button
                        type="button"
                        className="cancel-bulk-upload-button"
                        onClick={handleUpload}
                    >
                        <Upload size={17} />
                        UPLOAD & CANCEL TASKS
                    </button>

                </div>

            </section>
        </div>
    );
};

export default CancelBulkTask;