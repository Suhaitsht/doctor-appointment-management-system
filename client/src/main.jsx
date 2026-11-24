import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "sonner";

import "./index.css";
import { router } from "./routes/router.jsx";
import { store } from "./redux/store";
import { setupAuthInterceptor } from "./api/authInterceptor";

import { NotificationProvider } from "./context/NotificationContext";

setupAuthInterceptor(store);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <NotificationProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </NotificationProvider>
    </Provider>
  </StrictMode>,
);
