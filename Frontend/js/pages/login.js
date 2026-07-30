import { el, mount } from "../dom.js";
import { button } from "../components/button.js";
import { textField } from "../components/field.js";
import { redirectIfAuthenticated, requestOtp, resendOtp, verifyOtp, getPendingEmail } from "../auth.js";
import { ApiError } from "../api.js";

redirectIfAuthenticated();

const root = document.getElementById("auth-root");

function authShell(subtitle, formEl) {
  return el("div", { class: "auth-page" }, [
    el("div", { class: "auth-brand" }, ["amazon", el("span", { style: { color: "var(--accent)", transform: "translateY(-6px)", display: "inline-block" } }, ["⌣"])]),
    el("div", { class: "auth-card" }, [
      el("div", { class: "auth-title" }, [el("h1", {}, ["Sign in to Grassroots CRM"]), el("p", {}, [subtitle])]),
      formEl,
    ]),
    el("p", { class: "auth-footer" }, ["Powered by ", el("span", { class: "brand-red" }, ["Grassroots"]), " © 2026"]),
  ]);
}

function renderEmailStep() {
  let loading = false;
  const emailField = textField({ label: "Email address", type: "email", required: true, autofocus: true, placeholder: "you@grassrootsbpo.in" });
  const errorEl = el("p", { class: "auth-error hidden" });
  const submitBtn = button({ label: "Continue", type: "submit" });
  submitBtn.style.width = "100%";
  submitBtn.style.marginTop = "4px";

  const form = el(
    "form",
    {
      class: "auth-form",
      onSubmit: async (e) => {
        e.preventDefault();
        if (loading) return;
        const email = emailField.input.value.trim();
        if (!email) return;
        loading = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "Checking…";
        errorEl.classList.add("hidden");
        try {
          await requestOtp(email);
          renderOtpStep();
        } catch (err) {
          errorEl.textContent =
            err instanceof ApiError && err.status === 404
              ? "We couldn't find an account with that email address."
              : "Something went wrong. Please try again.";
          errorEl.classList.remove("hidden");
        } finally {
          loading = false;
          submitBtn.disabled = false;
          submitBtn.textContent = "Continue";
        }
      },
    },
    [emailField, errorEl, submitBtn],
  );

  mount(root, authShell("Enter your work email to continue", form));
}

function renderOtpStep() {
  const email = getPendingEmail();
  const length = 6;
  const boxes = Array.from({ length }, (_, i) =>
    el("input", {
      class: "otp-box",
      inputmode: "numeric",
      maxlength: "1",
      autofocus: i === 0,
      oninput: (e) => {
        const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
        e.target.value = v;
        if (v && i < length - 1) boxes[i + 1].focus();
        updateSubmitState();
      },
      onkeydown: (e) => {
        if (e.key === "Backspace" && !e.target.value && i > 0) boxes[i - 1].focus();
      },
    }),
  );

  const errorEl = el("p", { class: "auth-error hidden" });
  const submitBtn = button({ label: "Verify & sign in", type: "submit", disabled: true });
  submitBtn.style.width = "100%";

  function updateSubmitState() {
    submitBtn.disabled = boxes.some((b) => !b.value);
  }

  const resendLink = el("button", { type: "button", class: "link-brand" }, ["Resend code"]);
  resendLink.addEventListener("click", async () => {
    await resendOtp();
    resendLink.textContent = "Code resent";
    setTimeout(() => (resendLink.textContent = "Resend code"), 3000);
  });

  const changeEmailLink = el("button", { type: "button", class: "link-muted" }, ["Change email"]);
  changeEmailLink.addEventListener("click", renderEmailStep);

  const form = el(
    "form",
    {
      class: "auth-form",
      onSubmit: async (e) => {
        e.preventDefault();
        const otp = boxes.map((b) => b.value).join("");
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying…";
        errorEl.classList.add("hidden");
        try {
          await verifyOtp(email, otp);
          window.location.href = "/index.html";
        } catch (err) {
          errorEl.textContent = err instanceof ApiError && err.status === 401 ? "Incorrect code. Please try again." : "Something went wrong. Please try again.";
          errorEl.classList.remove("hidden");
          submitBtn.disabled = false;
          submitBtn.textContent = "Verify & sign in";
        }
      },
    },
    [
      el("div", { class: "otp-row" }, boxes),
      errorEl,
      submitBtn,
      el("div", { class: "auth-links" }, [changeEmailLink, resendLink]),
    ],
  );

  mount(root, authShell(`We sent a 6-digit code to ${email ?? ""}`, form));
}

if (getPendingEmail()) {
  renderOtpStep();
} else {
  renderEmailStep();
}
