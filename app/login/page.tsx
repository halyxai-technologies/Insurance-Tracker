import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { BrandMark } from "@/components/BrandMark";
import { BUSINESS } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="login">
      <section className="login-hero">
        <div className="login-brand">
          <BrandMark size={44} />
          <div>
            <strong>{BUSINESS.name}</strong>
            <span>{BUSINESS.tagline}</span>
          </div>
        </div>
        <div className="login-copy">
          <p className="eyebrow gold">Private policy desk</p>
          <h1>
            Every policy, every renewal, <em>beautifully kept.</em>
          </h1>
          <p className="login-sub">Track customers, send renewal reminders on WhatsApp and print clean statements, from your phone or desk.</p>
        </div>
        <p className="login-foot">Access is restricted to the account owner.</p>
      </section>
      <section className="login-panel">
        <LoginForm />
      </section>
    </div>
  );
}
