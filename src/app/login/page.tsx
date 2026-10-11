"use client";

import { useTransition, useState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.erro) {
        setErro(res.erro);
      }
    });
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
        <div className="text-center mb-8">
          <span className="text-5xl">🎂</span>
          <h1 className="text-2xl font-bold text-amber-950 mt-3">Sistema da Bolaria</h1>
          <p className="text-sm text-stone-600 mt-1">
            Gestão simples e rápida de bolos, vendas e caixa
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              required
              defaultValue="dona@bolaria.com"
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-900 outline-none transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1">
              Senha
            </label>
            <input
              type="password"
              name="senha"
              required
              defaultValue="bolo1234"
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-900 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {isPending ? "Entrando..." : "Entrar no Sistema"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-stone-600 border-t pt-4">
          Acesso padrão configurado: <br />
          <strong>dona@bolaria.com</strong> / senha: <strong>bolo1234</strong>
        </div>
      </div>
    </div>
  );
}
