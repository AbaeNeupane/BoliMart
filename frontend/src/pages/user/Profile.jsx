import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import client from "../../api/client"
import toast from "react-hot-toast"

async function updateProfile(data) {
  return client.patch("/users/me", data)
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  const [fullName, setFullName] = useState(user?.full_name || "")
  const [username, setUsername] = useState(user?.username || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      toast.success("Profile updated successfully")
      if (setUser) setUser(res.data)
      queryClient.invalidateQueries(["me"])
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Failed to update profile")
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    const payload = {}
    if (fullName !== user?.full_name) payload.full_name = fullName
    if (username !== user?.username) payload.username = username
    if (newPassword) {
      payload.current_password = currentPassword
      payload.new_password = newPassword
    }

    if (Object.keys(payload).length === 0) {
      toast("No changes to save", { icon: "ℹ️" })
      return
    }

    mutation.mutate(payload)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Profile settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account info</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full h-10 px-3 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Change password</h2>
          <p className="text-xs text-gray-400">Leave blank to keep your current password</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full h-11 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>

      </form>
    </div>
  )
}