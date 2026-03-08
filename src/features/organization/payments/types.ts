export type ImageData = {
    file: File;
    preview: string; // base64 or object URL for previewing the image
};
    

export type OnlinePaymentMethod = "gcash" | "bank_transfer";