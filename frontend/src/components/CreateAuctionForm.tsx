"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/services/upload.service";
import { useCreateAuction } from "@/hooks/useAuctions";
import { toast } from "sonner";
import { Gavel, ImagePlus, FileText, DollarSign, Calendar, Trash2 } from "lucide-react";

export default function CreateAuctionForm() {
  const router = useRouter();
  const mutation = useCreateAuction();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);

    const newPreviews = selected.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    // Memory leak safeguard: Clean up the Object URL from browser memory
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startingPrice = Number(formData.get("startingPrice"));
    const endTime = formData.get("endTime") as string;

    if (!title || !description || !startingPrice || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsUploading(true);
    const images: string[] = [];

    try {
      for (const file of files) {
        const url = await uploadImage(file);
        images.push(url);
      }
    } catch (err) {
      toast.error("Failed to upload images");
      setIsUploading(false);
      return;
    }

    mutation.mutate(
      {
        title,
        description,
        startingPrice,
        endTime,
        images,
      },
      {
        onSuccess: (data) => {
          toast.success("Auction created successfully!");
          router.push(`/auctions/${data._id || data.data?._id}`);
          router.refresh();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to create auction");
          setIsUploading(false);
        },
      }
    );
  };

  const isPending = mutation.isPending || isUploading;

  return (
    <form onSubmit={submit} className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Item Title</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Gavel className="w-5 h-5" />
            </span>
            <input
              name="title"
              type="text"
              placeholder="e.g. Rare 1999 Pokémon Base Set Charizard Holo"
              className="pl-10 block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <div className="relative">
            <span className="absolute top-3 left-3 text-gray-400">
              <FileText className="w-5 h-5" />
            </span>
            <textarea
              name="description"
              rows={4}
              placeholder="Provide a detailed description of the collectible, its condition, and any provenance details..."
              className="pl-10 block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Starting Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Starting Price ($)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <DollarSign className="w-5 h-5" />
              </span>
              <input
                name="startingPrice"
                type="number"
                min="1"
                placeholder="100"
                className="pl-10 block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Auction End Time</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Calendar className="w-5 h-5" />
              </span>
              <input
                name="endTime"
                type="datetime-local"
                className="pl-10 block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                required
              />
            </div>
          </div>
        </div>

        {/* Images Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Item Images</label>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-500 bg-gray-50/50 transition-colors p-6 text-center cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <ImagePlus className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Click to upload images</p>
            <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, JPEG up to 5MB</p>
          </div>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl border border-gray-200 overflow-hidden group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{isUploading ? "Uploading Images..." : "Creating Auction..."}</span>
          </>
        ) : (
          <>
            <Gavel className="w-5 h-5" />
            <span>Publish Auction</span>
          </>
        )}
      </button>
    </form>
  );
}