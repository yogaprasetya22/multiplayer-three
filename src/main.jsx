import { insertCoin } from "playroomkit";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

insertCoin({
    skipLobby: true,
    gameId: "MfoZLI8Qp3XnEta2huex",
    discord: true,
}).then(() =>
    ReactDOM.createRoot(document.getElementById("root")).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
);
