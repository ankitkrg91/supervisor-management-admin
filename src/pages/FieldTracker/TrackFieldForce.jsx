import {
    Smartphone,
    WifiOff,
    BatteryLow,
    LogIn,
    MapPin,
    Filter,
} from "lucide-react";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    ZoomControl,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "./TrackFieldForce.css";

/*
  Fix Leaflet's default marker icons when using Vite.
*/

const markerIcon = new L.Icon({
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const summaryCards = [
    {
        title: "Online",
        value: 6,
        type: "online",
        icon: Smartphone,
    },
    {
        title: "Offline",
        value: 0,
        type: "offline",
        icon: WifiOff,
    },
    {
        title: "Battery Low",
        value: 0,
        type: "battery",
        icon: BatteryLow,
    },
    {
        title: "Not Checked-In",
        value: 1,
        type: "not-checked",
        icon: LogIn,
    },
];

/*
  Temporary field-force location.
  Later this will come from the backend/mobile GPS system.
*/

const fieldForceLocation = [30.9009, 75.8573];

const TrackFieldForce = () => {
    return (
        <div className="track-field-force-page">
            <section className="track-content-card">
                {/* =========================
            TOP ACTION BAR
        ========================= */}

                <div className="track-toolbar">
                    <div className="track-toolbar-line" />

                    <div className="track-actions">
                        <button
                            type="button"
                            className="track-action-button"
                            title="Show location"
                        >
                            <MapPin size={20} />
                        </button>

                        <button
                            type="button"
                            className="track-action-button"
                            title="Filter field force"
                        >
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* =========================
            SUMMARY CARDS
        ========================= */}

                <div className="track-summary">
                    {summaryCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.title}
                                className={`track-summary-card track-summary-${card.type}`}
                            >
                                <div className="track-summary-content">
                                    <span className="track-summary-title">
                                        {card.title}
                                    </span>

                                    <span className="track-summary-value">
                                        {card.value}
                                    </span>
                                </div>

                                <div className="track-summary-icon">
                                    <Icon size={22} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* =========================
            REAL MAP
        ========================= */}

                <div className="tracking-map">
                    <MapContainer
                        center={fieldForceLocation}
                        zoom={11}
                        scrollWheelZoom={true}
                        zoomControl={false}
                        className="leaflet-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <ZoomControl position="topleft" />

                        <Marker
                            position={fieldForceLocation}
                            icon={markerIcon}
                        >
                            <Popup>
                                <div className="field-force-popup">
                                    <strong>AMIT SAINI-LUDHIANA</strong>

                                    <span>
                                        AO-OPERATION MANAGER
                                    </span>

                                    <span>
                                        Battery: 55%
                                    </span>

                                    <span>
                                        Status: Online
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </section>
        </div>
    );
};

export default TrackFieldForce;