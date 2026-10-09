import { useState, Fragment } from "react";
import { useHead } from "../lib/useHead";
import "../styles/camp-registration.css";

/* ── Types ─────────────────────────────────────────────────── */
interface FormData {
  fullName: string;
  gender: string;
  phone: string;
  comingFrom: string;
  churchMembership: string; // "Yes" | church-name string
  isLeader: string;         // "Yes" | "No" — shown only if not AWPW member
  allergyOrSickness: string;
  isPregnantOrNursing: string; // "Yes" | "No" — shown only if gender === "Female"
}

interface FieldErrors {
  [key: string]: string;
}

/* ── Icon helpers ──────────────────────────────────────────── */
function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="#1E8449">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ── Step metadata ─────────────────────────────────────────── */
const STEPS = [
  { label: "Personal" },
  { label: "Church" },
  { label: "Health" },
];

/* ── Radio Option Component ────────────────────────────────── */
function RadioOption({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      id={`radio-${value.replace(/\s+/g, "-").toLowerCase()}`}
      className={`cr-radio-option${selected ? " selected" : ""}`}
      onClick={() => onSelect(value)}
      aria-pressed={selected}
    >
      <span className="cr-radio-dot">
        <span className="cr-radio-dot-inner" />
      </span>
      {label}
    </button>
  );
}

/* ── Shared header brand strip ─────────────────────────────── */
function BrandRow() {
  return (
    <div className="cr-brand-row">
      <img
        src="/icons/awp-logo-192x192.png"
        alt="AWPW Logo"
        className="cr-brand-logo"
        width={42}
        height={42}
      />
      <span className="cr-brand-name">Apostles of the Word and Prayer Worldwide</span>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function CampRegistration() {
  useHead({
    title: "BPAW Camp Meeting 2026 — Registration",
    description:
      "Register for the BPAW Camp Meeting 2026 — Apostles of the Word and Prayer Worldwide (AWPW). 31st October 2026, Port Harcourt, Rivers State.",
    path: "/bpaw",
  });

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    gender: "",
    phone: "",
    comingFrom: "",
    churchMembership: "",
    isLeader: "",
    allergyOrSickness: "",
    isPregnantOrNursing: "",
  });

  /* ── Helpers ─────────────────────────────────────────────── */
  const isFemale = formData.gender === "Female";
  const isExternalChurch =
    formData.churchMembership !== "" && formData.churchMembership !== "Yes";

  const set = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const hasError = (field: string) => touched[field] && !!fieldErrors[field];

  /* ── Validation ──────────────────────────────────────────── */
  const validateStep = (s: number): FieldErrors => {
    const errors: FieldErrors = {};

    if (s === 1) {
      if (!formData.fullName.trim()) errors.fullName = "Please enter your full name.";
      if (!formData.gender) errors.gender = "Please select your gender.";
      if (!formData.phone.trim()) errors.phone = "Please enter your phone number.";
      else if (!/^[+\d\s\-()]{7,20}$/.test(formData.phone.trim()))
        errors.phone = "Please enter a valid phone number.";
    }

    if (s === 2) {
      if (!formData.comingFrom.trim())
        errors.comingFrom = "Please tell us where you're coming from.";
      if (!formData.churchMembership)
        errors.churchMembership = "Please answer this question.";
      if (isExternalChurch && formData.churchMembership === "other")
        errors.churchMembership = "Please enter your church name.";
      if (isExternalChurch && !formData.isLeader)
        errors.isLeader = "Please indicate if you are a leader.";
    }

    if (s === 3) {
      if (!formData.allergyOrSickness.trim())
        errors.allergyOrSickness =
          "Please answer this question (write \"None\" if not applicable).";
      if (isFemale && !formData.isPregnantOrNursing)
        errors.isPregnantOrNursing = "Please select an answer.";
    }

    return errors;
  };

  const touchAllInStep = (s: number) => {
    const stepFields: Record<number, (keyof FormData)[]> = {
      1: ["fullName", "gender", "phone"],
      2: ["comingFrom", "churchMembership", "isLeader"],
      3: ["allergyOrSickness", "isPregnantOrNursing"],
    };
    const toTouch: Record<string, boolean> = {};
    stepFields[s]?.forEach((f) => { toTouch[f] = true; });
    setTouched((prev) => ({ ...prev, ...toTouch }));
  };

  const handleNext = () => {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      touchAllInStep(step);
      setGlobalError("Please fill in all required fields before continuing.");
      return;
    }
    setFieldErrors({});
    setGlobalError("");
    setStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setGlobalError("");
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      touchAllInStep(step);
      setGlobalError("Please fill in all required fields.");
      return;
    }

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;
    if (!webhookUrl) {
      setGlobalError("Registration endpoint is not configured. Please contact the admin.");
      return;
    }

    setIsSubmitting(true);
    setGlobalError("");

    const payload = {
      event: "BPAW Camp Meeting 2026 Registration",
      submittedAt: new Date().toISOString(),
      fullName: formData.fullName.trim(),
      gender: formData.gender,
      phone: formData.phone.trim(),
      comingFrom: formData.comingFrom.trim(),
      churchMembership:
        formData.churchMembership === "Yes"
          ? "AWPW Member"
          : `External — Church: ${formData.churchMembership}`,
      isLeader: isExternalChurch ? formData.isLeader : "N/A (AWPW member)",
      allergyOrSickness: formData.allergyOrSickness.trim(),
      isPregnantOrNursing: isFemale ? formData.isPregnantOrNursing : "N/A",
    };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
    } catch {
      setGlobalError(
        "We couldn't submit your registration. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Render: Success ─────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="cr-page">
        <header className="cr-header">
          <div className="cr-header-inner">
            <BrandRow />
            <h1 className="cr-header-title">
              BPAW <span>Camp Meeting</span>
            </h1>
          </div>
        </header>

        <div className="cr-success">
          <div className="cr-success-icon">
            <IconCheck />
          </div>
          <h2 className="cr-success-title">
            You're <span>Registered!</span>
          </h2>
          <p className="cr-success-msg">
            Thank you, <strong>{formData.fullName.split(" ")[0]}</strong>. Your registration for the
            BPAW Camp Meeting 2026 has been received. We look forward to seeing you!
          </p>
          <blockquote className="cr-success-verse">
            "See you in Camp! You'll be blessed because you came…"
          </blockquote>
        </div>

        <footer className="cr-footer">
          <p>
            Questions? Call <a href="tel:09132646262">0913 264 6262</a> or{" "}
            <a href="tel:08135061115">0813 506 1115</a>
          </p>
          <p style={{ marginTop: "0.3rem" }}>
            <a href="https://awpwmedia.org" target="_blank" rel="noopener noreferrer">
              awpwmedia.org
            </a>{" "}
            · King David Road, Rumuokwurusi, Port Harcourt
          </p>
        </footer>
      </div>
    );
  }

  /* ── Render: Form ────────────────────────────────────────── */
  return (
    <div className="cr-page">
      {/* ── Header ── */}
      <header className="cr-header">
        <div className="cr-header-inner">
          <BrandRow />

          <p className="cr-header-presents">PRESENTS</p>

          <h1 className="cr-header-title">
            BPAW <span>Camp Meeting</span>
          </h1>
          <p className="cr-header-sub">2026 Registration</p>

          <div className="cr-header-meta">
            <span className="cr-header-meta-item">
              <IconCalendar />
              31st October 2026
            </span>
            <span className="cr-header-meta-item">
              <IconClock />
              7:30 AM – 8:30 PM
            </span>
            <span className="cr-header-meta-item">
              <IconMapPin />
              Rumuokwurusi, Port Harcourt
            </span>
          </div>
        </div>

        {/* ── Progress steps ── */}
        <div className="cr-progress-wrap">
          <div className="cr-progress-steps" role="list" aria-label="Form progress">
            {STEPS.map((s, i) => {
              const num = i + 1;
              const isActive = step === num;
              const isDone = step > num;
              return (
                <Fragment key={num}>
                  <div className="cr-step-dot" role="listitem">
                    <div
                      className={`cr-step-circle${isActive ? " active" : ""}${isDone ? " done" : ""}`}
                      aria-current={isActive ? "step" : undefined}
                    >
                      {isDone ? "✓" : num}
                    </div>
                    <span className={`cr-step-label${isActive ? " active" : ""}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="cr-step-line">
                      <div className={`cr-step-line-fill${isDone ? " filled" : ""}`} />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="cr-body">
        {/* ──── Step 1: Personal Info ──── */}
        {step === 1 && (
          <div className="cr-step-panel" key="step-1">
            <h2 className="cr-step-heading">Personal Information</h2>
            <p className="cr-step-hint">Tell us a bit about yourself so we can prepare for your arrival.</p>

            <div className="cr-card">
              {/* Full name */}
              <div className="cr-field">
                <label className="cr-label" htmlFor="fullName">
                  Full Name <span className="cr-label-required">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  className={`cr-input${hasError("fullName") ? " invalid" : ""}`}
                  placeholder="e.g. Emeka Okafor"
                  value={formData.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  onBlur={() => touch("fullName")}
                  autoComplete="name"
                />
                {hasError("fullName") && (
                  <div className="cr-error-msg"><IconAlert />{fieldErrors.fullName}</div>
                )}
              </div>

              {/* Gender */}
              <div className="cr-field">
                <span className="cr-label">
                  Gender <span className="cr-label-required">*</span>
                </span>
                <div className="cr-radio-group" role="radiogroup" aria-label="Gender">
                  {["Male", "Female"].map((g) => (
                    <RadioOption
                      key={g}
                      label={g}
                      value={g}
                      selected={formData.gender === g}
                      onSelect={(v) => {
                        set("gender", v);
                        touch("gender");
                        if (v !== "Female") set("isPregnantOrNursing", "");
                      }}
                    />
                  ))}
                </div>
                {hasError("gender") && (
                  <div className="cr-error-msg"><IconAlert />{fieldErrors.gender}</div>
                )}
              </div>

              {/* Phone number */}
              <div className="cr-field">
                <label className="cr-label" htmlFor="phone">
                  Phone Number <span className="cr-label-required">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`cr-input${hasError("phone") ? " invalid" : ""}`}
                  placeholder="e.g. 0803 000 0000"
                  value={formData.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => touch("phone")}
                  autoComplete="tel"
                  inputMode="tel"
                />
                {hasError("phone") && (
                  <div className="cr-error-msg"><IconAlert />{fieldErrors.phone}</div>
                )}
              </div>
            </div>

            {globalError && (
              <div className="cr-error-msg" style={{ marginTop: "1rem" }}>
                <IconAlert />{globalError}
              </div>
            )}

            <div className="cr-nav">
              <button id="next-step-1" className="cr-btn cr-btn-next" type="button" onClick={handleNext}>
                Continue <IconArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ──── Step 2: Church & Location ──── */}
        {step === 2 && (
          <div className="cr-step-panel" key="step-2">
            <h2 className="cr-step-heading">Church & Location</h2>
            <p className="cr-step-hint">Help us understand your church background and where you're travelling from.</p>

            <div className="cr-card">
              {/* Where coming from */}
              <div className="cr-field">
                <label className="cr-label" htmlFor="comingFrom">
                  Where are you coming from? <span className="cr-label-required">*</span>
                </label>
                <textarea
                  id="comingFrom"
                  className={`cr-textarea${hasError("comingFrom") ? " invalid" : ""}`}
                  placeholder="e.g. Portharcourt, Lagos, Abuja…"
                  value={formData.comingFrom}
                  onChange={(e) => set("comingFrom", e.target.value)}
                  onBlur={() => touch("comingFrom")}
                  rows={2}
                />
                {hasError("comingFrom") && (
                  <div className="cr-error-msg"><IconAlert />{fieldErrors.comingFrom}</div>
                )}
              </div>

              {/* Church membership */}
              <div className="cr-field">
                <span className="cr-label">
                  Are you a Church member (AWPW)? <span className="cr-label-required">*</span>
                </span>
                <div className="cr-radio-group" role="radiogroup" aria-label="Church membership">
                  <RadioOption
                    label="Yes — I attend AWPW"
                    value="Yes"
                    selected={formData.churchMembership === "Yes"}
                    onSelect={(v) => {
                      set("churchMembership", v);
                      touch("churchMembership");
                      set("isLeader", "");
                    }}
                  />
                  <RadioOption
                    label="No — I attend another church"
                    value="other"
                    selected={
                      formData.churchMembership === "other" ||
                      (isExternalChurch && formData.churchMembership !== "Yes")
                    }
                    onSelect={() => {
                      set("churchMembership", "other");
                      touch("churchMembership");
                    }}
                  />
                </div>

                {/* Conditional: which church? */}
                <div className={`cr-conditional${isExternalChurch ? " visible" : ""}`}>
                  <div className="cr-field">
                    <label className="cr-label" htmlFor="churchName">
                      Which church do you attend? <span className="cr-label-required">*</span>
                    </label>
                    <input
                      id="churchName"
                      type="text"
                      className="cr-input"
                      placeholder="e.g. Grace Assembly, RCCG…"
                      value={
                        formData.churchMembership !== "Yes" &&
                        formData.churchMembership !== "other"
                          ? formData.churchMembership
                          : ""
                      }
                      onChange={(e) =>
                        set("churchMembership", e.target.value || "other")
                      }
                      onBlur={() => touch("churchMembership")}
                    />
                  </div>
                </div>

                {hasError("churchMembership") && (
                  <div className="cr-error-msg"><IconAlert />{fieldErrors.churchMembership}</div>
                )}
              </div>

              {/* Conditional: are you a leader? */}
              <div className={`cr-conditional${isExternalChurch ? " visible" : ""}`}>
                <div className="cr-field">
                  <span className="cr-label">
                    Are you a leader in your church? <span className="cr-label-required">*</span>
                  </span>
                  <div className="cr-radio-group" role="radiogroup" aria-label="Church leader status">
                    {["Yes", "No"].map((opt) => (
                      <RadioOption
                        key={opt}
                        label={opt}
                        value={opt}
                        selected={formData.isLeader === opt}
                        onSelect={(v) => { set("isLeader", v); touch("isLeader"); }}
                      />
                    ))}
                  </div>
                  {hasError("isLeader") && (
                    <div className="cr-error-msg"><IconAlert />{fieldErrors.isLeader}</div>
                  )}
                </div>
              </div>

              <div className="cr-notice">
                <IconInfo />
                All are welcome — whether you're an AWPW member or visiting from another fellowship.
              </div>
            </div>

            {globalError && (
              <div className="cr-error-msg" style={{ marginTop: "1rem" }}>
                <IconAlert />{globalError}
              </div>
            )}

            <div className="cr-nav">
              <button id="back-step-2" className="cr-btn cr-btn-back" type="button" onClick={handleBack}>
                <IconArrowLeft />
              </button>
              <button id="next-step-2" className="cr-btn cr-btn-next" type="button" onClick={handleNext}>
                Continue <IconArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ──── Step 3: Health Info ──── */}
        {step === 3 && (
          <div className="cr-step-panel" key="step-3">
            <h2 className="cr-step-heading">Health Information</h2>
            <p className="cr-step-hint">This helps us ensure everyone is comfortable and cared for during the meeting.</p>

            <div className="cr-card">
              {/* Allergy / sickness */}
              <div className="cr-field">
                <label className="cr-label" htmlFor="allergyOrSickness">
                  Do you have any allergy or sickness? <span className="cr-label-required">*</span>
                </label>
                <p className="cr-field-hint">If yes, please describe it. Otherwise write "None".</p>
                <textarea
                  id="allergyOrSickness"
                  className={`cr-textarea${hasError("allergyOrSickness") ? " invalid" : ""}`}
                  placeholder='e.g. Allergic to penicillin, asthma… or "None"'
                  value={formData.allergyOrSickness}
                  onChange={(e) => set("allergyOrSickness", e.target.value)}
                  onBlur={() => touch("allergyOrSickness")}
                  rows={3}
                />
                {hasError("allergyOrSickness") && (
                  <div className="cr-error-msg"><IconAlert />{fieldErrors.allergyOrSickness}</div>
                )}
              </div>

              {/* Pregnant / nursing — only for Female */}
              {isFemale && (
                <div className="cr-field" style={{ animation: "cr-fade-up 0.28s ease both" }}>
                  <span className="cr-label">
                    Are you pregnant or a nursing mother? <span className="cr-label-required">*</span>
                  </span>
                  <div className="cr-radio-group" role="radiogroup" aria-label="Pregnancy status">
                    {["Yes", "No"].map((opt) => (
                      <RadioOption
                        key={opt}
                        label={opt}
                        value={opt}
                        selected={formData.isPregnantOrNursing === opt}
                        onSelect={(v) => { set("isPregnantOrNursing", v); touch("isPregnantOrNursing"); }}
                      />
                    ))}
                  </div>
                  {hasError("isPregnantOrNursing") && (
                    <div className="cr-error-msg"><IconAlert />{fieldErrors.isPregnantOrNursing}</div>
                  )}
                </div>
              )}

              <div className="cr-notice">
                <IconInfo />
                Your health details are confidential and used only to help the team provide the best care during the event.
              </div>
            </div>

            {globalError && (
              <div className="cr-error-msg" style={{ marginTop: "1rem" }}>
                <IconAlert />{globalError}
              </div>
            )}

            <div className="cr-nav">
              <button
                id="back-step-3"
                className="cr-btn cr-btn-back"
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <IconArrowLeft />
              </button>
              <button
                id="submit-registration"
                className="cr-btn cr-btn-submit"
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="cr-spinner" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <span>Submit Registration</span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="cr-footer">
        <p>
          <strong>BPAW Camp Meeting 2026</strong> · King David Road, Rumuokwurusi, Port Harcourt
        </p>
        <p style={{ marginTop: "0.3rem" }}>
          Call:{" "}
          <a href="tel:09132646262">0913 264 6262</a> ·{" "}
          <a href="tel:08135061115">0813 506 1115</a> ·{" "}
          <a href="https://awpwmedia.org" target="_blank" rel="noopener noreferrer">
            awpwmedia.org
          </a>
        </p>
      </footer>
    </div>
  );
}
