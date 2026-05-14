import AudioPlayer from "./AudioPlayer";

const FILE_ICON = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageBubble({ message, isMine }) {
  const bubble = isMine
    ? "bg-green-500 text-white rounded-tr-none"
    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none";

  const renderContent = () => {
    const { message_type, media_url, content, file_size, duration } = message;

    switch (message_type) {
      case "image":
        return (
          <div>
            <a href={media_url} target="_blank" rel="noreferrer">
              <img
                src={media_url}
                alt="Image"
                className="max-w-[240px] max-h-[240px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            </a>
            {content && <p className="mt-1 text-sm">{content}</p>}
          </div>
        );

      case "audio":
        return (
          <AudioPlayer
            src={media_url}
            duration={duration}
          />
        );

      case "video":
        return (
          <video
            src={media_url}
            controls
            className="max-w-[240px] max-h-[200px] rounded-lg"
          />
        );

      case "document":
        return (
          <a
            href={media_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-black/10 dark:bg-white/10 rounded-lg px-3 py-2 hover:bg-black/20 transition-colors"
          >
            <span className="opacity-70">{FILE_ICON}</span>
            <div>
              <p className="text-sm font-medium truncate max-w-[160px]">
                {content || "Document"}
              </p>
              {file_size && (
                <p className="text-xs opacity-70">{formatSize(file_size)}</p>
              )}
            </div>
          </a>
        );

      default:
        if (message.is_deleted) {
          return (
            <p className="text-sm italic opacity-60">
              🚫 This message was deleted
            </p>
          );
        }
        return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${bubble}`}>
        {renderContent()}
        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] opacity-60">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isMine && (
            <span className="text-[10px]">
              {message.status === "read"   ? "✓✓" :
               message.status === "delivered" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}