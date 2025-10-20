"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position={window.innerWidth < 768 ? "top-center" : "bottom-right"}
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      pauseOnHover
      draggable={false}
      theme="colored"
      limit={2}
      toastStyle={{ fontSize: "0.95rem", lineHeight: 1.35, maxWidth: "min(420px, 92vw)" }}
    />
  );
}
