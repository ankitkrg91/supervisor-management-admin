import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import AppSocketListener from "./components/common/AppSocketListener";

const App = () => {
    return (
        <BrowserRouter>
            <AppSocketListener />
            <AppRoutes />
        </BrowserRouter>
    );
};

export default App;