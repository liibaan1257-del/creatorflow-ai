"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import { FULL_NAME_MAX_LENGTH } from "@/features/auth/validation";
import { FormStatus } from "@/features/auth/components/form-status";
import { changeEmail, removeAvatar, updateAvatar, updateProfile } from "@/features/settings/actions";
import { AVATAR_LIMITS, initialSettingsState } from "@/features/settings/validation";

// ------------------------------------------------------------------ avatar

/** Center-crops and downsizes in the browser so uploads stay small and fast. */
async function resizeToSquare(file: File, size: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const target = Math.min(size, side);
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no canvas");
    context.drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      target,
      target,
    );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) throw new Error("encode failed");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarField({ src, initials, hasAvatar }: { src: string | null; initials: string; hasAvatar: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, upload, uploading] = useActionState(updateAvatar, initialSettingsState);
  const [removeState, remove, removing] = useActionState(removeAvatar, initialSettingsState);
  const [preparing, startPreparing] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"upload" | "remove" | null>(null);

  function onFile(file: File | undefined) {
    setClientError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setClientError("Choose an image file.");
    if (file.size > 20 * 1024 * 1024) return setClientError("Images must be 20 MB or smaller.");
    startPreparing(async () => {
      try {
        const blob = await resizeToSquare(file, AVATAR_LIMITS.uploadSize);
        const formData = new FormData();
        formData.set("avatar", new File([blob], "avatar.jpg", { type: blob.type }));
        setLastAction("upload");
        // Dispatch inside a transition again: the await above ended the first one.
        startPreparing(() => upload(formData));
      } catch {
        setClientError("That image couldn't be read. Try a JPEG or PNG.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  const busy = preparing || uploading || removing;
  const state = lastAction === "remove" ? removeState : uploadState;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar fallback={initials} src={src} size="lg" alt="Your profile photo" className="size-16 text-lg" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id="avatar-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => onFile(event.target.files?.[0])}
            disabled={busy}
          />
          <Button type="button" variant="outline" size="sm" loading={preparing || uploading} disabled={busy} onClick={() => inputRef.current?.click()}>
            <UploadIcon />
            {hasAvatar ? "Change photo" : "Upload photo"}
          </Button>
          {hasAvatar ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={removing}
              disabled={busy}
              onClick={() => {
                setClientError(null);
                setLastAction("remove");
                startPreparing(() => remove());
              }}
            >
              <TrashIcon />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPEG, PNG or WebP. Cropped to a square; photo metadata is removed.</p>
      {clientError ? <Alert variant="error">{clientError}</Alert> : <FormStatus state={state} />}
    </div>
  );
}

// ------------------------------------------------------------------ name

export function ProfileForm({ fullName }: { fullName: string | null }) {
  const [state, action, pending] = useActionState(updateProfile, initialSettingsState);
  const [value, setValue] = useState(fullName ?? "");
  const [saved, setSaved] = useState(fullName ?? "");
  const [seenSavedAt, setSeenSavedAt] = useState(state.savedAt);
  if (state.savedAt !== seenSavedAt) {
    setSeenSavedAt(state.savedAt);
    setSaved(value.trim().replace(/\s+/g, " "));
  }
  const unchanged = value.trim().replace(/\s+/g, " ") === saved;

  return (
    <form action={action} className="space-y-4" noValidate>
      <Input
        label="Full name"
        name="fullName"
        autoComplete="name"
        required
        maxLength={FULL_NAME_MAX_LENGTH}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={state.fieldErrors?.fullName}
      />
      <FormStatus state={unchanged || pending ? state : {}} />
      <Button type="submit" loading={pending} disabled={unchanged}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------ email

export function EmailForm({ email, pendingEmail }: { email: string | null; pendingEmail: string | null }) {
  const [state, action, pending] = useActionState(changeEmail, initialSettingsState);
  const [open, setOpen] = useState(false);
  // Controlled, so the address survives a failed attempt (forms reset after submit).
  const [newEmail, setNewEmail] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Email</p>
          <p className="truncate text-sm text-muted-foreground" id="current-email">
            {email ?? "—"}
          </p>
        </div>
        {!open ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <MailIcon />
            Change email
          </Button>
        ) : null}
      </div>

      {pendingEmail && !state.message ? (
        <Alert variant="info">
          Waiting for you to confirm <span className="font-medium break-all">{pendingEmail}</span>. Check that inbox
          (and your current one) for the confirmation link.
        </Alert>
      ) : null}

      {open ? (
        state.message ? (
          <FormStatus state={state} />
        ) : (
          <form action={action} className="space-y-4 rounded-lg border border-border p-4" noValidate>
            <Input
              label="New email"
              id="new-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              error={state.fieldErrors?.email}
            />
            <Input
              label="Current password"
              id="email-current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              hint="For your security, confirm it's you."
              error={state.fieldErrors?.currentPassword}
            />
            <FormStatus state={state} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={pending}>
                {pending ? "Sending…" : "Send confirmation"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
            </div>
          </form>
        )
      ) : null}
    </div>
  );
}
