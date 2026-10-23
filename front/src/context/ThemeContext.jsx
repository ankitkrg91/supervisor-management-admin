import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return (
            localStorage.getItem("supervisor-theme") ||
            "dark"
        );
    });

    useEffect(() => {
        document.documentElement.setAttribute(
            "data-theme",
            theme
        );

        localStorage.setItem(
            "supervisor-theme",
            theme
        );
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "dark"
                ? "light"
                : "dark"
        );
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider"
        );
    }

    return context;
};