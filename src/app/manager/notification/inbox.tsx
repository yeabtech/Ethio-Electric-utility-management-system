"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Download } from "lucide-react";

interface Message {
  id: string;
  subject?: string;
  content: string;
  sentAt: string;
  attachments?: { name: string; url: string }[];
  sender?: { name: string; email: string; id?: string };
  recipients?: { id: string }[];
  read: boolean;
}

interface EmployeeInboxPageProps {
  employeeId?: string;
}

export default function EmployeeInboxPage({ employeeId }: EmployeeInboxPageProps) {
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

  // Fetch messages for this user (DM if employeeId is provided)
  useEffect(() => {
    if (!internalUserId) return;
    setLoading(true);
    let url = `/api/messages?inbox=1&userId=${internalUserId}`;
    if (employeeId) {
      url += `&dmWith=${employeeId}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMessages(data.messages);
      })
      .finally(() => setLoading(false));
  }, [internalUserId, employeeId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return <div className="text-gray-500 text-center py-8">Loading...</div>;
  }

  if (messages.length === 0) {
    return <div className="text-gray-400 text-center py-8">No messages{employeeId ? " with this employee." : " in your inbox."}</div>;
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
                  {msg.sender?.name ? msg.sender.name[0] : "?"}
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${isSentByMe ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2 shadow-sm text-sm whitespace-pre-line break-words ${
                    isSentByMe
                      ? "bg-blue-500 text-white rounded-br-md"
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
                          className="underline text-xs text-blue-100 hover:text-blue-300"
                        >
                          {att.name}
                          <Download className="inline w-4 h-4 ml-1" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <span>{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {/* Telegram-style checkmarks for sent messages */}
                  {isSentByMe && (
                    <span className={`ml-1 text-lg ${msg.read ? "text-blue-300" : "text-blue-600"}`} title={msg.read ? "Seen" : "Sent"}>
                      {msg.read ? "✓✓" : "✓"}
                    </span>
                  )}
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
} 