import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { register as registerApi, login, getMe } from "../api/auth"
import { useAuthStore } from "../store/authStore"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { ROLES } from "../utils/constants"

const schema = z.object({
  full_name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([ROLES.BUYER, ROLES.SELLER]),
})

export default function Register() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: ROLES.BUYER },
  })
  const selectedRole = watch("role")

  const mutation = useMutation({
    mutationFn: registerApi,
    onSuccess: async (_, variables) => {
      const loginRes = await login(variables.email, variables.password)
      const { access_token, refresh_token } = loginRes.data
      useAuthStore.getState().setTokens(access_token, refresh_token)
      const me = await getMe()
      storeLogin(access_token, refresh_token, me.data)
      toast.success("Account created!")
      navigate(variables.role === ROLES.SELLER ? "/seller" : "/buyer")
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Registration failed"),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 text-sm mb-6">Join the marketplace</p>

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          {[ROLES.BUYER, ROLES.SELLER].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setValue("role", role)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                selectedRole === role
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {role === ROLES.BUYER ? "🛒 I want to buy" : "📦 I want to sell"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <Input label="Full name" error={errors.full_name?.message} {...register("full_name")} />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" error={errors.password?.message} {...register("password")} />
          <Button type="submit" className="w-full" loading={mutation.isPending}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
