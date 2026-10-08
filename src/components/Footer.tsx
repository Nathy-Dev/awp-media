import { Icon } from "./Icon";
import { CONTACT_EMAIL, ORG_NAME, PHONES, SOCIALS, TAGLINE } from "../lib/site";

const SOCIAL_LINKS = [
  { name: "facebook", href: SOCIALS.facebook, label: "Facebook" },
  { name: "instagram", href: SOCIALS.instagram, label: "Instagram" },
  { name: "youtube", href: SOCIALS.youtube, label: "YouTube" },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-container">
          <div className="footer-about">
            <h3>{ORG_NAME}</h3>
            <p style={{ fontStyle: "italic" }}>{TAGLINE}</p>

            <div className="social-icons">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <Icon name={social.name} size={24} />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-contact">
            <h4>Contact Us</h4>
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`}>Email: {CONTACT_EMAIL}</a>
            </p>
            <p>
              {PHONES.map((phone, index) => (
                <span key={phone.href}>
                  {/* The old markup printed a trailing comma on every number. */}
                  {index === 0 ? "Phone: " : " "}
                  <a href={`tel:${phone.href}`}>{phone.label}</a>
                  {index < PHONES.length - 1 ? "," : ""}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Apostles of the Word and Prayer Worldwide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
