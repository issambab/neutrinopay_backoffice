import { ChangePasswordForm } from "./change-password-form";

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="font-semibold text-2xl tracking-tight">Changer le mot de passe</h1>
          <p className="text-muted-foreground text-sm">
            Votre mot de passe temporaire doit etre remplace avant d'acceder a votre espace.
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
