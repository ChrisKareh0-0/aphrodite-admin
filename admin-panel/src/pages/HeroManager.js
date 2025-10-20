import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Upload, Trash2, Image } from 'lucide-react';
import { api } from '../services/api';

const HeroManager = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: heroData, isLoading } = useQuery('hero', () => api.settings.getHero());

  const uploadMutation = useMutation(
    (formData) => api.settings.updateHero(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hero');
        setSelectedFile(null);
      },
    }
  );

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const formData = new FormData();
      formData.append('hero', file);
      uploadMutation.mutate(formData);
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-semibold text-gray-900">Hero Image</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage the hero image shown on the storefront homepage
          </p>
        </div>
      </div>

      <div className="mt-8">
        {/* Current Hero Image */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Hero Image</h3>
          <div className="relative">
            {heroData?.imageUrl ? (
              <div className="relative">
                <img
                  src={heroData.imageUrl}
                  alt="Hero"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={() => uploadMutation.mutate({ imageUrl: null })}
                  className="absolute top-2 right-2 p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Image className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Upload New Image */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Image</h3>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or WebP (Recommended: 1920x1080)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadMutation.isLoading}
              />
            </label>
          </div>
          {uploadMutation.isLoading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Uploading image...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroManager;