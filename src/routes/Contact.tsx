import { Icon } from "../components/Icon";
import { useHead } from "../lib/useHead";
import { ADDRESS, CONTACT_EMAIL, PHONES, SOCIALS } from "../lib/site";

const SOCIAL_LINKS = [
  { name: "facebook", href: SOCIALS.facebook, label: "Facebook" },
  { name: "instagram", href: SOCIALS.instagram, label: "Instagram" },
  { name: "youtube", href: SOCIALS.youtube, label: "YouTube" },
] as const;

export default function Contact() {
  useHead({
    title: "Contact Us",
    description:
      "Questions, prayer requests, or want to get involved? Reach Apostles of the Word and Prayer Worldwide by email or phone.",
    path: "/contact",
  });

  return (
    <main className="contact-section container" style={{ padding: "1.5rem 0" }}>
      <h1 style={{ textAlign: "center" }}>Contact Us</h1>
      <p style={{ textAlign: "center", fontSize: "1.1rem" }}>
        If you have questions, prayer requests, or want to get involved, please reach out.
      </p>

      <div className="contact-container">
        <div className="contact-info">
          <div className="contact-item">
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Icon name="envelope" size="1.5rem" />
              <span>{CONTACT_EMAIL}</span>
            </a>
          </div>

          <div className="contact-item phone">
            <Icon name="phone" size="1.5rem" />
            {PHONES.map((phone) => (
              <a key={phone.href} href={`tel:${phone.href}`}>
                <span>{phone.label}</span>
              </a>
            ))}
          </div>

          <div className="social-icons">
            {SOCIAL_LINKS.map((social) => (
              <div className="social-item" key={social.name}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                  <Icon name={social.name} size="1.5rem" />
                </a>
              </div>
            ))}
          </div>

          <div className="social-item">
            <Icon name="map-marker" size="1.5rem" />
            <span>{ADDRESS}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
