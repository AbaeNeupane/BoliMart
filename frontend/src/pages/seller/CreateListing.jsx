import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDropzone } from "react-dropzone"
import toast from "react-hot-toast"
import { createListing } from "../../api/listings"
import { uploadImage } from "../../api/upload"
import Navbar from "../../components/layout/Navbar"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"

const schema = z.object({
  title: z.string().min(5, "Title too short"),
  description: z.string().min(20, "Description too short"),
  min_price: z.number({ invalid_type_error: "Enter a number" }).positive("Must be positive"),
  duration_days: z.number().min(1).max(30),
  category: z.string().min(1, "Select a category"),
})

const CATEGORIES = ["Electronics", "Fashion", "Home", "Sports", "Art", "Vehicles", "Other"]
const DURATION_OPTIONS = [1, 3, 5, 7, 14, 30]

export default function CreateListing() {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { duration_days: 7 },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 5,
    onDrop: (files) => setImages((prev) => [...prev, ...files].slice(0, 5)),
  })

  const mutation = useMutation({
    mutationFn: async (formData) => {
      setUploading(true)
      const imageUrls = await Promise.all(images.map(async (file) => {
        const res = await uploadImage(file)
        return res.data.url
      }))
      setUploading(false)

      const now = new Date()
      const endsAt = new Date(now.getTime() + formData.duration_days * 86400000)

      return createListing({
        ...formData,
        image_urls: imageUrls,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
    },
    onSuccess: () => {
      toast.success("Listing created!")
      navigate("/seller")
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Failed to create listing"),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create listing</h1>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Item details</h2>
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register("description")}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" {...register("category")}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Images</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <input {...getInputProps()} />
              <p className="text-gray-400 text-sm">Drop images here or click to select (max 5)</p>
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt={`preview-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Auction settings</h2>
            <Input
              label="Minimum price ($)"
              type="number"
              step="0.01"
              error={errors.min_price?.message}
              {...register("min_price", { valueAsNumber: true })}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Auction duration</label>
              <div className="flex gap-2 flex-wrap">
                {DURATION_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => register("duration_days").onChange({ target: { value: days } })}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:border-primary-500 hover:text-primary-500"
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={mutation.isPending || uploading}>
            {uploading ? "Uploading images..." : "Create listing"}
          </Button>
        </form>
      </div>
    </div>
  )
}
