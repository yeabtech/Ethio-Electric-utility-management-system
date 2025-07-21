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

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ManagerNotificationPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  // Fetch employees
  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEmployees(data.employees);
      });
  }, []);

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
    if (!content.trim()) {
      setError("Message content is required.");
      return;
    }
    if (file && !fileUrl) {
      setError("Please wait for the file to finish uploading.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body = {
        content,
        subject,
        recipients: employees.map((e) => e.id),
        attachments: fileUrl ? [{ url: fileUrl, name: file?.name }] : [],
      };
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Message sent", description: "Your message was sent to all employees." });
        setContent("");
        setSubject("");
        setFile(null);
        setFileUrl(null);
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
    <div className="max-w-6xl mx-auto py-8 px-2 md:px-0">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Send Message UI */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Send Message to Employees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}
              <Input
                placeholder="Subject (optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mb-2"
              />
              <Textarea
                placeholder="Type your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="mb-2"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="block"
                  disabled={uploading || isUploading}
                />
                {file && (
                  <span className="text-sm text-gray-700">
                    {file.name} {uploading || isUploading ? "(Uploading...)" : fileUrl ? "(Ready)" : ""}
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSend} disabled={loading || uploading || isUploading}>
                {loading ? "Sending..." : "Send to All Employees"}
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
  );
}
