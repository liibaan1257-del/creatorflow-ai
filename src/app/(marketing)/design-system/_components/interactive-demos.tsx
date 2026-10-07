"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
        Confirm action
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Rename project"
        description="Give your project a name you'll recognise later."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <Input label="Project name" name="demo-project-name" placeholder="Spring launch campaign" />
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        title="Delete draft?"
        description="This can't be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(false)}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

export function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() => toast({ title: "Draft saved", description: "Your changes are safe.", variant: "success" })}
      >
        Success toast
      </Button>
      <Button
        variant="outline"
        onClick={() => toast({ title: "Heads up", description: "This is an informational message." })}
      >
        Info toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: "Couldn't save", description: "Check your connection and try again.", variant: "error" })
        }
      >
        Error toast
      </Button>
    </div>
  );
}

export function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      loading={loading}
      onClick={() => {
        setLoading(true);
        window.setTimeout(() => setLoading(false), 1500);
      }}
    >
      {loading ? "Generating…" : "Click to load"}
    </Button>
  );
}
