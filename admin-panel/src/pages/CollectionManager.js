import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Upload, Trash2, Image } from 'lucide-react';
import api from '../services/api';

function CollectionManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collectionData, setCollectionData] = useState({
    title: 'Our Collections',
    subtitle: 'Explore our curated selection of premium products',
    imageUrl: null
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCollectionSettings();
  }, []);

  const fetchCollectionSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/collection');
      setCollectionData(response.data);

      // Set preview for existing image
      if (response.data.imageUrl) {
        const imageUrl = response.data.imageUrl.startsWith('http')
          ? response.data.imageUrl
          : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}${response.data.imageUrl}`;
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error('Error fetching collection settings:', error);
      toast.error('Failed to load collection settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCollectionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const formData = new FormData();
      formData.append('title', collectionData.title);
      formData.append('subtitle', collectionData.subtitle);
      formData.append('imageUrl', 'null');

      await api.post('/settings/collection', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Image removed successfully');
      setImageFile(null);
      setImagePreview(null);
      setCollectionData(prev => ({ ...prev, imageUrl: null }));
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const formData = new FormData();

      // Append text fields
      formData.append('title', collectionData.title);
      formData.append('subtitle', collectionData.subtitle);

      // Append image if new file selected
      if (imageFile) {
        formData.append('collection', imageFile);
      }

      await api.post('/settings/collection', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Collection settings updated successfully!');
      fetchCollectionSettings();
      setImageFile(null);
    } catch (error) {
      console.error('Error updating collection settings:', error);
      toast.error(error.response?.data?.error || 'Failed to update collection settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Collection Section Manager</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage the "Our Collections" section header image and text on the storefront
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Header Image Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Header Image</h2>
          <p className="text-sm text-gray-600 mb-4">Upload a banner image for the collections section (optional)</p>

          {/* Current Image Preview */}
          {imagePreview && (
            <div className="mb-6 relative">
              <img
                src={imagePreview}
                alt="Collection preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </button>
            </div>
          )}

          {/* Upload Area */}
          {!imagePreview && (
            <div className="mb-4 w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <Image className="h-12 w-12 text-gray-400" />
            </div>
          )}

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or WebP (Recommended: 1200x300)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={saving}
              />
            </label>
          </div>
        </div>

        {/* Text Content Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Text Content</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={collectionData.title}
                onChange={handleInputChange}
                placeholder="Our Collections"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle *
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={collectionData.subtitle}
                onChange={handleInputChange}
                placeholder="Explore our curated selection of premium products"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={fetchCollectionSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CollectionManager;
