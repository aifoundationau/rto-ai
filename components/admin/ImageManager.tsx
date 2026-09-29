import React, { useState } from 'react';
import { Folder, Image as ImageIcon, Upload, FileImage, FolderOpen } from 'lucide-react';

const FOLDERS = ['courses', 'dynamicstore', 'events', 'faqs', 'announcements', 'units', 'general'];

interface UploadedImage {
  name: string;
  url: string;
  folder: string;
  date: string;
}

export const ImageManager: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<string>('courses');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadDescription.trim()) return;

    setIsUploading(true);

    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // e.g., 20260929
      const fileExt = selectedFile.name.split('.').pop() || 'jpeg';
      
      // Clean up description (remove spaces and special chars)
      const cleanDesc = uploadDescription.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const newImageName = `${dateStr}${cleanDesc}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', activeFolder);
      formData.append('filename', newImageName);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();

      const newImage: UploadedImage = {
        name: newImageName,
        url: data.url,
        folder: activeFolder,
        date: new Date().toISOString(),
      };

      setImages([newImage, ...images]);
      setSelectedFile(null);
      setUploadDescription('');
      
      // Reset input
      const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const activeFolderImages = images.filter((img) => img.folder === activeFolder);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <ImageIcon className="w-5 h-5" />
          </span>
          <h3 className="font-bold text-slate-900 text-lg">Images Folders</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Manage and upload images to their respective folders. Uploads are strictly one at a time and automatically renamed based on date and description.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Folders Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2 border-r border-slate-100 pr-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Folders</h4>
          {FOLDERS.map((folder) => {
            const isActive = activeFolder === folder;
            const count = images.filter((img) => img.folder === folder).length;
            return (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 capitalize">
                  {isActive ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4 text-slate-400" />}
                  <span>{folder}</span>
                </div>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Upload Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5 capitalize">
              <Upload className="w-4 h-4 text-indigo-600" />
              Upload to {activeFolder}
            </h4>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image Description (e.g., &quot;universityfront&quot;) *
                </label>
                <input
                  type="text"
                  required
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter a short, descriptive name"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Image File (One at a time) *
                </label>
                <input
                  id="image-upload-input"
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 transition-all cursor-pointer"
                />
              </div>
              
              <button
                type="submit"
                disabled={!selectedFile || !uploadDescription.trim() || isUploading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 text-xs shadow-sm"
              >
                {isUploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Rename</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Gallery Section */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4 capitalize">
              {activeFolder} Images ({activeFolderImages.length})
            </h4>
            
            {activeFolderImages.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <FileImage className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No images in this folder yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {activeFolderImages.map((img, idx) => (
                  <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square flex flex-col">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <span className="text-[10px] font-mono text-white break-all leading-tight">
                        {img.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
