import { useState } from "react";
import Input from "../components/input";
import Button from "../components/button";
import { FaTag, FaAlignLeft, FaLayerGroup, FaExchangeAlt } from "react-icons/fa";

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

    try {
      const response = await fetch("http://localhost:3000/api/resources", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
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
      className="min-w-[350px] max-w-2xl mx-auto p-10 bg-gray-800 rounded-2xl shadow-lg"
    >
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        Add New Resource
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Input
          type="text"
          id="title"
          placeholder="Title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          icon={<FaTag className="text-gray-400" />}
        />
        <Input
          type="text"
          id="description"
          placeholder="Description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          icon={<FaAlignLeft className="text-gray-400" />}
        />
        <Input
          type="text"
          id="category"
          placeholder="Category"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          icon={<FaLayerGroup className="text-gray-400" />}
        />
        <div>
          <label htmlFor="type" className="block text-white mb-1">
            Type
          </label>
          <div className="relative">
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-900 text-gray-200 focus:outline-none appearance-none"
            >
              <option value="">Select Type</option>
              <option value="Lend">Lend</option>
              <option value="Exchange">Exchange</option>
            </select>
            <FaExchangeAlt className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="photos" className="block text-white mb-1">
          Upload Photos
        </label>
        <input
          type="file"
          id="photos"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(e.target.files)}
          className="w-full bg-gray-900 text-gray-200 rounded px-3 py-2"
        />
      </div>

      <Button buttonName="Submit Resource" type="submit" />
    </form>
  );
};

export default AddResourceForm;