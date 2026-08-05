"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const formSchema = z
  .object({
    acceptTerms: z.boolean().refine(Boolean, { message: "Vous devez accepter les conditions." }),
    confirmPassword: z.string().min(8, { message: "La confirmation doit contenir au moins 8 caracteres." }),
    email: z.string().email({ message: "Entrez une adresse email valide." }),
    fullName: z.string().min(2, { message: "Le nom complet est requis." }),
    password: z
      .string()
      .min(8, { message: "Le mot de passe doit contenir au moins 8 caracteres." })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.",
      }),
    phoneNumber: z.string().min(6, { message: "Le telephone est requis." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      acceptTerms: false,
      confirmPassword: "",
      email: "",
      fullName: "",
      password: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await fetch("/api/accounts/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        acceptTerms: data.acceptTerms,
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        phoneNumber: data.phoneNumber,
      }),
    });

    const result = (await response.json().catch(() => null)) as { message?: string; verifyEmail?: string } | null;

    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de creer le compte.");
      return;
    }

    toast.success("Compte cree. Verifiez votre email.");
    router.replace(`/auth/verify-email?identifier=${encodeURIComponent(result?.verifyEmail ?? data.email)}`);
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-full-name">Nom complet</FieldLabel>
              <Input
                {...field}
                id="register-full-name"
                placeholder="Issam Ben Ali"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email">Email</FieldLabel>
              <Input
                {...field}
                id="register-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="phoneNumber"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-phone">Telephone</FieldLabel>
              <Input
                {...field}
                id="register-phone"
                type="tel"
                placeholder="+21650000001"
                autoComplete="tel"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-password">Mot de passe</FieldLabel>
              <Input
                {...field}
                id="register-password"
                type="password"
                placeholder="********"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-confirm-password">Confirmer le mot de passe</FieldLabel>
              <Input
                {...field}
                id="register-confirm-password"
                type="password"
                placeholder="********"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="register-terms"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-invalid={fieldState.invalid}
              />
              <FieldContent>
                <FieldLabel htmlFor="register-terms" className="font-normal">
                  J'accepte les conditions d'utilisation et la politique de confidentialite.
                </FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creation..." : "Creer mon compte"}
      </Button>
    </form>
  );
}
