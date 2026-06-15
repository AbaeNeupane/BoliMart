
import logo from "../../assets/logo1.png"

const QUICK_LINKS = [
  { label: "About us", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Seller guide", href: "#" },
  { label: "API Docs", href: "#" },
]

const SUPPORT_LINKS = [
  { label: "FAQs", href: "#" },
  { label: "Help center", href: "#" },
  { label: "Privacy policy", href: "#" },
  { label: "Grievance", href: "#" },
  { label: "Terms of service", href: "#" },
]

function PhoneIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const SOCIALS = [
  { icon: <FacebookIcon />, href: "#", label: "Facebook" },
  { icon: <InstagramIcon />, href: "#", label: "Instagram" },
  { icon: <TwitterIcon />, href: "#", label: "Twitter" },
  { icon: <YoutubeIcon />, href: "#", label: "YouTube" },
]

export default function Footer() {
  return (
    <footer className="bg-primary-600 text-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Top section — brand + 4 cols on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* Col 1 — Brand + contact (full width on mobile) */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-block cursor-pointer"
              >
              <img src={logo} alt="Boli" className="h-10 w-auto brightness-0 invert" />
            </button>
            <p className="text-sm font-semibold text-white">Boli Auctions Pvt Ltd</p>
            <div className="space-y-2.5 text-sm text-white/90">
              <div className="flex items-start gap-2.5 justify-center lg:justify-start">
                <LocationIcon />
                <span>123 Auction Street, New York, NY 10001</span>
              </div>
              <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                <PhoneIcon />
                <span>+1 (800) 000-0000</span>
              </div>
              <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                <PhoneIcon />
                <span>1800-000-1111 (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                <MailIcon />
                <a href="mailto:support@boli.com" className="hover:text-white transition-colors">
                  support@boli.com
                </a>
              </div>
              <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                <ClockIcon />
                <span>Mon - Fri : 9:00 AM to 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Cols 2 & 3 — Quick Links + Support: side by side on mobile too */}
          <div className="grid grid-cols-2 lg:contents gap-10">

            {/* Quick Links */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-base font-bold text-white mb-5">Quick Links</h4>
              <ul className="space-y-3">
                {QUICK_LINKS.map(function(item) {
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                      >
                        <ChevronIcon />
                        {item.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h4 className="text-base font-bold text-white mb-5">Support</h4>
              <ul className="space-y-3">
                {SUPPORT_LINKS.map(function(item) {
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                      >
                        <ChevronIcon />
                        {item.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

          </div>

          {/* Col 4 — Support officer + socials */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div className="w-full">
              <h4 className="text-base font-bold text-white mb-4">Information / Support Officer</h4>
              <div className="flex items-center gap-4 mb-3 justify-center lg:justify-start">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/40">
                  <svg className="w-10 h-10 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white text-sm">John Smith</p>
                  <div className="flex items-center gap-1.5 text-sm text-white/90 mt-1">
                    <PhoneIcon />
                    <span>+1 (800) 000-9999</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                Contact us for support with Boli auctions.
              </p>
              <a href="#" className="text-sm text-yellow-300 hover:text-yellow-200 transition-colors">
                Submit a grievance
              </a>
            </div>

            <div className="w-full">
              <h4 className="text-base font-bold text-white mb-3">Connect With Us</h4>
              <div className="flex gap-2 justify-center lg:justify-start">
                {SOCIALS.map(function(item) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      aria-label={item.label}
                      className="w-9 h-9 rounded-lg border border-white/40 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200"
                    >
                      {item.icon}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/80 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Boli. Powered By Boli Auctions Pvt. Ltd
          </p>
          <div className="flex gap-3">
            <a
              href="#"
              className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div>
                <div className="text-white/60 text-xs leading-none">Download on the</div>
                <div className="font-semibold text-sm leading-tight">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.72-2.72-10.87 9.79z" fill="#EA4335"/>
                <path d="M20.61 10.17L17.5 8.37l-3.06 3.06 3.06 3.06 3.14-1.81a1.8 1.8 0 000-3.11l-.03.5z" fill="#FBBC04"/>
                <path d="M3.18.24a1.8 1.8 0 00-.99 1.6v20.32c0 .67.37 1.27.99 1.6l.1.06 11.38-11.38v-.27L3.28.18l-.1.06z" fill="#4285F4"/>
                <path d="M16.77 16.69L3.18 23.96l.1.06c.57.33 1.26.33 1.84 0L18.6 16.5l-1.83-1.81z" fill="#34A853"/>
              </svg>
              <div>
                <div className="text-white/60 text-xs leading-none">GET IT ON</div>
                <div className="font-semibold text-sm leading-tight">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>

    </footer>
  )
}