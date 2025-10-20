import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Package, Truck, Check, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const Orders = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, error } = useQuery(
    ['orders', { page: currentPage, status: statusFilter }],
    () => api.orders.getAll({
      page: currentPage,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
    {
      onSuccess: (data) => {
        console.log('Orders fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching orders:', error);
        console.error('Error details:', error.response?.data);
        toast.error('Failed to load orders');
      }
    }
  );

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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.orders.updateStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      // Refetch orders
      queryClient.invalidateQueries(['orders']);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const deleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.orders.delete(orderId);
      toast.success('Order deleted successfully');
      // Refetch orders
      queryClient.invalidateQueries(['orders']);
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Orders</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error?.message || 'Failed to load orders'}</p>
                <p className="mt-2">Please check the console for more details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all customer orders here
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mt-4 flex space-x-2">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              statusFilter === status
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Update Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data?.data?.orders?.length > 0 ? (
                    data.data.orders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {order.orderNumber || `#${order._id.slice(-6)}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {order.customer?.name || 'N/A'}<br />
                          <span className="text-xs">{order.customer?.email || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          ${(order.total || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
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
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteOrder(order._id, order.orderNumber)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete order"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="font-medium">No orders found</p>
                        <p className="mt-1">Orders will appear here once customers place them.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;