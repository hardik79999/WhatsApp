export default function ChatListItem({ chat, currentUserId, isActive, onClick }) {
  // For 1-on-1: show the OTHER person. For groups: show group name.
  const isGroup = chat.is_group;

  const displayName = isGroup
    ? chat.group_name
    : chat.participants?.find((p) => String(p.user_id) !== String(currentUserId))?.username
      || chat.participants?.find((p) => String(p.user_id) !== String(currentUserId))?.phone
      || "Unknown";

  const avatarUrl = isGroup
    ? chat.group_picture
    : chat.participants?.find((p) => String(p.user_id) !== String(currentUserId))?.profile_pic;

  const isOnline = !isGroup
    && chat.participants?.find((p) => String(p.user_id) !== String(currentUserId))?.is_online;

  const lastMsg = chat.last_message;
  const lastText =
    lastMsg?.message_type === "image"    ? "📷 Photo" :
    lastMsg?.message_type === "audio"    ? "🎤 Voice note" :
    lastMsg?.message_type === "video"    ? "🎥 Video" :
    lastMsg?.message_type === "document" ? "📄 Document" :
    lastMsg?.content || "";

  const lastTime = lastMsg?.created_at
    ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isActive ? "bg-gray-100 dark:bg-gray-700" : ""
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-lg font-semibold text-gray-600 dark:text-gray-300">
            {isGroup ? "👥" : displayName?.[0]?.toUpperCase()}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white dark:ring-gray-800" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{lastTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lastText}</p>
          {chat.unread_count > 0 && (
            <span className="ml-2 flex-shrink-0 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {chat.unread_count > 9 ? "9+" : chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}