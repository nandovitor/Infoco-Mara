
// This file contains types specific to the backend API to avoid dependencies on frontend code.
export interface AttachmentPayload {
    fileName: string;
    content: string; // base64 encoded string
    mimeType: string;
}
