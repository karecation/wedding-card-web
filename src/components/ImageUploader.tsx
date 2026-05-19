"use client";

type ImageUploaderProps = {
  image: string;
  onChange: (image: string) => void;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ image, onChange }: ImageUploaderProps) {
  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange(await readFileAsDataUrl(file));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#4c433b]">대표 사진</label>
      <label className="flex min-h-64 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#c9b895] bg-[#fffdf8] text-center transition hover:border-[#9a7b4f]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Cover preview" className="h-full max-h-80 w-full object-cover" />
        ) : (
          <span className="px-8 text-sm leading-6 text-[#756a5c]">
            청첩장 첫 화면에 사용할 대표 사진을 업로드해 주세요.
          </span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={handleChange} />
      </label>
    </div>
  );
}
