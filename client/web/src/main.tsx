import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import HathoraContextProvider from "./context/GameContext";

import App from "./App";
import "./index.css";
import { ChakraProvider } from "@chakra-ui/react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <HathoraContextProvider>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </HathoraContextProvider>
);
