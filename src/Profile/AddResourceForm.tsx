import { useState } from "react";
import Input from "../Component/input";
import Button from "../Component/button";

interface AddResourceFormProps {
  onClose: () => void;
}

const AddResourceForm = ({ onClose }: AddResourceFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("type", type.toLowerCase());
  
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }
    }
  
    // Debug log to verify the form data keys
    console.log("Submitting resource with:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
  
    try {
      const response = await fetch("http://localhost:3000/api/resources", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
  
      if (response.ok) {
        console.log("Resource created!");
        onClose();
      } else {
        const errorText = await response.text();
        console.error("Failed to create resource:", errorText);
      }
    } catch (error) {
      console.error("Error while submitting form:", error);
    }
  };
  
  

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg shadow-lg border border-gray-700"
    >
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">
        Add New Resource
      </h2>

      <Input
        type="text"
        id="title"
        placeholder="Enter resource title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Input
        type="text"
        id="description"
        placeholder="Enter description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        type="text"
        id="category"
        placeholder="e.g., Books, Tools"
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full border text-gray-400 border-gray-300 rounded px-3 py-2 bg-transparent"
      >
        <option value="">Select Type</option>
        <option value="Lend">Lend</option>
        <option value="Exchange">Exchange</option>
      </select>


      <div className="mb-3">
        <label htmlFor="photos" className="block text-white mb-1">
          Upload Photos
        </label>
        <input
          type="file"
          id="photos"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(e.target.files)}
          className="w-full bg-gray-200 rounded"
        />

      </div>
      <Button buttonName="Submit Resource" type="submit" />
    </form>
  );
};

export default AddResourceForm;
