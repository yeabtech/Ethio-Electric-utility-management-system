"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";

// Customer type based on customerVerification + user
interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  mobileNumber?: string;
  idType: string;
  idNumber: string;
  region?: string;
  subCity: string;
  woreda: string;
  kebele?: string;
  homeNumber?: string;
  nationality?: string;
  personalPhoto?: string;
  idPhotoFront?: string;
  idPhotoBack?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  user: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
    imageUrl?: string;
  };
}

export default function UsersAccountPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [processing, setProcessing] = useState<{ [id: string]: string | null }>({});

  // Fetch all customers (all statuses)
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // This endpoint should be updated to return all statuses, not just approved
      const res = await fetch("/api/customer-verifications-all?allStatuses=true");
      const data = await res.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search filter
  useEffect(() => {
    if (!search) {
      setFilteredCustomers(customers);
    } else {
      setFilteredCustomers(
        customers.filter((c) =>
          `${c.firstName} ${c.lastName} ${c.user.email}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      );
    }
  }, [search, customers]);

  // Approve/Reject actions
  const handleAction = async (customer: Customer, action: "approve" | "reject") => {
    setProcessing((prev) => ({ ...prev, [customer.id]: action }));
    try {
      let reason = undefined;
      if (action === "reject") {
        reason = prompt("Enter rejection reason:");
        if (!reason) return;
      }
      const res = await fetch(`/api/cso/verifications/${customer.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "reject" ? JSON.stringify({ reason }) : undefined,
      });
      if (res.ok) {
        await fetchCustomers();
      }
    } finally {
      setProcessing((prev) => ({ ...prev, [customer.id]: null }));
    }
  };

  // Details view
  const handleShowDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  // Table columns
  const columns: ColumnDef<Customer>[] = [
    {
      id: "photo",
      header: "Photo",
      cell: ({ row }) => {
        const imageUrl = row.original.personalPhoto || row.original.user.imageUrl || "/logo.png";
        return (
          <div className="w-10 h-10">
            <img
              src={imageUrl}
              alt="User"
              className="w-full h-full rounded-full object-cover border border-gray-300 shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "/logo.png";
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {row.original.firstName} {row.original.lastName}
        </span>
      ),
    },
    {
      accessorKey: "user.email",
      header: "Email",
      cell: ({ row }) => row.original.user.email,
    },
    {
      accessorKey: "subCity",
      header: "Sub-city",
    },
    {
      accessorKey: "woreda",
      header: "Woreda",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColor =
          status === "approved"
            ? "bg-green-100 text-green-700"
            : status === "rejected"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-block ${statusColor}`}>
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={!!processing[row.original.id] || row.original.status === "approved"}
            onClick={() => handleAction(row.original, "approve")}
          >
            {processing[row.original.id] === "approve" ? (
              <span className="flex items-center gap-1">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </span>
            ) : (
              "Approve"
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!!processing[row.original.id] || row.original.status === "rejected"}
            onClick={() => handleAction(row.original, "reject")}
          >
            {processing[row.original.id] === "reject" ? (
              <span className="flex items-center gap-1">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </span>
            ) : (
              "Reject"
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleShowDetails(row.original)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  // Details view rendering
  if (selectedCustomer) {
    const c = selectedCustomer;
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="sticky top-0 bg-white z-10 pb-4">
          <Button
            variant="secondary"
            onClick={() => setSelectedCustomer(null)}
            className="mb-4 text-lg py-10 px-6"
          >
            <ArrowLeft className="mr-2" /> Go Back to Customers
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Customer Details</h1>
          <div className="space-x-2">
            <Badge
              variant={
                c.status === "approved"
                  ? "success"
                  : c.status === "rejected"
                  ? "destructive"
                  : "warning"
              }
            >
              {c.status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={c.personalPhoto || c.user.imageUrl || "/logo.png"}
                  alt="User"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-medium">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{c.user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p>{c.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p>{c.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p>{c.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p>{c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Identity Info */}
          <Card>
            <CardHeader>
              <CardTitle>Identity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Mobile Number</p>
                <p>{c.mobileNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID Type</p>
                  <p>{c.idType?.replace("_", " ").toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Number</p>
                  <p>{c.idNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Address Info */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Region</p>
                  <p>{c.region}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sub City</p>
                  <p>{c.subCity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Woreda</p>
                  <p>{c.woreda}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kebele</p>
                  <p>{c.kebele}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Home Number</p>
                  <p>{c.homeNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p>{c.nationality}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Document Images */}
        <Card>
          <CardHeader>
            <CardTitle>Document Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Personal Photo</p>
                <img
                  src={c.personalPhoto}
                  alt="Personal Photo"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">ID Photo (Front)</p>
                <img
                  src={c.idPhotoFront}
                  alt="ID Photo Front"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              </div>
              {c.idPhotoBack && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">ID Photo (Back)</p>
                  <img
                    src={c.idPhotoBack}
                    alt="ID Photo Back"
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Rejection Reason */}
        {c.status === "rejected" && c.rejectionReason && (
          <Card>
            <CardHeader>
              <CardTitle>Rejection Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 font-semibold">{c.rejectionReason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Main table view
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">All Customers</h1>
        <div className="w-full md:w-1/3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-600" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-600 focus:outline-none focus:placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-800">
            No customers found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or check back later.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredCustomers} />
      )}
    </div>
  );
}
