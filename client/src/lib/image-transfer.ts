const TRANSFER_KEY = "ugli_image_transfer";

export interface ImageTransferPayload {
  id: string;
  src: string;
  prompt?: string;
  aspectRatio?: string;
  type?: string;
  timestamp: number;
}

export type TransferDestination = "mockup" | "bg-remover" | "image-editor";

export function transferImageToTool(
  image: { id: string; src: string; name?: string; aspectRatio?: string; type?: string },
  destination: TransferDestination
): string {
  const payload: ImageTransferPayload = {
    id: image.id,
    src: image.src,
    prompt: image.name,
    aspectRatio: image.aspectRatio,
    type: image.type,
    timestamp: Date.now(),
  };

  sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(payload));

  const routes: Record<TransferDestination, string> = {
    "mockup": "/mockup",
    "bg-remover": "/bg-remover",
    "image-editor": "/image-editor",
  };

  return routes[destination];
}

export function getTransferredImage(): ImageTransferPayload | null {
  try {
    const data = sessionStorage.getItem(TRANSFER_KEY);
    if (!data) return null;

    const payload = JSON.parse(data) as ImageTransferPayload;
    
    const maxAge = 5 * 60 * 1000;
    if (Date.now() - payload.timestamp > maxAge) {
      clearTransferredImage();
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function clearTransferredImage(): void {
  sessionStorage.removeItem(TRANSFER_KEY);
}

export async function fetchImageAsDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to fetch image as data URL:", error);
    throw error;
  }
}
