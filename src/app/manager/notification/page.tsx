"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Alert } from "@/components/ui/alert";
import { useUploadThing } from "@/lib/uploadthing";
import EmployeeInboxPage from "./inbox";
import { useUser } from "@clerk/nextjs";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
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
  const [showDropdown, setShowDropdown] = useState(false);

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

  // Filter employees by search
  useEffect(() => {
    if (!search) {
      setFilteredEmployees([]);
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
        setSelectedEmployee(null);
        setSearch("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setError(data.error || "Failed to send message.");
      }
    } catch (err) {
      setError("An error occurred while sending the message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-8">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Send Message UI */}
          <div className="flex-1 min-w-0">
            <Card className="bg-white">
              <CardHeader className="bg-white">
                <CardTitle className="text-black">Send Message to Employee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-white">
                {error && <Alert variant="error">{error}</Alert>}
                {/* Recipient selection */}
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1 text-black">Recipient</label>
                  {selectedEmployee ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-black">{selectedEmployee.name} ({selectedEmployee.email})</span>
                      <Button size="sm" variant="outline" onClick={() => setSelectedEmployee(null)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Search employee by name or email..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        autoComplete="off"
                        className="text-black bg-white"
                      />
                      {showDropdown && filteredEmployees.length > 0 && (
                        <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg mt-1 w-full max-h-56 overflow-y-auto">
                          {filteredEmployees.map((emp) => (
                            <div
                              key={emp.id}
                              className="px-4 py-2 cursor-pointer hover:bg-blue-100 text-black"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setShowDropdown(false);
                                setSearch("");
                              }}
                            >
                              {emp.name} <span className="text-xs text-gray-500">({emp.email})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mb-2 text-black bg-white"
                  disabled={!selectedEmployee}
                />
                <Textarea
                  placeholder="Type your message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="mb-2 text-black bg-white"
                  disabled={!selectedEmployee}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="block text-black bg-white"
                    disabled={uploading || isUploading || !selectedEmployee}
                  />
                  {file && (
                    <span className="text-sm text-gray-700">
                      {file.name} {uploading || isUploading ? "(Uploading...)" : fileUrl ? "(Ready)" : ""}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-white">
                <Button onClick={handleSend} disabled={loading || uploading || isUploading || !selectedEmployee} className="text-black bg-white border border-black hover:bg-gray-100">
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          {/* Inbox UI */}
          <div className="flex-1 min-w-0">
            <EmployeeInboxPage />
          </div>
        </div>
      </div>
    </div>
  );
}
