import { useRef } from "react";
import axios from "axios";

const ACCEPT = "image/*,video/mp4,video/webm,audio/*,application/pdf,.doc,.docx";

export default function MediaUploadButton({ onUpload, disabled }) {
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/v1/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      onUpload(data);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
        title="Attach file"
      >
        {/* Paperclip icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
    </>
  );
}