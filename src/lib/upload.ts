import type { ImageUploadType } from "@/types/invitation";

export type PendingUpload = {
  id: string;
  type: ImageUploadType | "audio";
  file: File;
  previewUrl: string;
  dataUrl?: string;
};

export type UploadResult = {
  id: string;
  type: PendingUpload["type"];
  publicUrl: string;
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 10 * 1024 * 1024;
const maxAudioSize = 20 * 1024 * 1024;

export function validateUploadFile(file: File, type: PendingUpload["type"]) {
  if (type === "audio") {
    if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith(".mp3")) {
      return "MP3 파일만 업로드할 수 있습니다.";
    }
    if (file.size > maxAudioSize) return "음원 파일은 20MB 이하만 업로드할 수 있습니다.";
    return "";
  }

  if (!allowedImageTypes.includes(file.type)) return "jpg, jpeg, png, webp 이미지만 업로드할 수 있습니다.";
  if (file.size > maxImageSize) return "이미지는 10MB 이하만 업로드할 수 있습니다.";
  return "";
}
