import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Icon } from "./Icon";
import { ORG_NAME, TAGLINE } from "../lib/site";
import type { NavDrawerControls } from "../lib/useNavDrawer";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/live", label: "Live Service" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact Us" },
] as const;

interface HeaderProps {
  drawer: NavDrawerControls;
}

/**
 * Sticky header plus the mobile navigation drawer.
 *
 * The drawer is the same `<ul class="nav-links">` as the desktop nav — the
 * stylesheet slides it off-canvas below 768px, which is how the original
 * worked. Keeping one element means the markup stays identical at every width.
 */
export function Header({ drawer }: HeaderProps) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the drawer when it opens, and back to the toggle when it
  // closes, so the tab order does not start from the top of the page.
  useEffect(() => {
    if (drawer.open) closeRef.current?.focus();
  }, [drawer.open]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !drawer.open) toggleRef.current?.focus();
    wasOpen.current = drawer.open;
  }, [drawer.open]);

  return (
    <header>
      <div className="container">
        <nav className="navbar">
          <div className="logo">
            <Link to="/" aria-label={`${ORG_NAME} home`}>
              <img src="/images/awp-logo.svg" alt="" width={50} height={50} />
            </Link>
          </div>

          <div className="hide" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1rem" }}>{ORG_NAME}</p>
            <p style={{ fontStyle: "italic", color: "#E6F1FF", fontSize: "0.8rem", fontWeight: 400 }}>
              {TAGLINE}
            </p>
          </div>

          <ul className={`nav-links${drawer.open ? " show" : ""}`} id="navLinks">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  // Replacing consumes the drawer's sentry history entry, so
                  // one back press returns to the page you were on rather than
                  // landing on a duplicate.
                  replace
                  onClick={drawer.dismiss}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <button
            type="button"
            ref={toggleRef}
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={drawer.open}
            aria-controls="navLinks"
            onClick={drawer.openDrawer}
          >
            <Icon name="menu" size="1.8rem" />
          </button>

          <button
            type="button"
            ref={closeRef}
            className="closeMenu"
            aria-label="Close menu"
            onClick={drawer.closeDrawer}
          >
            <Icon name="close" size="3.5rem" />
          </button>
        </nav>
      </div>
    </header>
  );
}
