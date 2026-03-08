import React, { useState, useRef } from 'react';
import { Upload, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function FileUpload({
  onUpload,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt',
  maxSizeMB = 10,
  className = '',
  children
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setError(null);
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview({ url, type: 'image', name: file.name });
    } else {
      setPreview({ url: '', type: 'file', name: file.name });
    }

    setUploading(true);
    try {
      await onUpload(file);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearPreview = () => {
    if (preview?.url && preview.type === 'image') {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={accept}
        className="hidden"
      />
      
      {children ? (
        <div onClick={() => !uploading && fileInputRef.current?.click()}>
          {children}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-indigo-400' : 'text-zinc-500'}`} />
          <p className="text-sm text-zinc-400 text-center">
            <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-zinc-500 mt-1">Max size: {maxSizeMB}MB</p>
        </div>
      )}

      {/* Preview & Progress */}
      {(preview || uploading || error) && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 overflow-hidden z-50">
          {preview && (
            <div className="p-3 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); clearPreview(); }}
                className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/80 text-white z-10"
                disabled={uploading}
              >
                <X size={14} />
              </button>
              
              {preview.type === 'image' ? (
                <div className="h-32 w-full bg-zinc-900 rounded flex items-center justify-center overflow-hidden">
                  <img src={preview.url} alt="Preview" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 w-full bg-zinc-900 rounded flex items-center justify-center gap-2">
                  <FileIcon size={24} className="text-indigo-400" />
                  <span className="text-xs text-zinc-300 truncate max-w-[150px]">{preview.name}</span>
                </div>
              )}
            </div>
          )}
          
          {uploading && (
            <div className="px-3 pb-3">
              <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-full animate-pulse rounded-full" />
              </div>
              <p className="text-xs text-center text-zinc-400 mt-2">Uploading...</p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-500/10 border-t border-red-500/20">
              <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
