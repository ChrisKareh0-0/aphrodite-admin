import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();
  const { data: ordersData = { orders: [], pagination: {} }, isLoading, isError } = useQuery(
    ['orders', currentPage, pageSize],
    async () => {
      console.log('Fetching orders with page:', currentPage, 'limit:', pageSize);
      const res = await api.orders.getAll({ page: currentPage, limit: pageSize });
      console.log('Orders API Response:', res.data);

      // The API response is directly in res.data (no extra wrapper)
      const responseData = res.data || {};
      const orders = responseData.orders || [];
      const pagination = responseData.pagination || {};

      console.log('Parsed orders:', orders.length, 'Pagination:', pagination);

      return {
        orders,
        pagination
      };
    }
  );

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {};

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.orders.updateStatus(orderId, status);
      toast.success('Order status updated');
      queryClient.invalidateQueries('orders');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Delete order ${orderNumber || orderId}?`)) return;
    try {
      await api.orders.delete(orderId);
      toast.success('Order deleted');
      queryClient.invalidateQueries('orders');
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading orders...</div>;
  }
  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load orders.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <details>
            <summary>Debug: Pagination Data</summary>
            <pre>{JSON.stringify({ orders: orders.length, pagination }, null, 2)}</pre>
          </details>
        </div>
      )}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">
                    {order.orderNumber || `#${order._id?.slice(-6)}`}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.customer?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy, h:mm a') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    ${order.total?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500" onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => deleteOrder(order._id, order.orderNumber)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete order"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 font-bold bg-blue-600 text-white border border-blue-800 rounded shadow hover:bg-blue-700 transition-colors"
                      style={{ minWidth: 90 }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="font-medium">No orders found</p>
                  <p className="mt-1">Orders will appear here once customers place them.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {(pagination.totalPages || pagination.total > pageSize) && (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-700">
                <strong>
                  Page {pagination.page || 1} of {pagination.totalPages || 1}
                </strong>
                {pagination.total && ` (${pagination.total} total orders)`}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 text-sm"
                >
                  ← Previous
                </button>

                {pagination.totalPages && pagination.totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                      const page = pagination.page ? pagination.page - 2 + i : i + 1;
                      return page > 0 && page <= pagination.totalPages ? page : null;
                    }).filter(Boolean).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded text-sm ${
                          page === pagination.page
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages || prev, prev + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 text-sm"
                >
                  Next →
                </button>
              </div>

              <div className="text-sm">
                <label className="text-gray-700 mr-2">Items per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setSelectedOrder(null)}
              title="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="mb-2"><b>Order Number:</b> {selectedOrder.orderNumber || `#${selectedOrder._id?.slice(-6)}`}</div>
            <div className="mb-2"><b>Status:</b> {selectedOrder.status}</div>
            <div className="mb-2"><b>Date:</b> {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), 'MMM d, yyyy, h:mm a') : 'N/A'}</div>
            <div className="mb-2"><b>Customer:</b> {selectedOrder.customer?.name} ({selectedOrder.customer?.email})</div>
            <div className="mb-2"><b>Phone:</b> {selectedOrder.customer?.phone}</div>
            <div className="mb-2"><b>Address:</b> {selectedOrder.customer?.address?.street}, {selectedOrder.customer?.address?.city}, {selectedOrder.customer?.address?.state}, {selectedOrder.customer?.address?.zipCode}, {selectedOrder.customer?.address?.country}</div>
            <div className="mb-2"><b>Total:</b> ${selectedOrder.total?.toFixed(2) || '0.00'}</div>
            <div className="mb-2"><b>Payment Method:</b> {selectedOrder.paymentMethod}</div>
            <div className="mb-2"><b>Notes:</b> {selectedOrder.notes || 'None'}</div>
            <div className="mt-4">
              <b>Items:</b>
              <ul className="list-disc pl-5 mt-2">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx} className="mb-1">
                    {item.name} x{item.quantity} - ${item.price?.toFixed(2) || '0.00'}
                    {item.color && <span> | Color: {item.color}</span>}
                    {item.size && <span> | Size: {item.size}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
