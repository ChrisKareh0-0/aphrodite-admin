import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

const Categories = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery('categories', api.categories.getAll);

  const deleteMutation = useMutation(api.categories.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    },
  });

  const toggleStatusMutation = useMutation(api.categories.toggleStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
      toast.success('Category status updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const categories = data?.data?.categories || [];

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link
          to="/categories/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {categories.length === 0 ? (
          <div className="p-6 text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new category.
            </p>
            <div className="mt-6">
              <Link
                to="/categories/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li key={category._id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {category.image ? (
                      <img
                        className="h-10 w-10 rounded object-cover"
                        src={category.image}
                        alt={category.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">{category.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(category._id)}
                      className="text-gray-400 hover:text-gray-500"
                      title={category.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {category.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>

                    <Link
                      to={`/categories/${category._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                      disabled={deleteMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Categories;