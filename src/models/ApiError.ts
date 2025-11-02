import {ApiErrorDetails} from "@/lib/api";

export interface ApiError extends Error {
    details?: ApiErrorDetails;
}