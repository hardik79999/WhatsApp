function Chat({ onLogout }) {
  return (
    // Main Background (WhatsApp Web style light background)
    <div className="flex h-screen bg-[#e5ddd5]">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <div className="w-[30%] min-w-[300px] bg-white flex flex-col border-r border-gray-300">
        
        {/* Sidebar Header (Profile & Icons) */}
        <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden cursor-pointer">
            <img src="https://ui-avatars.com/api/?name=Hardik&background=random" alt="Profile" />
          </div>
          <div className="flex gap-6 text-gray-600 text-xl cursor-pointer">
            <i className="fas fa-users"></i>
            <i className="fas fa-circle-notch"></i>
            <i className="fas fa-comment-alt"></i>
            <i className="fas fa-sign-out-alt" onClick={onLogout} title="Logout"></i>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-2 border-b border-gray-200">
          <div className="bg-[#f0f2f5] flex items-center px-3 py-1.5 rounded-lg">
            <span className="text-gray-500 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full bg-transparent px-4 outline-none text-sm"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {/* Chat Item 1 */}
          <div className="flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-[#f5f6f6]">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-3 overflow-hidden shrink-0">
              <img src="https://ui-avatars.com/api/?name=Rahul&background=random" alt="Rahul" />
            </div>
            <div className="flex-1 border-b border-transparent">
              <div className="flex justify-between items-baseline">
                <h2 className="text-[17px] text-[#111b21] font-normal">Rahul Bhai</h2>
                <span className="text-xs text-[#667781]">10:30 AM</span>
              </div>
              <p className="text-[14px] text-[#667781] truncate">Bhai, API chal gayi?</p>
            </div>
          </div>
          
          {/* Chat Item 2 */}
          <div className="flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-[#f5f6f6]">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-3 overflow-hidden shrink-0">
              <img src="https://ui-avatars.com/api/?name=Priya&background=random" alt="Priya" />
            </div>
            <div className="flex-1 border-b border-transparent">
              <div className="flex justify-between items-baseline">
                <h2 className="text-[17px] text-[#111b21] font-normal">Priya</h2>
                <span className="text-xs text-[#667781]">Yesterday</span>
              </div>
              <p className="text-[14px] text-[#667781] truncate">Okay, milte hain kal.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT CHAT AREA ================= */}
      <div className="flex-1 flex flex-col bg-[#efeae2] relative">
        {/* WhatsApp Background Pattern (Optional CSS trick) */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')]"></div>

        {/* Chat Header */}
        <div className="h-16 bg-[#f0f2f5] flex items-center px-4 border-b border-gray-300 z-10 relative">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 overflow-hidden cursor-pointer">
            <img src="https://ui-avatars.com/api/?name=Rahul&background=random" alt="Rahul" />
          </div>
          <div className="flex-1">
            <h2 className="text-[#111b21] font-medium">Rahul Bhai</h2>
            <span className="text-xs text-[#667781]">click here for contact info</span>
          </div>
          <div className="flex gap-6 text-gray-600 text-xl cursor-pointer">
            <i className="fas fa-search"></i>
            <i className="fas fa-ellipsis-v"></i>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-2 z-10 relative">
          
          {/* Received Message */}
          <div className="bg-white p-2 rounded-lg max-w-[65%] self-start shadow-sm rounded-tl-none relative">
            <span className="text-[14px] text-[#111b21]">Bhai, API chal gayi?</span>
            <span className="text-[11px] text-[#667781] float-right mt-2 ml-2">10:30 AM</span>
          </div>

          {/* Sent Message (Green) */}
          <div className="bg-[#d9fdd3] p-2 rounded-lg max-w-[65%] self-end shadow-sm rounded-tr-none relative">
            <span className="text-[14px] text-[#111b21]">Haan bhai, ekdum mast chal rahi hai! UI par kaam chalu hai.</span>
            <div className="text-[11px] text-[#667781] float-right mt-2 ml-2 flex items-center gap-1">
              <span>10:32 AM</span>
              <span className="text-[#53bdeb]">✓✓</span> {/* Blue Ticks */}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="h-16 bg-[#f0f2f5] flex items-center px-4 gap-4 z-10 relative">
          <span className="text-gray-500 text-2xl cursor-pointer">😊</span>
          <span className="text-gray-500 text-xl cursor-pointer">📎</span>
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Type a message" 
              className="w-full px-4 py-2.5 rounded-lg bg-white outline-none text-[15px]"
            />
          </div>
          <span className="text-gray-500 text-xl cursor-pointer">🎤</span>
        </div>
      </div>

    </div>
  );
}

export default Chat;
