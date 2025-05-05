import { createRoot } from "react-dom/client";
import {App} from "./app";
import "./styles.css";
import '@rainbow-me/rainbowkit/styles.css';
const root = createRoot(document.getElementById("root")!);
root.render(<App />);