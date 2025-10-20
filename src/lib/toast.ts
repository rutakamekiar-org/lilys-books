"use client";
import { toast, type ToastOptions } from "react-toastify";

const base: ToastOptions = {
    style: {
        whiteSpace: 'pre-line',
    },
};

export const notify = {
  success: (msg: string, opts?: ToastOptions) => toast.success(msg, { ...base, ...opts }),
  error: (msg: string, opts?: ToastOptions) => toast.error(msg, { ...base, ...opts }),
  info: (msg: string, opts?: ToastOptions) => toast.info(msg, { ...base, ...opts }),
  warn: (msg: string, opts?: ToastOptions) => toast.warn(msg, { ...base, ...opts }),
  // expose raw toast if needed
  raw: toast,
};

export default notify;
