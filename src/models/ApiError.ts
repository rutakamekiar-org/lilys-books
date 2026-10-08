import {ApiErrorDetails} from "@/models/ApiErrorDetails";

export interface ApiError extends Error {
    status?: number;
    details?: ApiErrorDetails;
}
