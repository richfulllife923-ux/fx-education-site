"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 実運用ではAPI Route (app/api/contact/route.ts) 経由でメール送信 or DB保存を行う
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-lg font-bold text-navy-900">お問い合わせを受け付けました</p>
        <p className="mt-2 text-sm text-muted">内容を確認の上、必要に応じてご連絡いたします。</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-navy-900">
          お名前
        </label>
        <input id="name" name="name" required className="w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-navy-500" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-navy-900">
          メールアドレス
        </label>
        <input id="email" type="email" name="email" required className="w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-navy-500" />
      </div>
      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold text-navy-900">
          件名
        </label>
        <select id="subject" name="subject" className="w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-navy-500">
          <option>ご質問</option>
          <option>記事のリクエスト</option>
          <option>誤り・修正のご指摘</option>
          <option>その他</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-navy-900">
          お問い合わせ内容
        </label>
        <textarea id="message" name="message" rows={6} required className="w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-navy-500" />
      </div>
      <button type="submit" className="btn-gold w-full sm:w-auto">
        送信する <Send size={16} />
      </button>
    </form>
  );
}
