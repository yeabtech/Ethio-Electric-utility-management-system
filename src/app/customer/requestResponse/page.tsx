"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ServiceApplication } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface ServiceApplicationWithDetails extends ServiceApplication {
  receipt?: {
    status: string;
    paid: boolean;
    paymentDate?: Date;
    rejectionReason?: string;
  } | null;
  task?: {
    status: string;
    report?: {
      id: string;
      status: string;
      priority: string;
      comments?: Array<{
        id: string;
        content: string;
        createdAt: Date;
        author: {
          email: string;
        };
      }>;
    } | null;
  } | null;
}

export default function RequestResponsePage() {
  const { user } = useUser();
  const [applications, setApplications] = useState<ServiceApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackInputs, setFeedbackInputs] = useState<{ [key: string]: string }>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/customer/applications_`);
        if (!response.ok) throw new Error("Failed to fetch applications");
        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleFeedbackSubmit = async (reportId: string, applicationId: string) => {
    const feedback = feedbackInputs[applicationId];
    if (!feedback?.trim()) return;

    setSubmittingFeedback(prev => ({ ...prev, [applicationId]: true }));

    try {
      const response = await fetch('/api/customer/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          content: feedback.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Clear the input and refresh applications
      setFeedbackInputs(prev => ({ ...prev, [applicationId]: '' }));
      
      // Refresh the applications to show the new comment
      const refreshResponse = await fetch(`/api/customer/applications_`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 text-black dark:text-black">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">Service Request Responses</h1>
      
      {applications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-black dark:text-black">No service applications found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id} className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl text-black dark:text-black">
                    {application.serviceType}
                  </CardTitle>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-black dark:text-black">Category</p>
                      <p className="font-medium text-black dark:text-black">{application.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-black dark:text-black">Submitted Date</p>
                      <p className="font-medium text-black dark:text-black">
                        {format(new Date(application.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>

                  {application.rejectionReason && (
                    <div className="mt-4 p-4 bg-destructive/10 rounded-md border border-destructive/20">
                      <p className="text-sm font-medium text-black dark:text-black">Rejection Reason:</p>
                      <p className="text-black dark:text-black">{application.rejectionReason}</p>
                    </div>
                  )}

                  {application.receipt && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2 text-black dark:text-black">Payment</h3>
                      <Badge className={application.receipt.paid ? "bg-green-500" : "bg-red-500"}>
                        {application.receipt.paid ? "Paid" : "Not Paid"}
                      </Badge>
                    </div>
                  )}

                  {application.task && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2 text-black dark:text-black">Task Status</h3>
                      <Badge className={getStatusColor(application.task.status)}>
                        {application.task.status}
                      </Badge>
                      {application.task.report && (
                        <div className="mt-2 p-4 bg-white dark:bg-white rounded-md">
                          <p className="text-sm font-medium text-black dark:text-black">Task done:</p>
                          <p className="text-black dark:text-black">Signed</p>
                          
                          {/* Customer Feedback Section */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-black dark:text-black mb-3">Customer Feedback</h4>
                            
                            {/* Show feedback input only if no previous comments exist */}
                            {(!application.task.report.comments || application.task.report.comments.length === 0) && (
                              <div className="space-y-2 mb-3">
                                <Textarea
                                  placeholder="Share your feedback about the service..."
                                  value={feedbackInputs[application.id] || ''}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackInputs(prev => ({ 
                                    ...prev, 
                                    [application.id]: e.target.value 
                                  }))}
                                  className="w-full min-h-[80px]"
                                />
                                <div className="flex justify-end">
                                  <Button
                                    onClick={() => handleFeedbackSubmit(application.task!.report!.id, application.id)}
                                    disabled={submittingFeedback[application.id] || !feedbackInputs[application.id]?.trim()}
                                    className="px-6"
                                  >
                                    {submittingFeedback[application.id] ? 'Submitting...' : 'Submit Feedback'}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Existing Comments */}
                            {application.task.report.comments && application.task.report.comments.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-600 dark:text-gray-600 mb-2">Previous feedback:</p>
                                {application.task.report.comments.map((comment) => (
                                  <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-100 rounded-md">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-xs text-gray-600 dark:text-gray-600">
                                        {comment.author.email}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {format(new Date(comment.createdAt), "MMM dd, yyyy")}
                                      </p>
                                    </div>
                                    <p className="text-sm text-black dark:text-black">{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
