"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";

interface Message {
  id: string;
  subject?: string;
  content: string;
  sentAt: string;
  attachments?: { name: string; url: string }[];
  sender?: { name: string; email: string };
  read: boolean;
}

export default function EmployeeInboxPage() {
  const { user } = useUser();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch inbox messages for this user
  useEffect(() => {
    if (!internalUserId) return;
    setLoading(true);
    fetch(`/api/messages?inbox=1&userId=${internalUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMessages(data.messages);
      })
      .finally(() => setLoading(false));
  }, [internalUserId]);

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

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-gray-500">No messages in your inbox.</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border-b pb-3 mb-3">
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
                <div className="text-black mb-2 whitespace-pre-line">{msg.content}</div>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att) => (
                      <a
                        key={att.url}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600 text-xs"
                      >
                        {att.name}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {!msg.read && (
                    <Button size="sm" onClick={() => markAsRead(msg.id)}>
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
} 