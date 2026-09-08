import { useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="admin-layout">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            <div
                className={`main-section ${collapsed ? "sidebar-collapsed" : ""
                    }`}
            >
                <Header />

                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;