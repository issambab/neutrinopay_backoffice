"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Le mot de passe actuel est requis." }),
    newPassword: z
      .string()
      .min(8, { message: "Le nouveau mot de passe doit contenir au moins 8 caracteres." })
      .regex(/[a-z]/, { message: "Ajoutez au moins une lettre minuscule." })
      .regex(/[A-Z]/, { message: "Ajoutez au moins une lettre majuscule." })
      .regex(/[0-9]/, { message: "Ajoutez au moins un chiffre." }),
    confirmPassword: z.string().min(1, { message: "Confirmez le nouveau mot de passe." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export function ChangePasswordForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });

    const result = (await response.json().catch(() => null)) as { message?: string; redirectTo?: string } | null;

    if (!response.ok) {
      toast.error(result?.message ?? "Impossible de changer le mot de passe.");
      return;
    }

    toast.success("Mot de passe modifie.");
    router.replace(result?.redirectTo ?? "/dashboard/default");
    router.refresh();
  };

  return (
    <Card>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FieldGroup className="gap-4">
            <PasswordField control={form.control} name="currentPassword" label="Mot de passe temporaire" />
            <PasswordField control={form.control} name="newPassword" label="Nouveau mot de passe" />
            <PasswordField control={form.control} name="confirmPassword" label="Confirmer le mot de passe" />
          </FieldGroup>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordField({
  control,
  label,
  name,
}: {
  control: ReturnType<typeof useForm<z.infer<typeof formSchema>>>["control"];
  label: string;
  name: "confirmPassword" | "currentPassword" | "newPassword";
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input {...field} id={name} type="password" autoComplete="new-password" aria-invalid={fieldState.invalid} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
