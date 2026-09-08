import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import "./ScheduleBulkTask.css";

const ScheduleBulkTask = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) {
            alert("Please select an Excel file first.");
            return;
        }

        console.log("Bulk task file:", selectedFile);
        alert("File uploaded successfully (demo).");
    };

    const handleDownloadFormat = () => {
        console.log("Download bulk task format");
        alert("Download format will be connected to the backend later.");
    };

    return (
        <div className="schedule-bulk-task-page">
            <section className="schedule-bulk-card">
                <div className="schedule-bulk-upload-section">
                    <label className="schedule-bulk-label">
                        Select Excel :
                    </label>

                    <div className="schedule-bulk-file-wrapper">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="schedule-bulk-file-input"
                        />

                        <button
                            type="button"
                            className="schedule-bulk-choose-button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                        >
                            Choose File
                        </button>

                        <span className="schedule-bulk-file-name">
                            {selectedFile
                                ? selectedFile.name
                                : "No file chosen"}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="schedule-bulk-upload-button"
                        onClick={handleUpload}
                    >
                        <Upload size={16} />
                        UPLOAD
                    </button>
                </div>

                <button
                    type="button"
                    className="schedule-bulk-download"
                    onClick={handleDownloadFormat}
                >
                    <FileSpreadsheet size={17} />
                    Download format
                </button>
            </section>
        </div>
    );
};

export default ScheduleBulkTask;