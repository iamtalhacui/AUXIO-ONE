"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";

export function SettingsPageContent() {
  const { toast } = useToast();
  const { data, isLoading, error } = useGetPlatformSettingsQuery();
  const [updateSettings, { isLoading: isSaving, error: saveError, reset }] =
    useUpdatePlatformSettingsMutation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (data) setMaintenanceMode(data.maintenanceMode);
  }, [data]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();

    try {
      await updateSettings({ maintenanceMode }).unwrap();
      toast({
        variant: maintenanceMode ? "warning" : "success",
        title: maintenanceMode ? "Maintenance mode is on" : "Maintenance mode is off",
        description: maintenanceMode
          ? "Organisation logins are blocked."
          : "Organisation logins are allowed.",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not save platform settings",
        description: getErrorMessage(err, "Could not save platform settings."),
      });
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load platform settings.")}
      </p>
    );
  }

  const errorMessage = saveError
    ? getErrorMessage(saveError, "Could not save platform settings.")
    : null;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Maintenance</h2>
        <p className="mt-1 text-sm text-muted">
          When this is on, organisation users cannot sign in. Super Admin stays available.
        </p>

        <label className="mt-6 flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4">
          <span>
            <span className="block text-sm font-medium">Maintenance mode</span>
            <span className="text-xs text-muted">Blocks all organisation logins</span>
          </span>
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(event) => setMaintenanceMode(event.target.checked)}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
          />
        </label>
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}


      <div className="dashboard-card flex flex-wrap gap-3 p-6">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-70"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
