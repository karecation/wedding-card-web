"use client";

type GalleryUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function GalleryUploader({ images, onChange }: GalleryUploaderProps) {
  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const nextImages = await Promise.all(files.map(readFileAsDataUrl));
    onChange([...images, ...nextImages]);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#4c433b]">갤러리 사진</label>
      <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#c9b895] bg-[#fffdf8] px-6 text-center transition hover:border-[#9a7b4f]">
        <span className="text-sm leading-6 text-[#756a5c]">여러 장의 사진을 추가해 주세요.</span>
        <input type="file" accept="image/*" multiple className="sr-only" onChange={handleChange} />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <button
              key={`${image.slice(0, 30)}-${index}`}
              type="button"
              onClick={() => removeImage(index)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[#e4d8c6]"
              aria-label="갤러리 사진 삭제"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-[#2d2926]/0 text-xs font-medium uppercase tracking-[0.16em] text-white opacity-0 transition group-hover:bg-[#2d2926]/45 group-hover:opacity-100">
                삭제
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
