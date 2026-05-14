import { useState } from "react";
import axios from "axios";
import MediaUploadButton from "./MediaUploadButton";
import VoiceRecorder from "./VoiceRecorder";

export default function ChatInput({ chatId, currentUserId, onMessageSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async (payload) => {
    setSending(true);
    try {
      const { data } = await axios.post(
        "/api/v1/messages/",
        { chat_id: chatId, ...payload },
        { withCredentials: true }
      );
      onMessageSent(data);
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  };

  const handleTextSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText("");
    await sendMessage({ content: trimmed, message_type: "text" });
  };

  // Called after user picks a file and it uploads
  const handleMediaUpload = async (uploadResult) => {
    await sendMessage({
      content: uploadResult.filename,
      message_type: uploadResult.media_type,  // image | video | audio | document
      media_url: uploadResult.media_url,
      file_size: uploadResult.file_size,
    });
  };

  // Called after voice note finishes uploading
  const handleVoiceRecorded = async (uploadResult) => {
    await sendMessage({
      message_type: "audio",
      media_url: uploadResult.media_url,
      file_size: uploadResult.file_size,
      duration: uploadResult.duration,
    });
  };

  return (
    <form
      onSubmit={handleTextSend}
      className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
    >
      <MediaUploadButton onUpload={handleMediaUpload} disabled={sending} />

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
        disabled={sending}
        className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm outline-none
                   text-gray-900 dark:text-gray-100 placeholder-gray-400
                   focus:ring-2 focus:ring-green-400 transition-all"
      />

      {text.trim() ? (
        <button
          type="submit"
          disabled={sending}
          className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      ) : (
        <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={sending} />
      )}
    </form>
  );
}