"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Truck, MapPin, Clock, User, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "@/components/footer";

interface Delivery {
  id: number;
  orderId: number;
  customerName: string;
  customerAddress: string;
  status: string;
  orderDate: string;
  totalAmount: number | string;
  prescriptionId?: number;
  customerId: number;
}

export default function DeliveryPage() {
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState("");
  const [trackError, setTrackError] = useState<string | null>(null);
  const [customerDeliveries, setCustomerDeliveries] = useState<Delivery[]>([]);
  const [staffDeliveries, setStaffDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state for customer deliveries
  const [customerPage, setCustomerPage] = useState(1);
  const deliveriesPerPage = 10;

  // Pagination state for staff deliveries (backend-driven)
  const [staffPage, setStaffPage] = useState(1);
  const staffDeliveriesPerPage = 10;
  const [totalStaff, setTotalStaff] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, delivered: 0 });

  // Filter state for staff
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchCustomerId, setSearchCustomerId] = useState("");
  const [debouncedOrderId, setDebouncedOrderId] = useState("");
  const [debouncedCustomerId, setDebouncedCustomerId] = useState("");

  const router = useRouter();

  // Debounce for Order ID
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedOrderId(searchOrderId), 400);
    return () => clearTimeout(handler);
  }, [searchOrderId]);

  // Debounce for Customer ID
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedCustomerId(searchCustomerId), 400);
    return () => clearTimeout(handler);
  }, [searchCustomerId]);

  // Fetch customer deliveries on mount and when customerPage changes
  useEffect(() => {
    if (user?.role === "customer") {
      fetchCustomerDeliveries();
    }
    // eslint-disable-next-line
  }, [customerPage, deliveriesPerPage, user?.role]);

  // Fetch staff deliveries on mount and when filters/page change (for pharmacist)
  useEffect(() => {
    if (user?.role === "pharmacist") {
      fetchAllDeliveries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffPage, staffDeliveriesPerPage, selectedStatuses, debouncedOrderId, debouncedCustomerId, user?.role]);

  // Real-time polling for staff deliveries
  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const interval = setInterval(() => {
      fetchAllDeliveries();
    }, 30000);
    return () => clearInterval(interval);
  }, [staffPage, staffDeliveriesPerPage, selectedStatuses, debouncedOrderId, debouncedCustomerId, user?.role]);

  // Fetch only this customer's deliveries (orders)
  const fetchCustomerDeliveries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders?customerId=${user?.customerId}`);
      const data = await response.json();
      setCustomerDeliveries(
        (data.orders || [])
          .filter((order: unknown) => (order as { customerId: number }).customerId === user?.customerId)
          .map((order: unknown) => {
            const orderData = order as {
              orderId: number;
              customerName: string;
              customerAddress: string;
              status: string;
              orderDate: string;
              totalAmount: number | string;
              prescriptionId?: number;
              customerId: number;
            };
            return {
              id: orderData.orderId,
              orderId: orderData.orderId,
              customerName: orderData.customerName,
              customerAddress: orderData.customerAddress || "",
              status: orderData.status,
              orderDate: orderData.orderDate,
              totalAmount: orderData.totalAmount,
              prescriptionId: orderData.prescriptionId,
              customerId: orderData.customerId,
            };
          })
      );
    } catch (error) {
      console.error('Error fetching customer deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all deliveries (orders) for staff with filters and pagination
  const fetchAllDeliveries = async () => {
    setLoading(true);
    const statusParams = selectedStatuses.map(s => `status=${encodeURIComponent(s)}`).join('&');
    const orderIdParam = debouncedOrderId ? `&orderId=${encodeURIComponent(debouncedOrderId)}` : '';
    const customerIdParam = debouncedCustomerId ? `&customerId=${encodeURIComponent(debouncedCustomerId)}` : '';
    const query = [`page=${staffPage}`, `pageSize=${staffDeliveriesPerPage}`, statusParams, orderIdParam, customerIdParam]
      .filter(Boolean)
      .join('&');
    try {
      const response = await fetch(`/api/deliveries?${query}`);
      const data = await response.json();
      setStaffDeliveries(
        (data.orders || []).map((order: unknown) => {
          const orderData = order as {
            orderId: number;
            customerName: string;
            customerAddress: string;
            status: string;
            orderDate: string;
            totalAmount: number | string;
            prescriptionId?: number;
            customerId: number;
          };
          return {
            id: orderData.orderId,
            orderId: orderData.orderId,
            customerName: orderData.customerName,
            customerAddress: orderData.customerAddress || "",
            status: orderData.status,
            orderDate: orderData.orderDate,
            totalAmount: orderData.totalAmount,
            prescriptionId: orderData.prescriptionId,
            customerId: orderData.customerId,
          };
        })
      );
      setTotalStaff(data.total || 0);
      setStatusCounts(data.statusCounts || { pending: 0, approved: 0, delivered: 0 });
    } catch (error) {
      console.error('Error fetching all deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updateDeliveryStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (response.ok) {
        if (user?.role === "customer") {
          fetchCustomerDeliveries();
        } else {
          fetchAllDeliveries();
        }
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  // Track button with validation (cross-checks with orders table)
  const handleTrackDelivery = async () => {
    setTrackError(null);
    if (!trackingId) {
      setTrackError("Please enter an Order ID.");
      return;
    }
    if (!user?.customerId) {
      setTrackError("You must be signed in to track your order.");
      return;
    }
    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(trackingId)}&customerId=${user.customerId}`);
      if (!res.ok) {
        const data = await res.json();
        setTrackError(data.error || "Order not found. Please check your Order ID.");
        return;
      }
      const data = await res.json();
      if (!data || !data.orderId) {
        setTrackError("Order not found. Please check your Order ID.");
        return;
      }
      router.push(`/delivery/${encodeURIComponent(trackingId)}`);
    } catch {
      setTrackError("Order not found. Please check your Order ID.");
    }
  };

  // Pagination logic for customer deliveries (frontend)
  const filteredCustomerDeliveries = customerDeliveries.filter(
    (delivery) => delivery.customerId === user?.customerId
  );
  const totalCustomerPages = Math.ceil(filteredCustomerDeliveries.length / deliveriesPerPage);
  const paginatedCustomerDeliveries = filteredCustomerDeliveries.slice(
    (customerPage - 1) * deliveriesPerPage,
    customerPage * deliveriesPerPage
  );

  // Pagination logic for staff deliveries (backend-driven)
  const totalStaffPages = Math.ceil(totalStaff / staffDeliveriesPerPage);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading deliveries...</div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-96 w-full">
          <div className="text-xl">Please sign in to access this page.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Delivery Management</h1>

        {/* Pharmacist: Show staff view directly, no tabs */}
        {user.role === "pharmacist" ? (
          <div className="space-y-6">
            {/* --- Filter Section --- */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-8 items-center">
                  {/* Status Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Status:</div>
                    <div className="flex gap-3 flex-wrap">
                      {["pending", "approved", "delivered"].map(status => (
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
                  {/* Order ID Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Order ID:</div>
                    <Input
                      type="number"
                      placeholder="Enter order ID"
                      value={searchOrderId}
                      onChange={e => setSearchOrderId(e.target.value)}
                    />
                  </div>
                  {/* Customer ID Filter */}
                  <div>
                    <div className="font-semibold mb-2">Filter by Customer ID:</div>
                    <Input
                      type="number"
                      placeholder="Enter customer ID"
                      value={searchCustomerId}
                      onChange={e => setSearchCustomerId(e.target.value)}
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
                      <p className="text-sm font-medium text-gray-600">In Transit</p>
                      <p className="text-2xl font-bold">
                        {statusCounts.approved}
                      </p>
                    </div>
                    <Truck className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-2xl font-bold">
                        {statusCounts.delivered}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">All Deliveries</h2>
              {staffDeliveries.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No deliveries found</p>
                  </CardContent>
                </Card>
              ) : (
                staffDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="border rounded-lg mb-4">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {/* Status Icon */}
                            {delivery.status?.toLowerCase() === "pending" && <Clock className="w-4 h-4" />}
                            {delivery.status?.toLowerCase() === "approved" && <Truck className="w-4 h-4" />}
                            {delivery.status?.toLowerCase() === "delivered" && <CheckCircle className="w-4 h-4" />}
                            <Badge className={getStatusColor(delivery.status)}>
                              {delivery.status?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Order ID: {delivery.orderId} | Customer ID: {delivery.customerId}
                          </div>
                          <div className="text-xs text-gray-400">
                            <User className="inline w-4 h-4 mr-1" />
                            {delivery.customerName || "Guest"}
                            {" | "}
                            <MapPin className="inline w-4 h-4 mr-1" />
                            {delivery.customerAddress || "No address available"}
                          </div>
                          <div className="text-xs text-gray-400">
                            Order Date: {new Date(delivery.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="font-medium text-blue-700">
                            ${delivery.totalAmount ? Number(delivery.totalAmount).toFixed(2) : '0.00'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Submitted: {new Date(delivery.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Only show staff actions for pharmacist */}
                        {user?.role === "pharmacist" && delivery.status?.toLowerCase() === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => updateDeliveryStatus(delivery.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => updateDeliveryStatus(delivery.id, "cancelled")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {user?.role === "pharmacist" && delivery.status?.toLowerCase() === "approved" && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => updateDeliveryStatus(delivery.id, "delivered")}
                          >
                            Mark Delivered
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/delivery/${delivery.orderId}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Pagination Controls for Staff */}
              {totalStaffPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={staffPage === 1}
                    onClick={() => setStaffPage(1)}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={staffPage === 1}
                    onClick={() => setStaffPage((prev) => Math.max(1, prev - 1))}
                  >
                    &lt;
                  </Button>
                  <span className="px-2">
                    Page {staffPage} of {totalStaffPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={staffPage === totalStaffPages}
                    onClick={() => setStaffPage((prev) => Math.min(totalStaffPages, prev + 1))}
                  >
                    &gt;
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={staffPage === totalStaffPages}
                    onClick={() => setStaffPage(totalStaffPages)}
                  >
                    Last
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Customer: Show customer view directly, no tabs
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Track Your Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter tracking ID"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                  />
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={handleTrackDelivery}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Track
                  </Button>
                </div>
                {trackError && (
                  <div className="text-red-500 text-sm mt-2">{trackError}</div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <h2 className="text-xl font-semibold">Your Deliveries</h2>
              {paginatedCustomerDeliveries.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No deliveries found</p>
                  </CardContent>
                </Card>
              ) : (
                paginatedCustomerDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="border rounded-lg mb-4">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {/* Status Icon */}
                            {delivery.status?.toLowerCase() === "pending" && <Clock className="w-4 h-4" />}
                            {delivery.status?.toLowerCase() === "approved" && <Truck className="w-4 h-4" />}
                            {delivery.status?.toLowerCase() === "delivered" && <CheckCircle className="w-4 h-4" />}
                            <Badge className={getStatusColor(delivery.status)}>
                              {delivery.status?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Order ID: {delivery.orderId}
                          </div>
                          <div className="text-xs text-gray-400">
                            <MapPin className="inline w-4 h-4 mr-1" />
                            {delivery.customerAddress || "No address available"}
                          </div>
                          <div className="text-xs text-gray-400">
                            Order Date: {new Date(delivery.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="font-medium text-blue-700">
                            ${delivery.totalAmount ? Number(delivery.totalAmount).toFixed(2) : '0.00'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Submitted: {new Date(delivery.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/delivery/${delivery.orderId}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Pagination Controls */}
              {totalCustomerPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={customerPage === 1}
                    onClick={() => setCustomerPage(1)}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={customerPage === 1}
                    onClick={() => setCustomerPage((prev) => Math.max(1, prev - 1))}
                  >
                    &lt;
                  </Button>
                  <span className="px-2">
                    Page {customerPage} of {totalCustomerPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={customerPage === totalCustomerPages}
                    onClick={() => setCustomerPage((prev) => Math.min(totalCustomerPages, prev + 1))}
                  >
                    &gt;
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={customerPage === totalCustomerPages}
                    onClick={() => setCustomerPage(totalCustomerPages)}
                  >
                    Last
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
