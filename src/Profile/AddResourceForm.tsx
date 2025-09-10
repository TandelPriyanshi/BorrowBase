import { useState, useEffect, useRef } from "react";
import Input from "../components/input";
import Button from "../components/button";
import { toast } from "react-toastify";
import { FaTag, FaLayerGroup, FaTasks, FaUpload, FaImage, FaTimes } from "react-icons/fa";
import api from "../utils/api";
import LoadingOverlay from "../components/LoadingOverlay";
import ApiService from "../services/apiService";

interface AddResourceFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AddResourceForm = ({ onClose, onSuccess }: AddResourceFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("good");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch categories and conditions on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/resources/categories");
        const data = response.data;
        setCategories(data.data.categories);
        setConditions(data.data.conditions);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Fallback categories if API fails
        setCategories(["Tools", "Electronics", "Books", "Furniture", "Other"]);
        setConditions(["excellent", "good", "fair", "poor"]);
      }
    };
    
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    setFieldErrors({});
    
    // Client-side validation
    const errors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      errors.title = "Title is required (minimum 3 characters)";
    } else if (title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters long";
    }
    
    if (!description.trim()) {
      errors.description = "Description is required (minimum 10 characters)";
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }
    
    if (!category) {
      errors.category = "Please select a category";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("condition", condition);

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }
    }

    try {
      const response = await api.post("/api/resources", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // If we get here, the request was successful
      const data = response.data;
      toast.success("Resource added successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error while submitting form:", error);
      
      if (error.response) {
        // The server responded with an error status
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (errorData.field && errorData.message) {
          setFieldErrors({ [errorData.field]: errorData.message });
        } else {
          const errorMessage = errorData.message || "Failed to create resource";
          setError(errorMessage);
        }
        
        toast.error(errorData.message || "Failed to create resource");
      } else {
        // Network error or other issue
        const errorMessage = "Something went wrong. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError(""); // Clear general error when user types
    setFieldErrors(prev => ({ ...prev, [field]: "" })); // Clear field-specific error
    
    switch (field) {
      case "title":
        setTitle(value);
        break;
      case "description":
        setDescription(value);
        break;
    }
  };

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const validFiles: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name} is not a valid image file`);
      }
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Create preview URL for images
  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700">
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isLoading} 
        message={files.length > 0 ? "Uploading photos and creating resource..." : "Creating your resource..."}
      />
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FaUpload className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Add New Resource
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            disabled={isLoading}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Basic Information
            </h3>
            
            <div>
              <Input
                type="text"
                id="title"
                placeholder="Enter resource title (min 3 characters)"
                label="Title *"
                value={title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                icon={<FaTag className="text-gray-400" />}
              />
              {fieldErrors.title && <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-white text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                id="description"
                placeholder="Describe your resource in detail (min 10 characters)"
                value={description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-none transition-all duration-200"
                disabled={isLoading}
              />
              {fieldErrors.description && <p className="text-red-500 text-sm mt-1">{fieldErrors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-white text-sm font-medium mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => { 
                      setCategory(e.target.value); 
                      setFieldErrors(prev => ({ ...prev, category: "" })); 
                    }}
                    className="w-full border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200"
                    disabled={isLoading}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <FaLayerGroup className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {fieldErrors.category && <p className="text-red-500 text-sm mt-1">{fieldErrors.category}</p>}
              </div>
              
              <div>
                <label htmlFor="condition" className="block text-white text-sm font-medium mb-2">
                  Condition
                </label>
                <div className="relative">
                  <select
                    id="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full border border-gray-700 rounded-lg px-4 py-3 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200"
                    disabled={isLoading}
                  >
                    {conditions.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </option>
                    ))}
                  </select>
                  <FaTasks className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Photos
            </h3>
        
        {/* Drag and Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
            dragActive 
              ? "border-blue-400 bg-blue-50/10" 
              : "border-gray-600 hover:border-gray-500"
          } ${isLoading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isLoading}
          />
          
          <div className="flex flex-col items-center space-y-3">
            <FaUpload className={`w-8 h-8 ${dragActive ? "text-blue-400" : "text-gray-400"}`} />
            <div className="text-gray-300">
              <p className="text-sm font-medium">
                {dragActive ? "Drop your images here" : "Drag & drop images here"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or <span className="text-blue-400 underline">browse files</span>
              </p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
        
        {/* Image Previews */}
        {files.length > 0 && (
          <div className="mt-4">
            <p className="text-white text-sm font-medium mb-2">
              Selected Images ({files.length})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={getImagePreview(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    disabled={isLoading}
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Adding Resource...</span>
              </>
            ) : (
              <>
                <FaUpload className="w-4 h-4" />
                <span>Add Resource</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddResourceForm;