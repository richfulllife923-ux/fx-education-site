"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-lg font-bold text-text-primary">お問い合わせを受け付けました</p>
        <p className="mt-2 text-sm text-text-secondary">内容を確認し、必要に応じてご連絡します。</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-text-primary">
          お名前
        </label>
        <input id="name" name="name" required className="w-full rounded-button border border-border bg-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-text-primary">
          メールアドレス
        </label>
        <input id="email" type="email" name="email" required className="w-full rounded-button border border-border bg-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary" />
      </div>
      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold text-text-primary">
          件名
        </label>
        <select id="subject" name="subject" className="w-full rounded-button border border-border bg-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary">
          <option>質問</option>
          <option>記事について</option>
          <option>開発状況について</option>
          <option>その他</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-text-primary">
          内容
        </label>
        <textarea id="message" name="message" rows={6} required className="w-full rounded-button border border-border bg-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary" />
      </div>
      <button type="submit" className="btn-primary w-full sm:w-auto">
        送信する <Send size={16} strokeWidth={1.8} />
      </button>
    </form>
  );
}
