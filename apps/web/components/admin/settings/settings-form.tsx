"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast, Button, FormField, Input } from "@nextpress/ui";
import type { SettingGroup, SettingsMap } from "@nextpress/core/settings/settings-types";

interface Props {
  group: SettingGroup;
  values: SettingsMap;
}

/**
 * Dynamic settings form — renders fields based on SettingGroup.fields.
 * Supports: text, textarea, number, boolean, select, url, email, color.
 * Works for both core groups and plugin-registered groups.
 */
export function SettingsForm({ group, values }: Props) {
  const [formValues, setFormValues] = useState<SettingsMap>({ ...values });
  const { toast } = useToast();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => toast("success", "Settings saved"),
    onError: (e) => toast("error", e.message),
  });

  function setValue(key: string, value: unknown) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      group: group.slug,
      values: formValues,
    });
  }

  return (
    <div className="bg-white rounded-lg border p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{group.name}</h2>
        {group.description && (
          <p className="text-sm text-gray-500 mt-1">{group.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {group.fields.map((field) => (
          <FormField
            key={field.key}
            label={field.label}
            htmlFor={field.key}
            description={field.description}
          >
            {field.type === "boolean" ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={field.key}
                  checked={!!formValues[field.key]}
                  onChange={(e) => setValue(field.key, e.target.checked)}
                />
                <span className="text-sm">{field.label}</span>
              </label>
            ) : field.type === "select" ? (
              <select
                id={field.key}
                value={String(formValues[field.key] ?? field.defaultValue ?? "")}
                onChange={(e) => setValue(field.key, e.target.value)}
                className="np-input w-full"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                id={field.key}
                value={String(formValues[field.key] ?? "")}
                onChange={(e) => setValue(field.key, e.target.value)}
                rows={3}
                className="np-input w-full"
              />
            ) : field.type === "number" ? (
              <input
                type="number"
                id={field.key}
                value={Number(formValues[field.key] ?? field.defaultValue ?? 0)}
                onChange={(e) => setValue(field.key, parseInt(e.target.value, 10))}
                min={field.validation?.min}
                max={field.validation?.max}
                className="np-input w-32"
              />
            ) : (
              <input
                type={field.type === "url" ? "url" : field.type === "email" ? "email" : field.type === "color" ? "color" : "text"}
                id={field.key}
                value={String(formValues[field.key] ?? "")}
                onChange={(e) => setValue(field.key, e.target.value)}
                className={field.type === "color" ? "w-16 h-10" : "np-input w-full"}
              />
            )}
          </FormField>
        ))}
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
        loading={updateMutation.isPending}
      >
        Save Settings
      </Button>
    </div>
  );
}
