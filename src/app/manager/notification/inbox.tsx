"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
  const [openMessage, setOpenMessage] = useState<Message | null>(null);
  const { toast } = useToast();

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

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
        );
        toast({ title: "Marked as read" });
      }
    } catch {
      toast({ title: "Failed to mark as read", description: "Try again later." });
    }
  };

  const handleOpen = async (msg: Message) => {
    setOpenMessage(msg);
    if (!msg.read) {
      await markAsRead(msg.id);
    }
  };

  const handleCloseModal = () => setOpenMessage(null);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{employeeId ? "Direct Messages" : "Inbox"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-gray-500">No messages{employeeId ? " with this employee." : " in your inbox."}</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border-b pb-3 mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-black">
                      {msg.subject || "(No Subject)"}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(msg.sentAt).toLocaleString()}
                    </span>
                    <Badge variant={msg.read ? "success" : "outline"}>
                      {msg.read ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <div className="text-black text-sm">
                    <span className="font-medium">From: </span>
                    {msg.sender ? (
                      <>
                        <span className="text-black font-semibold">{msg.sender.name}</span>
                        <span className="text-black ml-2">({msg.sender.email})</span>
                      </>
                    ) : (
                      <span className="text-black">Unknown sender</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button size="sm" onClick={() => handleOpen(msg)}>
                    Open
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal for message content */}
      {openMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-black text-xl font-bold"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-2">
              <span className="font-semibold text-black">Subject: </span>
              <span className="text-black">{openMessage.subject || "(No Subject)"}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold text-black">From: </span>
              {openMessage.sender ? (
                <>
                  <span className="text-black font-semibold">{openMessage.sender.name}</span>
                  <span className="text-black ml-2">({openMessage.sender.email})</span>
                </>
              ) : (
                <span className="text-black">Unknown sender</span>
              )}
            </div>
            <div className="mb-4 text-black whitespace-pre-line">
              {openMessage.content}
            </div>
            {openMessage.attachments && openMessage.attachments.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-black">Attachments:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {openMessage.attachments.map((att) => (
                    <div key={att.url} className="flex items-center gap-1">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600 text-xs"
                      >
                        {att.name}
                      </a>
                      <a
                        href={att.url}
                        download={att.name}
                        className="ml-1"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-black hover:text-blue-600" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 