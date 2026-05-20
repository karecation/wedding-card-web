export type ResizeImageOptions = {
  maxWidth?: number;
  quality?: number;
};

export function resizeImageToDataUrl(file: File, options: ResizeImageOptions = {}) {
  const maxWidth = options.maxWidth ?? 1100;
  const quality = options.quality ?? 0.72;

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("이미지를 읽지 못했습니다."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("이미지를 처리하지 못했습니다."));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
