import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { apiFetch } from "../../utils/api";
import "./CreateCampaign.css";

const CreateCampaign = () => {
    const [name, setName] = useState("");
    const [description, setDescription] =
        useState("");
    const [startDate, setStartDate] =
        useState("");
    const [endDate, setEndDate] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");
    const [messageType, setMessageType] =
        useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (!name.trim()) {
            setMessage(
                "Please enter a campaign name."
            );
            setMessageType("error");
            return;
        }

        if (
            startDate &&
            endDate &&
            new Date(endDate) <
            new Date(startDate)
        ) {
            setMessage(
                "End date cannot be before start date."
            );
            setMessageType("error");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: name.trim(),
                description:
                    description.trim() || null,
                startDate: startDate
                    ? `${startDate}T00:00:00.000Z`
                    : null,
                endDate: endDate
                    ? `${endDate}T23:59:59.999Z`
                    : null,
            };

            const response = await apiFetch(
                "/api/campaigns",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to create campaign"
                );
            }

            setMessage(
                "Campaign created successfully."
            );
            setMessageType("success");

            setName("");
            setDescription("");
            setStartDate("");
            setEndDate("");

            window.dispatchEvent(
                new CustomEvent(
                    "campaigns-updated"
                )
            );
        } catch (error) {
            console.error(
                "Create campaign error:",
                error
            );

            setMessage(
                error?.message ||
                "Failed to create campaign"
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-campaign-page">
            <section className="create-campaign-card">

                <div className="create-campaign-header">
                    <div>
                        <h1>
                            Create Campaign
                        </h1>

                        <p>
                            Create a campaign that
                            can be linked to tasks.
                        </p>
                    </div>

                    <div className="create-campaign-icon">
                        <CalendarDays
                            size={25}
                        />
                    </div>
                </div>

                <div className="create-campaign-divider" />

                <form
                    className="create-campaign-form"
                    onSubmit={handleSubmit}
                >

                    {message && (
                        <div
                            className={`create-campaign-message ${messageType}`}
                        >
                            {message}
                        </div>
                    )}

                    {/* CAMPAIGN NAME */}

                    <div className="campaign-field">
                        <label>
                            Campaign Name :
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            placeholder="Enter campaign name"
                            maxLength={150}
                            disabled={loading}
                        />
                    </div>

                    {/* DESCRIPTION */}

                    <div className="campaign-field">
                        <label>
                            Description :
                        </label>

                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Enter campaign description"
                            rows={4}
                            maxLength={1000}
                            disabled={loading}
                        />
                    </div>

                    {/* START DATE */}

                    <div className="campaign-field">
                        <label>
                            Start Date :
                        </label>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(
                                    event.target.value
                                )
                            }
                            disabled={loading}
                        />
                    </div>

                    {/* END DATE */}

                    <div className="campaign-field">
                        <label>
                            End Date :
                        </label>

                        <input
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(event) =>
                                setEndDate(
                                    event.target.value
                                )
                            }
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="campaign-submit-button"
                        disabled={loading}
                    >
                        {loading
                            ? "CREATING..."
                            : "CREATE CAMPAIGN"}
                    </button>
                </form>
            </section>
        </div>
    );
};

export default CreateCampaign;