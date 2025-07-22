"use client";

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useUser } from "@clerk/nextjs";
import { Download } from "lucide-react";

interface MessageRecipient {
  id: string;
  name?: string;
  read: boolean;
}

interface Message {
  id: string;
  subject?: string;
  content: string;
  sentAt: string;
  attachments?: { name: string; url: string }[];
  sender?: { name: string; email: string; id?: string };
  recipients?: MessageRecipient[];
  read: boolean;
}

interface EmployeeInboxPageProps {
  employeeId?: string;
}

const EmployeeInboxPage = forwardRef(function EmployeeInboxPage({ employeeId }: EmployeeInboxPageProps, ref) {
  const { user } = useUser();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get internal user ID from Clerk user ID
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/users?clerkUserId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.id) setInternalUserId(data.id);
        });
    }
  }, [user]);

  // Fetch both inbox and sent messages, filter to those exchanged with employeeId
  const fetchMessages = () => {
    if (!internalUserId || !employeeId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/messages?inbox=1&userId=${internalUserId}`).then((res) => res.json()),
      fetch(`/api/messages?userId=${internalUserId}`).then((res) => res.json()),
    ]).then(([inboxData, sentData]) => {
      let all: Message[] = [];
      // Messages where I am a recipient and sender is the selected employee
      if (inboxData.success) {
        all = all.concat(
          inboxData.messages.filter((msg: Message) =>
            msg.sender?.id === employeeId &&
            Array.isArray(msg.recipients) && msg.recipients.some((r) => r.id === internalUserId)
          )
        );
      }
      // Messages where I am the sender and selected employee is a recipient
      if (sentData.success) {
        all = all.concat(
          sentData.messages.filter((msg: Message) =>
            msg.sender?.id === internalUserId &&
            Array.isArray(msg.recipients) && msg.recipients.some((r) => r.id === employeeId)
          )
        );
      }
      // Sort by sentAt ascending (oldest at top)
      all.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      setMessages(all);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, [internalUserId, employeeId]);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchMessages,
  }));

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return <div className="text-gray-500 text-center py-8">Loading...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="text-gray-400 text-center text-lg opacity-60 select-none">No messages yet</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {messages.map((msg) => {
          const isSentByMe = msg.sender?.id === internalUserId;
          return (
            <div
              key={msg.id}
              className={`flex mb-2 ${isSentByMe ? "justify-end" : "justify-start"}`}
            >
              {/* Avatar on left for received, right for sent */}
              {!isSentByMe && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700 mr-2">
                  {msg.sender?.name && msg.sender.name.trim().length > 0
                    ? msg.sender.name.trim()[0].toUpperCase()
                    : (msg.sender?.email ? msg.sender.email[0].toUpperCase() : "-")}
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${isSentByMe ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2 shadow-sm text-sm whitespace-pre-line break-words ${
                    isSentByMe
                      ? "bg-blue-500 text-black rounded-br-md"
                      : "bg-gray-200 text-black rounded-bl-md"
                  }`}
                >
                  {msg.content}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {msg.attachments.map((att) => (
                        <a
                          key={att.url}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-xs text-black hover:text-blue-700"
                        >
                          {att.name}
                          <Download className="inline w-4 h-4 ml-1 text-black" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <span className="text-black">{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {/* Telegram-style checkmarks for sent messages */}
                  {isSentByMe && (() => {
                    const rec = Array.isArray(msg.recipients)
                      ? msg.recipients.find(r => r.id === employeeId)
                      : null;
                    const isRead = rec ? rec.read : false;
                    return (
                      <span className={`ml-1 text-lg ${isRead ? "text-blue-300" : "text-blue-600"}`} title={isRead ? "Seen" : "Sent"}>
                        {isRead ? "✓✓" : "✓"}
                      </span>
                    );
                  })()}
                </div>
              </div>
              {isSentByMe && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-lg font-bold text-green-700 ml-2">
                  {user?.firstName ? user.firstName[0] : "M"}
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
});

export default EmployeeInboxPage; 