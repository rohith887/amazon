import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";
import { TextField } from "../components/ui/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";
import { getPendingEmail, requestOtp, resendOtp, verifyOtp } from "../api/auth.js";
import "../styles/auth.css";

function AuthShell({ subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        amazon
        <span style={{ color: "var(--accent)", transform: "translateY(-6px)", display: "inline-block" }}>⌣</span>
      </div>
      <div className="auth-card">
        <div className="auth-title">
          <h1>Sign in to Grassroots CRM</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
      <p className="auth-footer">
        Powered by <span className="brand-red">Grassroots</span> © 2026
      </p>
    </div>
  );
}

const OTP_LENGTH = 6;

export default function LoginPage() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  const [step, setStep] = useState(() => (getPendingEmail() ? "otp" : "email"));
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLabel, setResendLabel] = useState("Resend code");

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleEmailSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value || loading) return;
    setLoading(true);
    setError("");
    try {
      await requestOtp(value);
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "We couldn't find an account with that email address."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    const code = otp.join("");
    setLoading(true);
    setError("");
    try {
      const data = await verifyOtp(getPendingEmail(), code);
      signIn(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Incorrect code. Please try again." : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendOtp();
      setResendLabel("Code resent");
      setTimeout(() => setResendLabel("Resend code"), 3000);
    } catch {
      setResendLabel("Failed to resend");
      setTimeout(() => setResendLabel("Resend code"), 3000);
    }
  }

  function handleOtpChange(index, raw) {
    const clean = raw.replace(/[^0-9]/g, "").slice(0, 1);
    setOtp((prev) => prev.map((v, i) => (i === index ? clean : v)));
    if (clean && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(e, index) {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  const otpComplete = otp.every(Boolean);

  if (step === "otp") {
    return (
      <AuthShell subtitle={`We sent a 6-digit code to ${getPendingEmail() ?? ""}`}>
        <form className="auth-form" onSubmit={handleOtpSubmit}>
          <div className="otp-row">
            {otp.map((value, i) => (
              <input
                key={i}
                ref={(node) => (otpRefs.current[i] = node)}
                className="otp-box"
                inputMode="numeric"
                maxLength="1"
                value={value}
                autoFocus={i === 0}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(e, i)}
              />
            ))}
          </div>
          {error ? <p className="auth-error">{error}</p> : null}
          <Button label={loading ? "Verifying…" : "Verify & sign in"} type="submit" disabled={!otpComplete || loading} style={{ width: "100%" }} />
          <div className="auth-links">
            <button type="button" className="link-muted" onClick={() => setStep("email")}>
              Change email
            </button>
            <button type="button" className="link-brand" onClick={handleResend}>
              {resendLabel}
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Enter your work email to continue">
      <form className="auth-form" onSubmit={handleEmailSubmit}>
        <TextField label="Email address" type="email" required autoFocus placeholder="you@grassrootsbpo.in" value={email} onChange={setEmail} />
        {error ? <p className="auth-error">{error}</p> : null}
        <Button label={loading ? "Checking…" : "Continue"} type="submit" disabled={loading} style={{ width: "100%", marginTop: "4px" }} />
      </form>
    </AuthShell>
  );
}
