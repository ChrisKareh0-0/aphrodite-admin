import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Play,
  Copy,
  Check,
  AlertCircle,
  Code,
  Zap,
  BookOpen,
  Globe,
  ArrowRight
} from 'lucide-react';

const ApiTest = () => {
  const { user } = useAuth();
  const [apiDocs, setApiDocs] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Test form state
  const [testForm, setTestForm] = useState({
    method: 'GET',
    url: '/api/health',
    headers: {},
    body: {}
  });

  useEffect(() => {
    fetchApiDocs();
  }, []);

  const fetchApiDocs = async () => {
    try {
      setDocsLoading(true);
      const response = await api.get('/test/docs');
      setApiDocs(response.data.data);
    } catch (err) {
      console.error('Failed to fetch API docs:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const runApiTest = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      const response = await api.post('/test/test', {
        method: testForm.method,
        url: testForm.url,
        headers: testForm.headers,
        body: testForm.body
      });

      setTestResult(response.data);
    } catch (err) {
      setTestResult({
        success: false,
        data: {
          error: {
            message: err.response?.data?.message || err.message,
            status: err.response?.status || 500
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateTestForm = (field, value) => {
    setTestForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addHeader = () => {
    setTestForm(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        '': ''
      }
    }));
  };

  const updateHeader = (key, value, oldKey = null) => {
    setTestForm(prev => {
      const newHeaders = { ...prev.headers };
      if (oldKey && oldKey !== key) {
        delete newHeaders[oldKey];
      }
      if (value) {
        newHeaders[key] = value;
      } else {
        delete newHeaders[key];
      }
      return { ...prev, headers: newHeaders };
    });
  };

  const quickTests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: '/api/health',
      description: 'Check if the API is running'
    },
    {
      name: 'Get Products',
      method: 'GET',
      url: '/api/public/products',
      description: 'Fetch all public products'
    },
    {
      name: 'Get Categories',
      method: 'GET',
      url: '/api/public/categories',
      description: 'Fetch all categories'
    },
    {
      name: 'Dashboard Stats',
      method: 'GET',
      url: '/api/dashboard/stats',
      description: 'Get dashboard statistics (requires auth)',
      requiresAuth: true
    }
  ];

  if (docsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Testing & Documentation</h1>
        <p className="text-gray-600">Test and explore the Aphrodite Store API endpoints</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Tester */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              API Tester
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Method and URL */}
            <div className="grid grid-cols-4 gap-2">
              <select
                value={testForm.method}
                onChange={(e) => updateTestForm('method', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={testForm.url}
                onChange={(e) => updateTestForm('url', e.target.value)}
                placeholder="/api/endpoint"
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Headers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headers
              </label>
              <div className="space-y-2">
                {Object.entries(testForm.headers).map(([key, value], index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => updateHeader(e.target.value, value, key)}
                      placeholder="Header name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateHeader(key, e.target.value)}
                      placeholder="Header value"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                ))}
                <button
                  onClick={addHeader}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + Add Header
                </button>
              </div>
            </div>

            {/* Body */}
            {['POST', 'PUT', 'PATCH'].includes(testForm.method) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Body (JSON)
                </label>
                <textarea
                  value={JSON.stringify(testForm.body, null, 2)}
                  onChange={(e) => {
                    try {
                      updateTestForm('body', JSON.parse(e.target.value));
                    } catch (err) {
                      // Invalid JSON, keep the text for editing
                    }
                  }}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            {/* Run Test Button */}
            <button
              onClick={runApiTest}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Testing...' : 'Run Test'}
            </button>
          </div>
        </div>

        {/* Quick Tests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Quick Tests
            </h2>
          </div>
          <div className="p-6 space-y-3">
            {quickTests.map((test, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{test.name}</h4>
                  <button
                    onClick={() => {
                      updateTestForm('method', test.method);
                      updateTestForm('url', test.url);
                    }}
                    className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                  >
                    Use <ArrowRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    test.method === 'GET' ? 'bg-green-100 text-green-800' :
                    test.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    test.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {test.method}
                  </span>
                  <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {test.url}
                  </code>
                  {test.requiresAuth && (
                    <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                      Auth Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Test Results
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                testResult.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResult.success ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Success
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Error
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Request */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Request</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-2">
                    <span className="font-mono text-sm">
                      {testResult.data?.request?.method} {testResult.data?.request?.url}
                    </span>
                  </div>
                  {testResult.data?.request?.headers && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Headers:</span>
                      <pre className="text-xs text-gray-600 mt-1">
                        {JSON.stringify(testResult.data.request.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResult.data?.request?.body && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Body:</span>
                      <pre className="text-xs text-gray-600 mt-1">
                        {JSON.stringify(testResult.data.request.body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Response */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Response</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {testResult.data?.response ? (
                    <>
                      <div className="mb-2">
                        <span className="font-mono text-sm">
                          {testResult.data.response.status} {testResult.data.response.statusText}
                        </span>
                      </div>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(testResult.data.response.data, null, 2)}
                      </pre>
                    </>
                  ) : (
                    <div className="text-red-600">
                      <pre className="text-xs">
                        {JSON.stringify(testResult.data?.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTest;