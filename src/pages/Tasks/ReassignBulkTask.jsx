import { useRef, useState } from "react";
import {
    Upload,
    FileSpreadsheet,
    Download,
    UserRound,
    ArrowRightLeft,
    AlertTriangle,
} from "lucide-react";
import "./ReassignBulkTask.css";

const ReassignBulkTask = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [assignedTo, setAssignedTo] = useState("");
    const [status, setStatus] = useState("");

    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const extension = file.name
            .substring(file.name.lastIndexOf("."))
            .toLowerCase();

        if (![".xlsx", ".xls"].includes(extension)) {
            setSelectedFile(null);
            setStatus(
                "Please select a valid Excel file (.xlsx or .xls)."
            );
            return;
        }

        setSelectedFile(file);
        setStatus("");
    };

    const handleDownloadFormat = () => {
        setStatus(
            "Reassign Bulk Task Excel format will be connected to the backend later."
        );
    };

    const handleReassign = () => {
        if (!selectedFile) {
            setStatus("Please select an Excel file first.");
            return;
        }

        if (!assignedTo) {
            setStatus("Please select a field force user.");
            return;
        }

        /*
          Backend workflow later:
    
          1. Read task IDs from Excel.
          2. Validate every task.
          3. Check that task can be reassigned.
          4. Verify the new user.
          5. Reassign valid tasks.
          6. Return success/error report.
        */

        setStatus(
            "Tasks reassigned successfully (demo)."
        );
    };

    const handleClear = () => {
        setSelectedFile(null);
        setAssignedTo("");
        setStatus("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="reassign-bulk-task-page">
            <section className="reassign-bulk-task-card">

                {/* HEADER */}

                <div className="reassign-bulk-header">
                    <div>
                        <h1>Reassign Bulk Task</h1>

                        <p>
                            Reassign multiple scheduled tasks to
                            another field force user.
                        </p>
                    </div>

                    <div className="reassign-bulk-icon">
                        <ArrowRightLeft size={25} />
                    </div>
                </div>

                <div className="reassign-bulk-divider" />

                {/* EXCEL FORMAT */}

                <div className="reassign-bulk-format-row">
                    <div>
                        <h3>Excel Format</h3>

                        <p>
                            Download the template and enter the tasks
                            that need to be reassigned.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="reassign-download-button"
                        onClick={handleDownloadFormat}
                    >
                        <Download size={17} />
                        DOWNLOAD FORMAT
                    </button>
                </div>

                {/* UPLOAD */}

                <div className="reassign-upload-box">
                    <div className="reassign-upload-content">

                        <FileSpreadsheet size={30} />

                        <h3>Select Excel File</h3>

                        <p>
                            Upload the completed Reassign Bulk Task
                            Excel template.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="reassign-file-input"
                        />

                        <button
                            type="button"
                            className="reassign-choose-button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                        >
                            CHOOSE FILE
                        </button>

                        <span className="reassign-file-name">
                            {selectedFile
                                ? selectedFile.name
                                : "No file selected"}
                        </span>
                    </div>
                </div>

                {/* ASSIGN USER */}

                <div className="reassign-user-section">

                    <div className="reassign-user-title">
                        <UserRound size={19} />

                        <div>
                            <h3>Reassign To</h3>

                            <p>
                                Select the field force user who should
                                receive these tasks.
                            </p>
                        </div>
                    </div>

                    <select
                        value={assignedTo}
                        onChange={(e) =>
                            setAssignedTo(e.target.value)
                        }
                    >
                        <option value="">
                            Select Field Force User
                        </option>

                        <option value="AMIT SAINI">
                            AMIT SAINI
                        </option>

                        <option value="GURMEET SINGH">
                            GURMEET SINGH
                        </option>

                        <option value="GURVINDER SINGH">
                            GURVINDER SINGH
                        </option>

                        <option value="SANJIV KUMAR">
                            SANJIV KUMAR
                        </option>

                        <option value="VIKRAM NISCHAL">
                            VIKRAM NISCHAL
                        </option>
                    </select>
                </div>

                {/* WARNING */}

                <div className="reassign-warning">
                    <AlertTriangle size={19} />

                    <div>
                        <strong>Before reassigning</strong>

                        <p>
                            Make sure the selected user is available
                            and authorized to perform the assigned
                            tasks. Existing task history should remain
                            unchanged.
                        </p>
                    </div>
                </div>

                {/* STATUS */}

                {status && (
                    <div className="reassign-status">
                        {status}
                    </div>
                )}

                {/* ACTIONS */}

                <div className="reassign-actions">

                    <button
                        type="button"
                        className="reassign-clear-button"
                        onClick={handleClear}
                    >
                        CLEAR
                    </button>

                    <button
                        type="button"
                        className="reassign-submit-button"
                        onClick={handleReassign}
                    >
                        <ArrowRightLeft size={17} />
                        REASSIGN TASKS
                    </button>

                </div>
            </section>
        </div>
    );
};

export default ReassignBulkTask;