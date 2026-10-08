"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LockIcon, LogOutIcon, TrashIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/select";
import { logout } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/features/auth/validation";
import { changePassword, deleteAccount, logoutEverywhere, updatePreferences } from "@/features/settings/actions";
import { DELETE_CONFIRMATION, initialSettingsState } from "@/features/settings/validation";
import { LANGUAGES, TONES } from "@/features/writer/config";

// ------------------------------------------------------------------ preferences

export function PreferencesForm({ tone, language }: { tone: string | null; language: string | null }) {
  const [state, action, pending] = useActionState(updatePreferences, initialSettingsState);
  const [values, setValues] = useState({ tone: tone ?? "", language: language ?? "" });
  const [saved, setSaved] = useState(values);
  const [seenSavedAt, setSeenSavedAt] = useState(state.savedAt);
  if (state.savedAt !== seenSavedAt) {
    setSeenSavedAt(state.savedAt);
    setSaved(values);
  }
  const unchanged = values.tone === saved.tone && values.language === saved.language;

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Default tone"
          name="defaultTone"
          value={values.tone}
          onChange={(event) => setValues((v) => ({ ...v, tone: event.target.value }))}
          options={[{ value: "", label: "Professional (app default)" }, ...TONES]}
          error={state.fieldErrors?.defaultTone}
        />
        <Select
          label="Default language"
          name="defaultLanguage"
          value={values.language}
          onChange={(event) => setValues((v) => ({ ...v, language: event.target.value }))}
          options={[{ value: "", label: "English (app default)" }, ...LANGUAGES]}
          error={state.fieldErrors?.defaultLanguage}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Used when you open the AI Writer. Templates can still set their own tone.
      </p>
      <FormStatus state={unchanged || pending ? state : {}} />
      <Button type="submit" loading={pending} disabled={unchanged}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------ password

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialSettingsState);

  return (
    // key: a successful change clears the fields.
    <form key={state.savedAt ?? 0} action={action} className="space-y-4" noValidate>
      <Input
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          error={state.fieldErrors?.password}
        />
        <Input
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={state.fieldErrors?.confirmPassword}
        />
      </div>
      <FormStatus state={state} />
      <Button type="submit" loading={pending}>
        <LockIcon />
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------ sessions

export function SessionActions() {
  const [pending, setPending] = useState<"one" | "all" | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <form action={logout} onSubmit={() => setPending("one")}>
        <Button type="submit" variant="outline" loading={pending === "one"} disabled={pending !== null}>
          <LogOutIcon />
          Log out
        </Button>
      </form>
      <form action={logoutEverywhere} onSubmit={() => setPending("all")}>
        <Button type="submit" variant="ghost" loading={pending === "all"} disabled={pending !== null}>
          Log out of all devices
        </Button>
      </form>
    </div>
  );
}

// ------------------------------------------------------------------ delete

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, initialSettingsState);
  const [confirmation, setConfirmation] = useState("");

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        <TrashIcon />
        Delete account
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title="Delete your account?"
        description="This permanently deletes your profile, projects, generations, images and credits. It can't be undone."
      >
        <form action={action} className="space-y-4" noValidate>
          <Alert variant="warning">Download anything you want to keep before continuing.</Alert>
          <Input
            label="Your password"
            id="delete-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            error={state.fieldErrors?.currentPassword}
          />
          <Input
            label={`Type ${DELETE_CONFIRMATION} to confirm`}
            id="delete-confirmation"
            name="confirmation"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            error={state.fieldErrors?.confirmation}
          />
          <FormStatus state={state} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              loading={pending}
              disabled={confirmation.trim() !== DELETE_CONFIRMATION}
            >
              {pending ? "Deleting…" : "Delete my account"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
