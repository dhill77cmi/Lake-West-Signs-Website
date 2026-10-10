"use client";

import { ResponsiveImage } from "@/components/responsive-image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type FocusEvent } from "react";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { primaryNavigation, quoteLink } from "@/content/navigation";
import { Button } from "@/components/ui/button";
import { closeMenu, useMenuMotion } from "@/components/menu-motion";
import { gsap, useGSAP, motionConditions, motionTokens } from "@/lib/motion";

type NavigationLink = { label: string; href: string };
type HeaderProps = {
  name: string;
  phone: string;
  phoneHref: string;
  services: NavigationLink[];
};

export function HeaderNavigation(props: HeaderProps) {
  const pathname = usePathname();
  // Layouts persist across client navigation. Remount native disclosures closed.
  return <HeaderContents key={pathname} pathname={pathname} {...props} />;
}

function closeDetails(details: HTMLDetailsElement, restoreFocus = false) {
  closeMenu(details, restoreFocus, false);
}

function closeOnBlur(event: FocusEvent<HTMLDetailsElement>) {
  // Safari touch can blur the summary without naming the tapped link as the
  // next focus target. Keep the panel mounted until that link receives its click.
  if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeDetails(event.currentTarget);
}

function HeaderContents({ name, phone, phoneHref, services, pathname }: HeaderProps & { pathname: string }) {
  const headerRef = useRef<HTMLElement>(null);
  const overHero = pathname === "/" || pathname.startsWith("/design-options/");
  useMenuMotion(headerRef);

  useGSAP((_, contextSafe) => {
    const root = headerRef.current!;
    const phone = root.querySelector<HTMLAnchorElement>(".header-phone")!;
    const icon = phone.querySelector("svg")!;
    const tokens = motionTokens(root);
    const media = gsap.matchMedia();
    media.add(motionConditions, ({ conditions }) => {
      if (conditions?.reduce) return;
      let ring: gsap.core.Tween | undefined;
      const start = contextSafe!((event: Event) => {
        if (event instanceof PointerEvent && event.pointerType === "touch") return;
        ring?.kill();
        gsap.killTweensOf(icon);
        gsap.set(icon, { rotation: 0, transformOrigin: "50% 50%" });
        ring = gsap.to(icon, {
          keyframes: { rotation: [0, -18, 16, -13, 10, -6, 0], easeEach: "sine.inOut" },
          duration: tokens.feedback * 6,
          ease: "none",
          clearProps: "transform",
        });
      });
      const settle = contextSafe!(() => {
        ring?.kill();
        gsap.to(icon, { rotation: 0, duration: tokens.feedback, ease: "sine.out", overwrite: true, clearProps: "transform" });
      });
      phone.addEventListener("pointerenter", start);
      phone.addEventListener("pointerleave", settle);
      phone.addEventListener("focus", start);
      phone.addEventListener("blur", settle);
      return () => {
        phone.removeEventListener("pointerenter", start);
        phone.removeEventListener("pointerleave", settle);
        phone.removeEventListener("focus", start);
        phone.removeEventListener("blur", settle);
        ring?.kill();
        gsap.killTweensOf(icon);
        gsap.set(icon, { clearProps: "transform" });
      };
    }, headerRef);
    return () => media.revert();
  }, { scope: headerRef });

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      headerRef.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
        if (!details.contains(event.target as Node)) closeMenu(details);
      });
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const open = headerRef.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (open) {
        event.preventDefault();
        closeDetails(open, true);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  const navLink = ({ label, href }: NavigationLink, className = "navigation-link") => (
    <Link key={href} href={href} prefetch={false} className={className} aria-current={pathname === href ? "page" : undefined}
      onNavigate={() => {
        // Let Link receive the tap before hiding its disclosure. Closing during
        // click capture can remove the touch target before navigation runs.
        headerRef.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => {
          closeDetails(details, href === pathname && details.contains(document.activeElement));
        });
      }}>
      {label}
    </Link>
  );

  return (
    <header
      ref={headerRef}
      // Over the hero the bar is fixed, so while a menu locks page scroll it needs the scrollbar's width as
      // margin (width-before-scroll-bar) to stay put; in normal flow the body's own margin already covers it.
      className={`site-header ${overHero ? "width-before-scroll-bar " : ""}bg-background text-foreground`}
    >
      <div className="header-row">
        <Link href="/" className="brand-link" aria-label={`${name} home`}>
          <ResponsiveImage src="/logo-transparent.png" width={1400} height={469} alt={name} className="brand-image" sizes="(min-width: 1024px) 160px, 120px" priority />
        </Link>

        <nav aria-label="Main navigation" className="desktop-navigation">
          {navLink({ label: "Home", href: "/" })}
          <details className="relative" onBlur={closeOnBlur}>
            <summary className="navigation-summary">Services <span className="services-arrow" aria-hidden="true"><ChevronDown /></span></summary>
            <div className="menu-panel services-panel">
              {services.map((service) => navLink(service))}
            </div>
          </details>
          {primaryNavigation.map((link) => navLink(link))}
        </nav>

        <div className="header-actions">
          <a className="header-phone" href={phoneHref} aria-label={`Call us at ${phone}`}>
            <Phone aria-hidden="true" /><span className="header-phone-number">{phone}</span><span className="header-phone-label">Call us</span>
          </a>
          <Button asChild variant="inverse-outline" className="header-quote">
            <Link href={quoteLink.href} prefetch={false}>{quoteLink.label}</Link>
          </Button>
        </div>

        <details className="mobile-navigation" onBlur={closeOnBlur}>
          <summary className="navigation-summary" aria-label="Menu">
            <Menu className="menu-icon" aria-hidden="true" />
            <X className="close-icon" aria-hidden="true" />
            <span className="mobile-menu-label">Menu</span>
          </summary>
          <nav aria-label="Mobile navigation" className="menu-panel mobile-panel">
            {navLink({ label: "Home", href: "/" })}
            <div className="menu-service-list">{services.map((service) => navLink(service))}</div>
            {primaryNavigation.map((link) => navLink(link))}
          </nav>
        </details>
      </div>
    </header>
  );
}
