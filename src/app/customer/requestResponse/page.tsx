"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ServiceApplication } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    report?: string;
  } | null;
}

export default function RequestResponsePage() {
  const { user } = useUser();
  const [applications, setApplications] = useState<ServiceApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Service Request Responses</h1>
      
      {applications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground">No service applications found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <Card key={application.id} className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl text-foreground">
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
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium text-foreground">{application.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted Date</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(application.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>

                  {application.rejectionReason && (
                    <div className="mt-4 p-4 bg-destructive/10 rounded-md border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                      <p className="text-destructive/80">{application.rejectionReason}</p>
                    </div>
                  )}

                  {application.receipt && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2 text-foreground">Payment</h3>
                      <Badge className={application.receipt.paid ? "bg-green-500" : "bg-red-500"}>
                        {application.receipt.paid ? "Paid" : "Not Paid"}
                      </Badge>
                    </div>
                  )}

                  {application.task && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2 text-foreground">Task Status</h3>
                      <Badge className={getStatusColor(application.task.status)}>
                        {application.task.status}
                      </Badge>
                      {application.task.report && (
                        <div className="mt-2 p-4 bg-muted rounded-md">
                          <p className="text-sm font-medium text-foreground">Task Report:</p>
                          <p className="text-foreground">{application.task.report}</p>
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
