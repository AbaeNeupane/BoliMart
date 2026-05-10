import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { login, getMe } from "../api/auth"
import { useAuthStore } from "../store/authStore"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export default function Login() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: async (data) => {
      const { access_token, refresh_token } = data.data
      useAuthStore.getState().setTokens(access_token, refresh_token)
      const me = await getMe()
      storeLogin(access_token, refresh_token, me.data)
      toast.success("Welcome back!")
      const role = me.data.role
      if (role === "admin") navigate("/admin")
      else if (role === "seller") navigate("/seller")
      else navigate("/buyer")
    },
    onError: () => toast.error("Invalid email or password"),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
        <p className="text-gray-500 text-sm mb-6">Welcome back to the marketplace</p>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="w-full" loading={mutation.isPending}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary-500 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
