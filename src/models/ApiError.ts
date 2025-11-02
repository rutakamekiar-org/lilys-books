import {ApiErrorDetails} from "@/models/ApiErrorDetails";

export interface ApiError extends Error {
    details?: ApiErrorDetails;
}