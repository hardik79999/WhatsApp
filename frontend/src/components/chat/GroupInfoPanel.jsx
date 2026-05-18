import { useState } from "react";
import api from "../../api";
import { showToast } from "../Toast";
import { validateGroupName } from "../../utils/validators";

export default function GroupInfoPanel({ chat, currentUserId, onClose, onChatUpdated, onLeaveGroup }) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(chat.group_name || "");
  const [loading, setLoading] = useState(false);

  const isAdmin = chat.participants?.find(
    (p) => String(p.user_id) === String(currentUserId) && p.role === "admin"
  );

  const saveGroupName = async () => {
    const validation = validateGroupName(newName);
    if (!validation.valid) {
      showToast(validation.error, "error");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.put(`/chats/${chat.id}/info`, { group_name: validation.value });
      onChatUpdated(data);
      setEditingName(false);
    } catch (err) {
      showToast(err.message || "Failed to update name", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await api.delete(`/chats/${chat.id}/participants/${userId}`);
      onChatUpdated({ ...chat, participants: chat.participants.filter((p) => String(p.user_id) !== String(userId)) });
    } catch (err) {
      showToast(err.message || "Failed to remove member", "error");
    }
  };

  const promoteMember = async (userId) => {
    try {
      await api.post(`/chats/${chat.id}/participants/${userId}/promote`);
      onChatUpdated({
        ...chat,
        participants: chat.participants.map((p) =>
          String(p.user_id) === String(userId) ? { ...p, role: "admin" } : p
        ),
      });
    } catch (err) {
      showToast(err.message || "Failed to promote member", "error");
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      await api.delete(`/chats/${chat.id}/participants/${currentUserId}`);
      onLeaveGroup(chat.id);
    } catch (err) {
      showToast(err.message || "Failed to leave group", "error");
    }
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-gray-700">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Group Info</h2>
      </div>

      {/* Group avatar + name */}
      <div className="flex flex-col items-center px-4 py-6 border-b dark:border-gray-700 gap-3">
        {chat.group_picture ? (
          <img src={chat.group_picture} className="w-20 h-20 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-3xl">
            👥
          </div>
        )}

        {editingName ? (
          <div className="flex items-center gap-2 w-full">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-400"
              onKeyDown={(e) => e.key === "Enter" && saveGroupName()}
              autoFocus
            />
            <button onClick={saveGroupName} disabled={loading} className="text-green-500 hover:text-green-600 font-medium text-sm">
              Save
            </button>
            <button onClick={() => setEditingName(false)} className="text-gray-400 hover:text-gray-500 text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {chat.group_name}
            </h3>
            {isAdmin && (
              <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-green-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Group · {chat.participants?.length} members
        </p>
      </div>

      {/* Participants */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {chat.participants?.length} Participants
        </p>
        {chat.participants?.map((p) => {
          const isSelf = String(p.user_id) === String(currentUserId);
          return (
            <div key={p.user_id} className="flex items-center gap-3 py-2.5 group">
              {p.profile_pic ? (
                <img src={p.profile_pic} className="w-9 h-9 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-500">
                  {(p.username || p.phone)?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {p.username || p.phone} {isSelf && <span className="text-gray-400">(you)</span>}
                </p>
              </div>
              {p.role === "admin" && (
                <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}

              {/* Admin controls (hover-reveal) */}
              {isAdmin && !isSelf && (
                <div className="hidden group-hover:flex gap-1">
                  {p.role !== "admin" && (
                    <button
                      onClick={() => promoteMember(p.user_id)}
                      title="Make admin"
                      className="p-1 text-gray-400 hover:text-green-500 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => removeMember(p.user_id)}
                    title="Remove member"
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leave group */}
      <div className="mt-auto px-4 py-4 border-t dark:border-gray-700">
        <button
          onClick={leaveGroup}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-2.5 rounded-xl transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Leave Group
        </button>
      </div>
    </div>
  );
}
