"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, CheckCircle, XCircle, Clock } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Footer } from "@/components/footer"

interface Prescription {
  prescriptionId: number
  imageFile: string
  uploadDate: string
  approved: boolean | null
  pharmacistId?: number
  note?: string
  customerId?: number
  orderId?: number
  patientName?: string
  patientPhoneNumber?: string
  customerInfo?: {
    name?: string
    email?: string
    address?: string
    phoneNumber?: string
    dateOfBirth?: string
    gender?: string
  }
}

export default function UploadPrescriptionPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"customer" | "staff">("customer")
  useEffect(() => {
    if (user?.role === "pharmacist") setActiveTab("staff");
    if (user?.role === "customer") setActiveTab("customer");
  }, [user]);

  const [formData, setFormData] = useState({
    imageFile: null as File | null
  })
  const [formError, setFormError] = useState<string | null>(null);

  const [customerPrescriptions, setCustomerPrescriptions] = useState<Prescription[]>([])
  const [pharmacistPrescriptions, setPharmacistPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [prescriptionIdFilter, setPrescriptionIdFilter] = useState("");
  const [customerIdFilter, setCustomerIdFilter] = useState("");
  const [debouncedPrescriptionId, setDebouncedPrescriptionId] = useState("");
  const [debouncedCustomerId, setDebouncedCustomerId] = useState("");
  const [customerInfo, setCustomerInfo] = useState<{
    name?: string;
    email?: string;
    address?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
  } | null>(null);

  // Debounce filters for backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPrescriptionId(prescriptionIdFilter);
      setDebouncedCustomerId(customerIdFilter);
    }, 400);
    return () => clearTimeout(handler);
  }, [prescriptionIdFilter, customerIdFilter]);

  // Fetch customer info for the signed-in account (for display)
  useEffect(() => {
    async function fetchCustomerInfo() {
      if (user?.linkedId) {
        const res = await fetch(`/api/customers/${user.linkedId}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerInfo(data.customer || null);
        }
      }
    }
    if (user?.role === "customer" && user.linkedId) {
      fetchCustomerInfo();
    }
  }, [user]);

  // Fetch prescriptions for staff view (backend-driven pagination)
  const fetchPrescriptions = async () => {
    setIsLoading(true);
    const statusParams = selectedStatuses.map(s => `status=${encodeURIComponent(s)}`).join('&');
    const prescriptionIdParam = debouncedPrescriptionId ? `&prescriptionId=${encodeURIComponent(debouncedPrescriptionId)}` : '';
    const customerIdParam = debouncedCustomerId ? `&customerId=${encodeURIComponent(debouncedCustomerId)}` : '';
    const query = [`page=${page}`, `pageSize=${pageSize}`, statusParams, prescriptionIdParam, customerIdParam]
      .filter(Boolean)
      .join('&');
    const response = await fetch(`/api/prescriptions?${query}`);
    if (!response.ok) {
      setPharmacistPrescriptions([]);
      setStatusCounts({ pending: 0, approved: 0, rejected: 0 });
      setTotal(0);
      setIsLoading(false);
      return;
    }
    const result = await response.json();
    setPharmacistPrescriptions(Array.isArray(result.data) ? result.data : []);
    setStatusCounts(result.statusCounts || { pending: 0, approved: 0, rejected: 0 });
    setTotal(result.total || 0);
    setIsLoading(false);
  };

  // Fetch prescriptions when filters/page change (pharmacist)
  useEffect(() => {
    if (user && user.role === "pharmacist" && activeTab === "staff") {
      fetchPrescriptions();
    }
    // eslint-disable-next-line
  }, [user, activeTab, page, pageSize, selectedStatuses, debouncedPrescriptionId, debouncedCustomerId]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedStatuses, debouncedPrescriptionId, debouncedCustomerId]);

  // Fetch customer prescriptions (for customer view)
  useEffect(() => {
    async function fetchCustomerPrescriptions() {
      if (user && user.role === "customer" && activeTab === "customer" && user.linkedId) {
        setIsLoading(true);
        const res = await fetch(`/api/prescriptions?customerId=${user.linkedId}&page=${page}&pageSize=${pageSize}`);
        const data = await res.json();
        // For each prescription, fetch customer info for display
        const enriched = await Promise.all(
          (Array.isArray(data.data) ? data.data : []).map(async (prescription: Prescription) => {
            if (prescription.customerId) {
              const res = await fetch(`/api/customers/${prescription.customerId}`);
              if (res.ok) {
                const customerData = await res.json();
                return { ...prescription, customerInfo: customerData.customer };
              }
            }
            return prescription;
          })
        );
        setCustomerPrescriptions(enriched);
        setTotal(data.total || (Array.isArray(data.data) ? data.data.length : 0));
        setIsLoading(false);
      }
    }
    fetchCustomerPrescriptions();
  }, [user, activeTab, page, pageSize]);

  const getStatus = (approved: boolean | null) => {
    if (approved === null || approved === undefined) return "pending"
    return approved ? "approved" : "rejected"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  // --- CUSTOMER UPLOAD LOGIC: include customerId and validation ---
  const handleUpload = async () => {
    setFormError(null);
    if (!user?.linkedId) {
      setFormError("You must be signed in as a customer to upload a prescription.");
      return;
    }
    if (!formData.imageFile) {
      setFormError("Prescription image is required.");
      return;
    }
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('customerId', String(user.linkedId));
      if (formData.imageFile) {
        formDataToSend.append('imageFile', formData.imageFile);
      }

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        setFormError(null);
        alert("Prescription submitted for review!");
        setFormData({
          imageFile: null
        })
        // Refresh customer prescriptions
        const res = await fetch(`/api/prescriptions?customerId=${user.linkedId}&page=${page}&pageSize=${pageSize}`);
        const data = await res.json();
        setCustomerPrescriptions(Array.isArray(data.data) ? data.data : []);
        setTotal(data.total || (Array.isArray(data.data) ? data.data.length : 0));
      }
    } catch {
      setFormError("Failed to submit prescription");
    }
  }
  // --- END CUSTOMER UPLOAD LOGIC ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setFormError("Only image files are allowed!");
        e.target.value = "";
        return;
      }
      setFormData({ ...formData, imageFile: file });
    }
  }

  const handleUpdateStatus = async (prescriptionId: number, approved: boolean) => {
    try {
      await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      fetchPrescriptions();
    } catch (error) {
      console.error('Failed to update prescription:', error);
    }
  };

  // --- Log-in/log-out logic ---
  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading prescriptions...</div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full flex justify-end p-4 border-b bg-white">
        <div className="flex justify-center items-center h-96 w-full">
          <div className="text-xl">Please sign in to access this page.</div>
        </div>
        <Footer />
      </div>
    );
  }
  // --- End log-in/log-out logic ---

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Upload Prescription</h1>

        {/* Only show Customer view for customers */}
        {user.role === "customer" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit Prescription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Display customer info */}
                {customerInfo && (
                  <div className="mb-4 p-3 rounded bg-gray-50 border">
                    <div className="font-semibold mb-1">Account Information</div>
                    <div>Name: {customerInfo.name || "N/A"}</div>
                    <div>Email: {customerInfo.email || "N/A"}</div>
                    <div>Address: {customerInfo.address || "N/A"}</div>
                    <div>Phone: {customerInfo.phoneNumber || "N/A"}</div>
                  </div>
                )}
=======
                <div>
                  <Label htmlFor="image">Prescription Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                {formError && <div className="text-red-500">{formError}</div>}
                <Button onClick={handleUpload} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  <UploadCloud className="w-4 h-4 mr-2" /> Submit Prescription
                </Button>
              </CardContent>
            </Card>
            {/* Customer Prescription History */}
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Your Prescriptions</h2>
              {isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">Loading...</CardContent>
                </Card>
              ) : customerPrescriptions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">No prescriptions found.</CardContent>
                </Card>
              ) : (
                <>
                  {customerPrescriptions.map((prescription) => {
                    const status = getStatus(prescription.approved)
                    return (
                      <Card key={prescription.prescriptionId} className="border rounded-lg mb-4">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(status)}
                                <Badge className={getStatusColor(status)}>
                                  {status.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                Prescription #{prescription.prescriptionId}
                              </div>
                              <div className="text-xs text-gray-400">
                                {prescription.patientName && <>Patient: {prescription.patientName}</>}
                                {prescription.patientPhoneNumber && <> | Phone: {prescription.patientPhoneNumber}</>}
                              </div>
                              <div className="text-xs text-gray-400">
                                Upload Date: {prescription.uploadDate ? new Date(prescription.uploadDate).toLocaleDateString() : ""}
                              </div>
                              {/* Show customer info for each prescription */}
                              {prescription.customerInfo && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Uploaded By: {prescription.customerInfo.name || "N/A"}
                                  {prescription.customerInfo.email && <> | {prescription.customerInfo.email}</>}
                                  {prescription.customerInfo.address && <> | {prescription.customerInfo.address}</>}
                                  {prescription.customerInfo.phoneNumber && <> | {prescription.customerInfo.phoneNumber}</>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mb-2">
                            {prescription.imageFile && (
                              <span className="text-sm">
                                <strong>Image:</strong>{" "}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-blue-500 hover:underline p-0 h-auto"
                                  onClick={() => setSelectedPrescription(prescription)}
                                >
                                  View Prescription
                                </Button>
                              </span>
                            )}
                          </div>
                          {status === "approved" && (
                            <div className="mt-4 p-3 rounded bg-green-50 text-green-800 text-sm">
                              Your prescription has been approved. You can now order the medications.
                            </div>
                          )}
                          {status === "rejected" && (
                            <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm">
                              Your prescription has been rejected. Please contact us for more information.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                  {/* Pagination controls */}
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {Math.ceil(total / pageSize) || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                      disabled={page * pageSize >= total}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Only show Staff view for pharmacists */}
        {user.role === "pharmacist" && (
          <div className="space-y-6">
            {/* --- Staff View Content --- */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-8 items-center">
                  {/* Status Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Status:</div>
                    <div className="flex gap-3 flex-wrap">
                      {["pending", "approved", "rejected"].map(status => (
                        <label key={status} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={e => {
                              setSelectedStatuses(prev =>
                                e.target.checked
                                  ? [...prev, status]
                                  : prev.filter(s => s !== status)
                              );
                            }}
                          />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Prescription ID Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Prescription ID:</div>
                    <Input
                      type="text"
                      placeholder="Enter prescription ID"
                      value={prescriptionIdFilter}
                      onChange={e => setPrescriptionIdFilter(e.target.value)}
                    />
                  </div>
                  {/* Customer ID Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Customer ID:</div>
                    <Input
                      type="text"
                      placeholder="Enter customer ID"
                      value={customerIdFilter}
                      onChange={e => setCustomerIdFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* --- End Filter Section --- */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold">
                        {statusCounts.pending}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold">
                        {statusCounts.approved}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold">
                        {statusCounts.rejected}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">All Prescriptions</h2>
              {isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">Loading...</CardContent>
                </Card>
              ) : pharmacistPrescriptions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">No prescriptions found.</CardContent>
                </Card>
              ) : (
                pharmacistPrescriptions.map((prescription, idx) => {
                  const status = getStatus(prescription.approved)
                  return (
                    <Card key={`${prescription.prescriptionId}-${prescription.patientPhoneNumber || ''}-${prescription.uploadDate}-${idx}`} className="border rounded-lg mb-4">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(status)}
                              <Badge className={getStatusColor(status)}>
                                {status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              Prescription #{prescription.prescriptionId}
                              {prescription.orderId && <> | Order ID: {prescription.orderId}</>}
                              {prescription.customerId && <> | Customer ID: {prescription.customerId}</>}
                            </div>
                            <div className="text-xs text-gray-400">
                              {prescription.patientName && <>Patient: {prescription.patientName}</>}
                              {prescription.patientPhoneNumber && <> | Phone: {prescription.patientPhoneNumber}</>}
                            </div>
                            <div className="text-xs text-gray-400">
                              Uploaded: {prescription.uploadDate ? new Date(prescription.uploadDate).toLocaleDateString() : ""}
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          {prescription.imageFile && (
                            <span className="text-sm">
                              <strong>Image:</strong>{" "}
                              <Button
                                variant="link"
                                size="sm"
                                className="text-blue-500 hover:underline p-0 h-auto"
                                onClick={() => setSelectedPrescription(prescription)}
                              >
                                View Prescription
                              </Button>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleUpdateStatus(prescription.prescriptionId, true)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleUpdateStatus(prescription.prescriptionId, false)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                            onClick={() => setSelectedPrescription(prescription)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} of {Math.ceil(total / pageSize) || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                disabled={page * pageSize >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Prescription Details Modal */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg min-w-[300px] max-w-lg relative">
              {/* X button to close modal */}
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setSelectedPrescription(null)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-2">Prescription Details</h2>
              <p><strong>ID:</strong> {selectedPrescription.prescriptionId}</p>
              <p>
                <strong>Customer ID:</strong> {selectedPrescription.customerId ?? "N/A"}
              </p>
              {/* Show customer info in modal */}
              {selectedPrescription.customerInfo && (
                <div className="mb-2 text-xs text-gray-600">
                  <strong>Name:</strong> {selectedPrescription.customerInfo.name || "N/A"}
                  {selectedPrescription.customerInfo.dateOfBirth && (
                    <> | <strong>DOB:</strong> {new Date(selectedPrescription.customerInfo.dateOfBirth).toLocaleDateString()}</>
                  )}
                  {selectedPrescription.customerInfo.email && (
                    <> | <strong>Email:</strong> {selectedPrescription.customerInfo.email}</>
                  )}
                  {selectedPrescription.customerInfo.address && (
                    <> | <strong>Address:</strong> {selectedPrescription.customerInfo.address}</>
                  )}
                  {selectedPrescription.customerInfo.phoneNumber && (
                    <> | <strong>Phone:</strong> {selectedPrescription.customerInfo.phoneNumber}</>
                  )}
                </div>
              )}
              <p>
                <strong>Upload Date:</strong>{" "}
                {selectedPrescription.uploadDate
                  ? new Date(selectedPrescription.uploadDate).toLocaleDateString()
                  : ""}
              </p>
              <p><strong>Status:</strong> {getStatus(selectedPrescription.approved)}</p>
              <div className="mt-4">
                <strong>Image:</strong>
                {selectedPrescription.imageFile &&
                  (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(selectedPrescription.imageFile) ? (
                    <img
                      src={`/uploads/${selectedPrescription.imageFile}`}
                      alt="Prescription"
                      className="mt-2 max-w-full max-h-80 border rounded"
                    />
                  ) : (
                    <a
                      href={selectedPrescription.imageFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Download/View File
                    </a>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}