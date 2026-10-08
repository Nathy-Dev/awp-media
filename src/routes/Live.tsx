import { Icon, type IconName } from "../components/Icon";
import { useHead } from "../lib/useHead";
import { LIVE_TIMES, SOCIALS } from "../lib/site";

interface Channel {
  icon: IconName;
  color: string;
  blurb: string;
  href: string;
}

const CHANNELS: readonly Channel[] = [
  {
    icon: "telegram",
    color: "#0088cc",
    blurb: "Click the button below to join our live service on Telegram.",
    href: SOCIALS.telegram,
  },
  {
    icon: "facebook",
    color: "#1877F2",
    blurb: "Click the button below to join our live service on Facebook.",
    href: SOCIALS.facebook,
  },
  {
    icon: "youtube",
    color: "#FF0000",
    blurb: "Click the button below to join our live service on YouTube.",
    href: SOCIALS.youtube,
  },
  {
    // The old build gave this icon Instagram's orange-to-magenta gradient via
    // `background-clip: text`, which only works on a font glyph. An SVG cannot
    // take a CSS gradient as a fill, so it uses the gradient's midpoint.
    icon: "instagram",
    color: "#dc2743",
    blurb: "Click the button below to join our live service on Instagram.",
    href: SOCIALS.instagram,
  },
];

export default function Live() {
  useHead({
    title: "Join Our Live Service",
    description:
      "Experience the power of God's Word and Prayer — live every week on Telegram, Facebook, YouTube and Instagram.",
    path: "/live",
  });

  return (
    <main className="live-section container" style={{ padding: "3rem 0" }}>
      <h1>Join Our Live Service</h1>
      <p>Experience the power of God&apos;s Word and Prayer — live, every week on Telegram.</p>

      <div className="live-services">
        {CHANNELS.map((channel) => (
          <div className="live-container" key={channel.icon}>
            <div className="telegram-box" style={{ backgroundColor: "white" }}>
              <Icon name={channel.icon} size="3rem" style={{ color: channel.color }} />
              <p>{channel.blurb}</p>
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="live-button"
                aria-label={`Join our live service on ${channel.icon}`}
              >
                Join Live Now
              </a>
              <p className="note">{LIVE_TIMES}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
