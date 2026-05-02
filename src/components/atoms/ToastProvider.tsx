"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position={"bottom-right"}
      autoClose={2500}
      hideProgressBar={true}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      pauseOnHover
      draggable={false}
      theme="light"
      limit={1}
      toastStyle={{ fontSize: "0.95rem", lineHeight: 1.35, maxWidth: "min(420px, 92vw)" }}
    />
  );
}
