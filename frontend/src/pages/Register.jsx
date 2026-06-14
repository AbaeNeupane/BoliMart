import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import client from "../api/client"
import { login, getMe } from "../api/auth"
import { useAuthStore } from "../store/authStore"


function Label({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
}

function Input({ error, ...props }) {
  return (
    <div>
      <input
        className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors
          ${error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-primary-500"}
          focus:ring-1 ${error ? "focus:ring-red-200" : "focus:ring-primary-100"}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function PasswordInput({ label, error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-lg outline-none transition-colors
            ${error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-primary-500"}
            focus:ring-1 ${error ? "focus:ring-red-200" : "focus:ring-primary-100"}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function StepIndicator({ current }) {
  const steps = ["Credentials", "Verify email", "Your profile"]
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${done ? "bg-green-500 text-white" : active ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              {done ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : step}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

//  Step 1 — Email + Password 

function Step1({ onNext }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState({})

  const mutation = useMutation({
    mutationFn: (data) => client.post("/auth/register/send-otp", data),
    onSuccess: (_, vars) => {
      toast.success("Verification code sent!")
      onNext({ email: vars.email, password: vars.password })
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Something went wrong")
    },
  })

  const validate = () => {
    const e = {}
    if (!email) e.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address"
    if (!password) e.password = "Password is required"
    else if (password.length < 8) e.password = "At least 8 characters"
    if (!confirm) e.confirm = "Please confirm your password"
    else if (confirm !== password) e.confirm = "Passwords do not match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      mutation.mutate({ email, password, confirm_password: confirm })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Email address</Label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
      </div>
      <PasswordInput
        label="Password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <PasswordInput
        label="Confirm password"
        placeholder="Repeat your password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {mutation.isPending ? "Sending code..." : "Continue"}
      </button>
    </form>
  )
}

// ── Step 2 — OTP verification

function Step2({ email, password, onNext }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const inputRefs = Array.from({ length: 6 }, () => null)

  const mutation = useMutation({
    mutationFn: (data) => client.post("/auth/register/verify-otp", data),
    onSuccess: (res) => {
      toast.success("Email verified!")
      onNext({ sessionToken: res.data.session_token })
    },
    onError: (err) => {
      setError(err.response?.data?.detail || "Invalid code")
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => client.post("/auth/resend-verification", null, { params: { email } }),
    onSuccess: () => toast.success("New code sent!"),
    onError: () => toast.error("Failed to resend code"),
  })

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    setError("")
    if (val && i < 5) inputRefs[i + 1]?.focus()
    if (next.every((d) => d) && next.join("").length === 6) {
      mutation.mutate({ email, otp: next.join("") })
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const next = [...otp]
    pasted.split("").forEach((d, i) => { next[i] = d })
    setOtp(next)
    if (pasted.length === 6) mutation.mutate({ email, otp: pasted })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          Please enter a 6-digit otp sent to <span className="font-semibold text-gray-900">{email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-11 h-12 text-center text-xl font-bold border rounded-lg outline-none transition-colors
              ${error ? "border-red-400" : "border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-100"}`}
          />
        ))}
      </div>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {mutation.isPending && (
        <p className="text-center text-sm text-gray-500">Verifying...</p>
      )}

      <p className="text-center text-sm text-gray-500">
        Didn't receive it?{" "}
        <button
          type="button"
          onClick={() => resendMutation.mutate()}
          disabled={resendMutation.isPending}
          className="text-primary-600 font-medium hover:underline disabled:opacity-50"
        >
          {resendMutation.isPending ? "Sending..." : "Resend code"}
        </button>
      </p>
    </div>
  )
}

// ── Step 3 — Profile ──────────────────────────────────────────────────────────

const NATIONALITIES = [
  "Afghan", "Albanian", "American", "Australian", "Austrian", "Bangladeshi",
  "Belgian", "Brazilian", "British", "Bulgarian", "Canadian", "Chilean",
  "Chinese", "Colombian", "Croatian", "Czech", "Danish", "Dutch", "Egyptian",
  "Ethiopian", "Finnish", "French", "German", "Ghanaian", "Greek", "Hungarian",
  "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian",
  "Japanese", "Jordanian", "Kenyan", "Korean", "Kuwaiti", "Lebanese", "Malaysian",
  "Mexican", "Moroccan", "Nepali", "Nigerian", "Norwegian", "Pakistani",
  "Peruvian", "Filipino", "Polish", "Portuguese", "Romanian", "Russian",
  "Saudi Arabian", "Serbian", "Singaporean", "South African", "Spanish",
  "Sri Lankan", "Swedish", "Swiss", "Syrian", "Taiwanese", "Thai", "Turkish",
  "Ukrainian", "Emirati", "Venezuelan", "Vietnamese", "Zimbabwean",
]

function Step3({ email, sessionToken, onDone }) {
  const [form, setForm] = useState({
    full_name: "", username: "", date_of_birth: "", nationality: "",
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data) => client.post("/auth/register/complete", data),
    onSuccess: onDone,
    onError: (err) => {
      const detail = err.response?.data?.detail
      toast.error(Array.isArray(detail) ? detail.map((e) => e.msg).join(", ") : detail || "Failed to complete registration")
    },
  })

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = "Full name is required"
    if (!form.username.trim()) e.username = "Username is required"
    else if (form.username.length < 3) e.username = "At least 3 characters"
    else if (/\s/.test(form.username)) e.username = "No spaces allowed"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      mutation.mutate({
        email,
        password: "placeholder",  // already hashed in DB from step 1
        full_name: form.full_name,
        username: form.username,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality || null,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Full name <span className="text-red-400">*</span></Label>
        <Input
          placeholder="John Neupane"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          error={errors.full_name}
        />
      </div>
      <div>
        <Label>Username <span className="text-red-400">*</span></Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
          <input
            className={`w-full pl-7 pr-3 py-2.5 text-sm border rounded-lg outline-none transition-colors
              ${errors.username ? "border-red-400" : "border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-100"}`}
            placeholder="johndoe"
            value={form.username}
            onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
          />
        </div>
        {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
      </div>
      <div>
        <Label>Date of birth <span className="text-gray-400 font-normal">(optional)</span></Label>
        <Input
          type="date"
          value={form.date_of_birth}
          onChange={(e) => set("date_of_birth", e.target.value)}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>
      <div>
        <Label>Nationality <span className="text-gray-400 font-normal">(optional)</span></Label>
        <select
          value={form.nationality}
          onChange={(e) => set("nationality", e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 bg-white"
        >
          <option value="">Select nationality</option>
          {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {mutation.isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  )
}

// ── Main Register page ────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()
  const [step, setStep] = useState(1)
  const [state, setState] = useState({ email: "", password: "", sessionToken: "" })

  const merge = (data) => setState((s) => ({ ...s, ...data }))

  const handleStep1Done = (data) => { merge(data); setStep(2) }
  const handleStep2Done = (data) => { merge(data); setStep(3) }

  const handleStep3Done = async () => {
    try {
      const loginRes = await login(state.email, state.password)
      const { access_token, refresh_token } = loginRes.data
      useAuthStore.getState().setTokens(access_token, refresh_token)
      const { getMe } = await import("../api/auth")
      const me = await getMe()
      storeLogin(access_token, refresh_token, me.data)
      toast.success("Welcome to Boli! 🎉")
      navigate("/dashboard")
    } catch {
      toast.success("Account created! Please sign in.")
      navigate("/login")
    }
  }

  const titles = [
    { heading: "Create your account", sub: "Start bidding in minutes" },
    { heading: "Check your email", sub: "Enter the 6-digit code we sent you" },
    { heading: "Almost there!", sub: "Tell us a bit about yourself" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <StepIndicator current={step} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{titles[step - 1].heading}</h1>
          <p className="text-sm text-gray-500 mt-1">{titles[step - 1].sub}</p>
        </div>

        {step === 1 && <Step1 onNext={handleStep1Done} />}
        {step === 2 && (
          <Step2
            email={state.email}
            password={state.password}
            onNext={handleStep2Done}
          />
        )}
        {step === 3 && (
          <Step3
            email={state.email}
            sessionToken={state.sessionToken}
            onDone={handleStep3Done}
          />
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}