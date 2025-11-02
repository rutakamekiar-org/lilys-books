export interface ApiErrorDetails {
    title?: string;
    errors?: Record<string, string[]>;
    [key: string]: unknown;
}