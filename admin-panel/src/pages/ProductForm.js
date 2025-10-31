import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { X, Trash2 } from 'lucide-react';
import { getImageUrl } from '../config';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    category: '',
    sku: '',
    isActive: true,
    isFeatured: false,
  });

  const [stock, setStock] = useState([]); // Initialize as empty array for stock quantities

  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [tags, setTags] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const { data: categoriesData } = useQuery('categories', api.categories.getAll);
  const { data: productData } = useQuery(
    ['product', id],
    () => api.products.getById(id),
    { enabled: isEdit }
  );

  const createMutation = useMutation(api.products.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product created successfully');
      navigate('/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create product');
    },
  });

  const deleteImageMutation = useMutation(
    ({ productId, imageIndex }) => api.products.removeImage(productId, imageIndex),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product', id]);
        toast.success('Image removed successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to remove image');
      },
    }
  );

  const handleImageDelete = (imageIndex) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      deleteImageMutation.mutate({ productId: id, imageIndex });
    }
  };

  const updateMutation = useMutation(
    (data) => api.products.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        toast.success('Product updated successfully');
        navigate('/products');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update product');
      },
    }
  );

  const categories = categoriesData?.data?.categories || [];

  useEffect(() => {
    if (productData?.data?.product) {
      const product = productData.data.product;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        category: product.category?._id || '',
        sku: product.sku || '',
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
      });
      setColors(product.colors || []);
      setSizes(product.sizes || []);
      // Ensure stock is always an array
      setStock(Array.isArray(product.stock) ? product.stock : []);
      setTags(product.tags || []);
      setExistingImages(product.images || []);
    }
  }, [productData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out any stock entries with zero quantity
    const filteredStock = stock.filter(item => item.quantity > 0);

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      stock: JSON.stringify(filteredStock),  // Convert stock array to JSON string
      colors: JSON.stringify(colors.length > 0 ? colors : []),  // Convert colors array to JSON string
      sizes: JSON.stringify(sizes.length > 0 ? sizes : []),  // Convert sizes array to JSON string
      tags: JSON.stringify(tags.length > 0 ? tags : []),  // Convert tags array to JSON string
      images: imageFiles,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addColor = () => {
    setColors(prev => [...prev, { name: '', code: '#000000', available: true }]);
  };

  const updateColor = (index, field, value) => {
    setColors(prev => prev.map((color, i) =>
      i === index ? { ...color, [field]: value } : color
    ));
  };

  const removeColor = (index) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const addSize = () => {
    setSizes(prev => [...prev, { name: '', available: true }]);
  };

  const updateSize = (index, field, value) => {
    setSizes(prev => prev.map((size, i) =>
      i === index ? { ...size, [field]: value } : size
    ));
  };

  const removeSize = (index) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tagInput = prompt('Enter tag name:');
    if (tagInput && tagInput.trim()) {
      setTags(prev => [...prev, tagInput.trim()]);
    }
  };

  const removeTag = (index) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Create Product'}
        </h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
              Short Description
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              maxLength="200"
              value={formData.shortDescription}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">
                Original Price
              </label>
              <input
                type="number"
                id="originalPrice"
                name="originalPrice"
                min="0"
                step="0.01"
                value={formData.originalPrice}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>



            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {existingImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={getImageUrl(`/uploads/products/${image.data ? 'product-' + Math.random().toString().slice(2) + '.png' : image}`)}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageDelete(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Colors</label>
              <button
                type="button"
                onClick={addColor}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add Color
              </button>
            </div>
            <div className="space-y-2">
              {colors.map((color, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Color name"
                    value={color.name}
                    onChange={(e) => updateColor(index, 'name', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="color"
                    value={color.code}
                    onChange={(e) => updateColor(index, 'code', e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="text-red-600 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Sizes</label>
              <button
                type="button"
                onClick={addSize}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add Size
              </button>
            </div>
            <div className="space-y-2">
              {sizes.map((size, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Size name (e.g., S, M, L, XL)"
                    value={size.name}
                    onChange={(e) => updateSize(index, 'name', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="text-red-600 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Management Table */}
          {colors.length > 0 && sizes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Stock Management
              </label>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {colors.map(color =>
                      sizes.map(size => {
                        const stockItem = (Array.isArray(stock) ? stock : []).find(
                          item => item?.color === color.name && item?.size === size.name
                        ) || { quantity: 0 };
                        
                        return (
                          <tr key={`${color.name}-${size.name}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded-full mr-2"
                                  style={{ backgroundColor: color.code }}
                                />
                                {color.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {size.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                min="0"
                                value={stockItem.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setStock(prevStock => {
                                    // Ensure prevStock is an array
                                    const currentStock = Array.isArray(prevStock) ? prevStock : [];
                                    // Remove existing entry for this color/size if it exists
                                    const filtered = currentStock.filter(
                                      item => !(item.color === color.name && item.size === size.name)
                                    );
                                    // Add new entry with updated quantity
                                    return [
                                      ...filtered,
                                      {
                                        color: color.name,
                                        size: size.name,
                                        quantity: value
                                      }
                                    ];
                                  });
                                }}
                                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <button
                type="button"
                onClick={addTag}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Add Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
                Featured
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;