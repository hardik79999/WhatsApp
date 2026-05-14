import { useState } from "react";
import axios from "axios";

export default function NewGroupModal({ contacts, onClose, onGroupCreated }) {
  const [step, setStep] = useState(1);            // 1 = pick members, 2 = set name
  const [selected, setSelected] = useState([]);   // array of contact objects
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleContact = (contact) => {
    setSelected((prev) =>
      prev.find((c) => c.contact_id === contact.contact_id)
        ? prev.filter((c) => c.contact_id !== contact.contact_id)
        : [...prev, contact]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length < 1) return;
    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/v1/chats/group",
        {
          group_name: groupName.trim(),
          participant_ids: selected.map((c) => c.contact_id),
        },
        { withCredentials: true }
      );
      onGroupCreated(data);
      onClose();
    } catch (err) {
      console.error("Group creation failed:", err);
      alert(err.response?.data?.detail || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="hover:opacity-80">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <div className="flex-1">
            <h2 className="font-semibold">
              {step === 1 ? "Add Participants" : "New Group"}
            </h2>
            {step === 1 && (
              <p className="text-xs text-green-100">
                {selected.length} of {contacts.length} selected
              </p>
            )}
          </div>
          <button onClick={onClose} className="hover:opacity-80">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 py-2 border-b dark:border-gray-700">
                {selected.map((c) => (
                  <span
                    key={c.contact_id}
                    onClick={() => toggleContact(c)}
                    className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    {c.saved_name || c.phone}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </span>
                ))}
              </div>
            )}

            {/* Contact list */}
            <div className="max-h-80 overflow-y-auto">
              {contacts.map((contact) => {
                const isSelected = !!selected.find((c) => c.contact_id === contact.contact_id);
                return (
                  <div
                    key={contact.contact_id}
                    onClick={() => toggleContact(contact)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      {contact.profile_pic ? (
                        <img src={contact.profile_pic} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                          {(contact.saved_name || contact.phone)?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {contact.saved_name || contact.phone}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {contact.bio || contact.phone}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next button */}
            {selected.length > 0 && (
              <div className="px-4 py-3 border-t dark:border-gray-700">
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          /* Step 2: Group name */
          <div className="px-4 py-6 flex flex-col gap-5">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-3xl">
                👥
              </div>
            </div>

            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGroup()}
              placeholder="Group name"
              maxLength={60}
              autoFocus
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
            />

            <div className="flex flex-wrap gap-2">
              {selected.map((c) => (
                <span key={c.contact_id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                  {c.saved_name || c.phone}
                </span>
              ))}
            </div>

            <button
              onClick={createGroup}
              disabled={!groupName.trim() || loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {loading ? "Creating…" : "Create Group"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}