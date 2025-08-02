'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface UploadResult {
  success: boolean;
  summary: {
    totalRows: number;
    created: number;
    skippedExisting: number;
    validationErrors: number;
  };
  details: {
    createdContacts: { name: string; email: string }[];
    skippedEmails: string[];
    validationErrors: string[];
  };
}

interface CSVUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onClose?: () => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onUploadComplete, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-white">Upload Contacts</h3>
            <p className="text-sm text-gray-400">Import contacts from a CSV file</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* File Selection */}
        {!selectedFile && !uploadResult && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-white font-medium mb-2">Drop your CSV file here</h4>
            <p className="text-gray-400 text-sm mb-4">
              or click to browse your files
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* File Selected */}
        {selectedFile && !uploadResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
              <FileText className="h-6 w-6 text-blue-400" />
              <div className="flex-1">
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors font-medium"
              >
                {isUploading ? 'Uploading...' : 'Upload Contacts'}
              </button>
              <button
                onClick={resetUpload}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="h-6 w-6" />
              <h4 className="font-medium">Upload Completed!</h4>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{uploadResult.summary.created}</p>
                <p className="text-gray-400 text-sm">Contacts Added</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-yellow-400">{uploadResult.summary.skippedExisting}</p>
                <p className="text-gray-400 text-sm">Already Existed</p>
              </div>
            </div>

            {/* Validation Errors */}
            {uploadResult.summary.validationErrors > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Validation Errors ({uploadResult.summary.validationErrors})</span>
                </div>
                <div className="space-y-1">
                  {uploadResult.details.validationErrors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-red-300 text-sm">• {error}</p>
                  ))}
                  {uploadResult.details.validationErrors.length > 5 && (
                    <p className="text-red-300 text-sm">
                      • And {uploadResult.details.validationErrors.length - 5} more errors...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Created Contacts Preview */}
            {uploadResult.details.createdContacts.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h5 className="text-white font-medium mb-3">New Contacts Added</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadResult.details.createdContacts.slice(0, 10).map((contact, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-300">{contact.name}</span>
                      <span className="text-gray-400">{contact.email}</span>
                    </div>
                  ))}
                  {uploadResult.details.createdContacts.length > 10 && (
                    <p className="text-gray-400 text-sm text-center">
                      And {uploadResult.details.createdContacts.length - 10} more contacts...
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetUpload}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Upload Another File
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Upload Failed</span>
            </div>
            <p className="text-red-300 text-sm mt-2">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* CSV Format Info */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <h5 className="text-white font-medium mb-2">CSV Format Requirements</h5>
          <div className="text-gray-400 text-sm space-y-1">
            <p>• Required: Email column (email, email_address, or mail)</p>
            <p>• Optional: Name, Company, Position/Title columns</p>
            <p>• Headers can be: first_name, last_name, company, job_title, etc.</p>
            <p>• Maximum file size: 5MB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUpload; 