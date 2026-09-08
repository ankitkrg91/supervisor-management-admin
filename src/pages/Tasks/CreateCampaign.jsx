import { useState } from "react";
import { ChevronDown } from "lucide-react";
import "./CreateCampaign.css";

const taskTypes = {
    MSF: [
        "Daily Inspection",
        "Security Audit",
        "Site Verification",
    ],
    MFM: [
        "Monthly Inspection",
        "Management Audit",
        "Site Review",
    ],
    "OTHER VISIT": [
        "Other Visit",
        "Client Visit",
        "Site Visit",
    ],
    "NIGHT VISIT": [
        "Night Inspection",
        "Night Security Visit",
    ],
};

const tasks = {
    "Daily Inspection": [
        "Routine Site Inspection",
        "Guard Verification",
    ],
    "Security Audit": [
        "Security Compliance Audit",
        "Guard Audit",
    ],
    "Site Verification": [
        "Site Verification",
    ],
    "Monthly Inspection": [
        "Monthly Site Inspection",
    ],
    "Management Audit": [
        "Management Site Audit",
    ],
    "Site Review": [
        "Site Review",
    ],
    "Other Visit": [
        "Other Site Visit",
    ],
    "Client Visit": [
        "Client Visit",
    ],
    "Site Visit": [
        "Site Visit",
    ],
    "Night Inspection": [
        "Night Site Inspection",
    ],
    "Night Security Visit": [
        "Night Security Check",
    ],
};

const CreateCampaign = () => {
    const [taskCategory, setTaskCategory] = useState("");
    const [taskType, setTaskType] = useState("");
    const [task, setTask] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [remark, setRemark] = useState("");

    const handleCategoryChange = (event) => {
        setTaskCategory(event.target.value);

        // Reset dependent fields
        setTaskType("");
        setTask("");
    };

    const handleTaskTypeChange = (event) => {
        setTaskType(event.target.value);

        // Reset task when task type changes
        setTask("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!taskCategory) {
            alert("Please select a task category.");
            return;
        }

        if (!taskType) {
            alert("Please select a task type.");
            return;
        }

        if (!task) {
            alert("Please select a task.");
            return;
        }

        if (!assignedTo) {
            alert("Please select a user.");
            return;
        }

        const campaignData = {
            taskCategory,
            taskType,
            task,
            assignedTo,
            remark,
        };

        console.log("Create Campaign:", campaignData);

        alert("Task scheduled successfully (demo).");
    };

    const availableTaskTypes =
        taskTypes[taskCategory] || [];

    const availableTasks =
        tasks[taskType] || [];

    return (
        <div className="create-campaign-page">
            <section className="create-campaign-card">

                <form
                    className="create-campaign-form"
                    onSubmit={handleSubmit}
                >

                    {/* TASK CATEGORY */}

                    <div className="campaign-field">
                        <label>
                            Task Category :
                        </label>

                        <div className="campaign-select-wrapper">
                            <select
                                value={taskCategory}
                                onChange={handleCategoryChange}
                            >
                                <option value="">
                                    SELECT
                                </option>

                                <option value="MSF">
                                    MSF
                                </option>

                                <option value="MFM">
                                    MFM
                                </option>

                                <option value="OTHER VISIT">
                                    OTHER VISIT
                                </option>

                                <option value="NIGHT VISIT">
                                    NIGHT VISIT
                                </option>
                            </select>

                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* TASK TYPE */}

                    <div className="campaign-field">
                        <label>
                            Task Type :
                        </label>

                        <div className="campaign-select-wrapper">
                            <select
                                value={taskType}
                                onChange={handleTaskTypeChange}
                                disabled={!taskCategory}
                            >
                                <option value="">
                                    Select
                                </option>

                                {availableTaskTypes.map(
                                    (type) => (
                                        <option
                                            value={type}
                                            key={type}
                                        >
                                            {type}
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* TASK */}

                    <div className="campaign-field">
                        <label>
                            Task :
                        </label>

                        <div className="campaign-select-wrapper">
                            <select
                                value={task}
                                onChange={(event) =>
                                    setTask(event.target.value)
                                }
                                disabled={!taskType}
                            >
                                <option value="">
                                    Select
                                </option>

                                {availableTasks.map(
                                    (item) => (
                                        <option
                                            value={item}
                                            key={item}
                                        >
                                            {item}
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* ASSIGNED TO */}

                    <div className="campaign-field">
                        <label>
                            Assigned To :
                        </label>

                        <div className="campaign-select-wrapper">
                            <select
                                value={assignedTo}
                                onChange={(event) =>
                                    setAssignedTo(event.target.value)
                                }
                            >
                                <option value="">
                                    Select
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

                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* REMARK */}

                    <div className="campaign-field">
                        <label>
                            Remark :
                        </label>

                        <input
                            type="text"
                            value={remark}
                            onChange={(event) =>
                                setRemark(event.target.value)
                            }
                        />
                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="campaign-submit-button"
                    >
                        SCHEDULE TASK
                    </button>

                </form>
            </section>
        </div>
    );
};

export default CreateCampaign;