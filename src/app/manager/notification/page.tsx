"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Alert } from "@/components/ui/alert";
import { useUploadThing } from "@/lib/uploadthing";
import EmployeeInboxPage from "./inbox";
import { useUser } from "@clerk/nextjs";
import { Bell } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SidebarEntry {
  employee: Employee;
  lastMessageAt: string | null;
  unread: boolean;
}

export default function ManagerNotificationPage() {
  const { user } = useUser();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("serviceDocuments");
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>([]);

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

  // Fetch employees
  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEmployees(data.employees);
      });
  }, []);

  // Fetch inbox and sent messages for sidebar (recent, unread, opened chats)
  useEffect(() => {
    if (!internalUserId) return;
    Promise.all([
      fetch(`/api/messages?inbox=1&userId=${internalUserId}`).then((res) => res.json()),
      fetch(`/api/messages?userId=${internalUserId}`).then((res) => res.json()),
    ]).then(([inboxData, sentData]) => {
      if (!inboxData.success && !sentData.success) return;
      // Build a map of employeeId -> { lastMessageAt, unread }
      const map: Record<string, { lastMessageAt: string; unread: boolean }> = {};
      // Inbox: messages received from employees
      if (inboxData.success) {
        for (const msg of inboxData.messages) {
          const senderId = msg.sender?.id;
          if (senderId && senderId !== internalUserId) {
            if (!map[senderId] || new Date(msg.sentAt) > new Date(map[senderId].lastMessageAt)) {
              map[senderId] = { lastMessageAt: msg.sentAt, unread: !msg.read };
            } else if (!msg.read) {
              map[senderId].unread = true;
            }
          }
        }
      }
      // Sent: messages sent to employees
      if (sentData.success) {
        for (const msg of sentData.messages) {
          if (Array.isArray(msg.recipients)) {
            for (const rec of msg.recipients) {
              const recId = rec.id;
              if (recId && recId !== internalUserId) {
                if (!map[recId] || new Date(msg.sentAt) > new Date(map[recId].lastMessageAt)) {
                  map[recId] = { lastMessageAt: msg.sentAt, unread: false };
                }
              }
            }
          }
        }
      }
      setSidebarEntries(
        employees
          .map((emp) => ({
            employee: emp,
            lastMessageAt: map[emp.id]?.lastMessageAt || null,
            unread: map[emp.id]?.unread || false,
          }))
          .sort((a, b) => {
            if (a.lastMessageAt && b.lastMessageAt) {
              return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
            } else if (a.lastMessageAt) {
              return -1;
            } else if (b.lastMessageAt) {
              return 1;
            } else {
              return a.employee.name.localeCompare(b.employee.name);
            }
          })
      );
    });
  }, [internalUserId, employees]);

  // Filter employees by search
  useEffect(() => {
    if (!search) {
      setFilteredEmployees(employees);
      return;
    }
    setFilteredEmployees(
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, employees]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setFileUrl(null);
    setError("");
    if (selectedFile) {
      setUploading(true);
      try {
        const uploaded = await startUpload([selectedFile]);
        if (uploaded && uploaded[0]?.url) {
          setFileUrl(uploaded[0].url);
        } else {
          setError("File upload failed.");
        }
      } catch (err) {
        setError("File upload failed.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSend = async () => {
    if (!selectedEmployee) {
      setError("Please select a recipient.");
      return;
    }
    if (!content.trim()) {
      setError("Message content is required.");
      return;
    }
    if (file && !fileUrl) {
      setError("Please wait for the file to finish uploading.");
      return;
    }
    if (!internalUserId) {
      setError("Could not determine your user ID. Try refreshing the page.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body = {
        content,
        subject,
        senderId: internalUserId,
        recipients: [selectedEmployee.id],
        attachments: fileUrl ? [{ url: fileUrl, name: file?.name }] : [],
      };
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Message sent", description: `Your message was sent to ${selectedEmployee.name}.` });
        setContent("");
        setSubject("");
        setFile(null);
        setFileUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Refresh sidebar after sending
        if (internalUserId) {
          fetch(`/api/messages?inbox=1&userId=${internalUserId}`)
            .then((res) => res.json())
            .then((data) => {
              if (!data.success) return;
              const map: Record<string, { lastMessageAt: string; unread: boolean }> = {};
              for (const msg of data.messages) {
                const senderId = msg.sender?.id;
                if (senderId && senderId !== internalUserId) {
                  if (!map[senderId] || new Date(msg.sentAt) > new Date(map[senderId].lastMessageAt)) {
                    map[senderId] = { lastMessageAt: msg.sentAt, unread: !msg.read };
                  } else if (!msg.read) {
                    map[senderId].unread = true;
                  }
                }
              }
              setSidebarEntries(
                employees.map((emp) => ({
                  employee: emp,
                  lastMessageAt: map[emp.id]?.lastMessageAt || null,
                  unread: map[emp.id]?.unread || false,
                })).sort((a, b) => {
                  if (a.lastMessageAt && b.lastMessageAt) {
                    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
                  } else if (a.lastMessageAt) {
                    return -1;
                  } else if (b.lastMessageAt) {
                    return 1;
                  } else {
                    return a.employee.name.localeCompare(b.employee.name);
                  }
                })
              );
            });
        }
      } else {
        setError(data.error || "Failed to send message.");
      }
    } catch (err) {
      setError("An error occurred while sending the message.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    // Optionally, clear unread alert for this employee in sidebar
    setSidebarEntries((prev) =>
      prev.map((entry) =>
        entry.employee.id === emp.id ? { ...entry, unread: false } : entry
      )
    );
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-100">
      {/* Sidebar: Employee list */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col h-screen max-h-screen">
        <div className="p-4 border-b border-gray-200">
          <Input
            placeholder="Search employee by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="text-black bg-gray-100"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {sidebarEntries.length === 0 && (
            <div className="p-4 text-gray-400 text-center">No employees found.</div>
          )}
          {sidebarEntries
            .filter((entry) =>
              !search ||
              entry.employee.name.toLowerCase().includes(search.toLowerCase()) ||
              entry.employee.email.toLowerCase().includes(search.toLowerCase())
            )
            .map((entry) => (
              <div
                key={entry.employee.id}
                className={`px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-blue-50 border-b border-gray-100 ${selectedEmployee?.id === entry.employee.id ? "bg-blue-100" : ""}`}
                onClick={() => handleSelectEmployee(entry.employee)}
              >
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
                  {entry.employee.name[0]}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-black">{entry.employee.name}</span>
                  <span className="text-xs text-gray-500">{entry.employee.email}</span>
                </div>
                {entry.unread && (
                  <Bell className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
        </div>
      </div>
      {/* Chat panel */}
      <div className="flex-1 flex flex-col h-screen max-h-screen">
        {/* Chat header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-white shadow-sm">
          {selectedEmployee ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
                {selectedEmployee.name[0]}
              </div>
              <div>
                <div className="font-semibold text-black">{selectedEmployee.name}</div>
                <div className="text-xs text-gray-500">{selectedEmployee.email}</div>
              </div>
            </div>
          ) : (
            <span className="text-gray-400">Select an employee to start chatting</span>
          )}
        </div>
        {/* Chat body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
          {selectedEmployee ? (
            <EmployeeInboxPage employeeId={selectedEmployee.id} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select an employee to view messages.
            </div>
          )}
        </div>
        {/* Message input */}
        {selectedEmployee && (
          <div className="border-t border-gray-200 bg-white px-6 py-4 flex flex-col gap-2 sticky bottom-0">
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="Type your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                className="flex-1 text-black bg-gray-100 resize-none"
                disabled={loading || uploading || isUploading}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading || isUploading}
              />
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading || uploading || isUploading || !content.trim()}
                onClick={handleSend}
              >
                {loading ? "Sending..." : "Send"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-gray-300"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isUploading}
              >
                {file ? (uploading || isUploading ? "Uploading..." : fileUrl ? "File Ready" : file.name) : "Attach"}
              </Button>
            </div>
            {file && (
              <div className="text-xs text-gray-600 mt-1">
                {file.name} {uploading || isUploading ? "(Uploading...)" : fileUrl ? "(Ready)" : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
