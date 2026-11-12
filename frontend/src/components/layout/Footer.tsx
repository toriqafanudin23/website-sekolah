import { ArrowUp, ArrowUpRight, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '@/components/ui/Container'
import { FOOTER_LINKS, ROUTES } from '@/config/navigation'
import { CONTACT, SITE } from '@/config/site'
import { setting, useSettings } from '@/lib/siteData'

export function Footer() {
  const settings = useSettings()
  const contactItems: readonly { icon: LucideIcon; text: string }[] = [
    { icon: MapPin, text: setting(settings, 'contact.address', CONTACT.address) },
    { icon: Phone, text: setting(settings, 'contact.phone', CONTACT.phone) },
    { icon: Mail, text: setting(settings, 'contact.email', CONTACT.email) },
  ]

  return (
    <footer className="border-t-4 border-accent bg-ink text-white">
      <Container className="pt-10 pb-6 md:grid md:grid-cols-[1.4fr_1fr_1.4fr] md:gap-10 md:pt-14 md:pb-10">
        <div>
          <p className="font-display text-2xl leading-[1.15] md:text-[26px]">{SITE.name}</p>
          <p className="mt-2 mb-5 text-tint md:mb-0">{SITE.tagline}</p>
        </div>

        <nav aria-label="Tautan footer">
          <ul>
            {FOOTER_LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group/link flex items-center gap-1.5 border-t border-white/30 py-[11px] no-underline transition-colors duration-200 hover:text-accent md:border-t-0 md:py-1.5"
                >
                  {label}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 -translate-x-1 opacity-0 transition-[opacity,translate] duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100 motion-reduce:transition-none"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className="my-5 space-y-3 text-tint not-italic md:my-0">
          {contactItems.map(({ icon: Icon, text }) => (
            <p key={text} className="flex items-start gap-3">
              <Icon aria-hidden="true" className="mt-1 size-[18px] shrink-0 text-accent" />
              <span>{text}</span>
            </p>
          ))}
        </address>
      </Container>

      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-6 text-sm text-tint md:pb-7">
        <p>
          © {new Date().getFullYear()} {SITE.name}
        </p>
        <div className="flex items-center gap-5">
          <Link
            to={ROUTES.adminLogin}
            className="underline underline-offset-4 transition-colors hover:text-accent hover:no-underline"
          >
            Masuk admin
          </Link>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-accent px-3.5 py-2 font-bold text-ink transition-colors duration-200 hover:bg-white"
          >
            <ArrowUp aria-hidden="true" className="size-4" strokeWidth={2.6} />
            Ke atas
          </button>
        </div>
      </Container>
    </footer>
  )
}
