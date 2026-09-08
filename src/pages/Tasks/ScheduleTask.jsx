import { useState } from "react";
import {
    Plus,
    X,
    MapPin,
    CalendarDays,
} from "lucide-react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./ScheduleTask.css";

const defaultPosition = [30.9009, 75.8573];

const markerIcon = new L.Icon({
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const ScheduleTask = () => {
    const [client, setClient] = useState("");
    const [site, setSite] = useState("");
    const [address, setAddress] = useState("");
    const [taskCategory, setTaskCategory] = useState("");
    const [taskType, setTaskType] = useState("");
    const [task, setTask] = useState("");
    const [priority, setPriority] = useState("");

    const [wholeDay, setWholeDay] = useState(true);
    const [scheduleFrom, setScheduleFrom] = useState(
        "2026-08-24"
    );
    const [scheduleTill, setScheduleTill] = useState(
        "2026-08-24"
    );

    const [showInAdvance, setShowInAdvance] =
        useState(true);

    const [showAfterMissed, setShowAfterMissed] =
        useState(true);

    const [assignedTo, setAssignedTo] = useState("");
    const [remark, setRemark] = useState("");

    const handleAddSite = () => {
        console.log("Add Site");
    };

    const handleAddNonSystemUsers = () => {
        console.log("Add Non System Users");
    };

    const handleSchedule = (e) => {
        e.preventDefault();

        const formData = {
            client,
            site,
            address,
            taskCategory,
            taskType,
            task,
            priority,
            wholeDay,
            scheduleFrom,
            scheduleTill,
            showInAdvance,
            showAfterMissed,
            assignedTo,
            remark,
        };

        console.log("Schedule Task:", formData);

        alert("Task scheduled successfully (demo)");
    };

    return (
        <div className="schedule-task-page">
            <div className="schedule-task-card">

                {/* =========================
            FORM
        ========================= */}

                <form
                    className="schedule-task-form"
                    onSubmit={handleSchedule}
                >

                    {/* CLIENT */}

                    <div className="schedule-field">
                        <label>Client</label>

                        <div className="schedule-input-with-action">
                            <input
                                type="text"
                                value={client}
                                onChange={(e) =>
                                    setClient(e.target.value)
                                }
                                placeholder="All Clients (type to filter sites by client)"
                            />

                            <button
                                type="button"
                                className="schedule-remove-button"
                                onClick={() => setClient("")}
                                title="Clear"
                            >
                                <X size={19} />
                            </button>
                        </div>
                    </div>

                    {/* SITE */}

                    <div className="schedule-field">
                        <label>Site ID / Site Name</label>

                        <div className="schedule-site-row">
                            <input
                                type="text"
                                value={site}
                                onChange={(e) =>
                                    setSite(e.target.value)
                                }
                            />

                            <button
                                type="button"
                                className="schedule-blue-button"
                                onClick={handleAddSite}
                            >
                                <Plus size={17} />
                                ADD SITE
                            </button>
                        </div>
                    </div>

                    {/* ADDRESS */}

                    <div className="schedule-field">
                        <label>Address</label>

                        <input
                            type="text"
                            value={address}
                            onChange={(e) =>
                                setAddress(e.target.value)
                            }
                        />
                    </div>

                    {/* TASK CATEGORY */}

                    <div className="schedule-field">
                        <label>Task Category</label>

                        <select
                            value={taskCategory}
                            onChange={(e) =>
                                setTaskCategory(e.target.value)
                            }
                        >
                            <option value="">Select</option>
                            <option value="MSF">MSF</option>
                            <option value="MFM">MFM</option>
                            <option value="OTHER VISIT">
                                OTHER VISIT
                            </option>
                            <option value="NIGHT VISIT">
                                NIGHT VISIT
                            </option>
                        </select>
                    </div>

                    {/* TASK TYPE */}

                    <div className="schedule-field">
                        <label>Task Type</label>

                        <select
                            value={taskType}
                            onChange={(e) =>
                                setTaskType(e.target.value)
                            }
                        >
                            <option value="">Select</option>
                            <option value="Inspection">
                                Inspection
                            </option>
                            <option value="Audit">Audit</option>
                            <option value="Visit">Visit</option>
                            <option value="Verification">
                                Verification
                            </option>
                        </select>
                    </div>

                    {/* TASK */}

                    <div className="schedule-field">
                        <label>Task</label>

                        <select
                            value={task}
                            onChange={(e) =>
                                setTask(e.target.value)
                            }
                        >
                            <option value="">Select</option>
                            <option value="Site Inspection">
                                Site Inspection
                            </option>
                            <option value="Guard Audit">
                                Guard Audit
                            </option>
                            <option value="Night Visit">
                                Night Visit
                            </option>
                            <option value="Security Verification">
                                Security Verification
                            </option>
                        </select>
                    </div>

                    {/* PRIORITY */}

                    <div className="schedule-field">
                        <label>Task Priority</label>

                        <select
                            value={priority}
                            onChange={(e) =>
                                setPriority(e.target.value)
                            }
                        >
                            <option value="">Select</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    {/* WHOLE DAY */}

                    <div className="schedule-checkbox-field">
                        <label>For Whole Day</label>

                        <input
                            type="checkbox"
                            checked={wholeDay}
                            onChange={(e) =>
                                setWholeDay(e.target.checked)
                            }
                        />
                    </div>

                    {/* FROM */}

                    <div className="schedule-field">
                        <label>Schedule From</label>

                        <div className="schedule-date-wrapper">
                            <input
                                type="date"
                                value={scheduleFrom}
                                onChange={(e) =>
                                    setScheduleFrom(e.target.value)
                                }
                            />

                            <CalendarDays size={19} />
                        </div>
                    </div>

                    {/* TILL */}

                    <div className="schedule-field">
                        <label>Schedule Till</label>

                        <div className="schedule-date-wrapper">
                            <input
                                type="date"
                                value={scheduleTill}
                                onChange={(e) =>
                                    setScheduleTill(e.target.value)
                                }
                            />

                            <CalendarDays size={19} />
                        </div>
                    </div>

                    {/* SHOW IN ADVANCE */}

                    <div className="schedule-checkbox-field">
                        <label>Show in Advance</label>

                        <div className="schedule-checkbox-content">
                            <span>Always Show</span>

                            <input
                                type="checkbox"
                                checked={showInAdvance}
                                onChange={(e) =>
                                    setShowInAdvance(e.target.checked)
                                }
                            />
                        </div>
                    </div>

                    {/* SHOW AFTER MISSED */}

                    <div className="schedule-checkbox-field">
                        <label>Show After Missed</label>

                        <div className="schedule-checkbox-content">
                            <span>Always Show</span>

                            <input
                                type="checkbox"
                                checked={showAfterMissed}
                                onChange={(e) =>
                                    setShowAfterMissed(e.target.checked)
                                }
                            />
                        </div>
                    </div>

                    {/* ASSIGNED TO */}

                    <div className="schedule-field">
                        <label>Assigned To</label>

                        <div className="schedule-assigned-row">
                            <input
                                type="text"
                                value={assignedTo}
                                onChange={(e) =>
                                    setAssignedTo(e.target.value)
                                }
                            />

                            <button
                                type="button"
                                className="schedule-blue-button non-system-button"
                                onClick={handleAddNonSystemUsers}
                            >
                                <Plus size={17} />
                                ADD NON SYSTEM
                                <br />
                                USERS
                            </button>
                        </div>
                    </div>

                    {/* REMARK */}

                    <div className="schedule-field">
                        <label>Remark</label>

                        <input
                            type="text"
                            value={remark}
                            onChange={(e) =>
                                setRemark(e.target.value)
                            }
                        />
                    </div>

                    {/* SCHEDULE */}

                    <button
                        type="submit"
                        className="schedule-submit-button"
                    >
                        SCHEDULE
                    </button>
                </form>

                {/* =========================
            MAP
        ========================= */}

                <div className="schedule-map-container">
                    <MapContainer
                        center={defaultPosition}
                        zoom={5}
                        scrollWheelZoom={true}
                        className="schedule-map"
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                            position={defaultPosition}
                            icon={markerIcon}
                        >
                            <Popup>
                                Demo site location
                            </Popup>
                        </Marker>
                    </MapContainer>

                    <div className="schedule-map-switch">
                        <button className="active">
                            Map
                        </button>

                        <button>
                            Satellite
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ScheduleTask;