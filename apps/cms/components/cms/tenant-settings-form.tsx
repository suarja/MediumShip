"use client";

import { useMutation } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  ENABLED_MODULES,
  type FeedSectionConfig,
} from "../../../../src/features/tenant/public-config";
import { themePaletteNames } from "../../../../src/features/theme/palette-catalog";

type TenantSettingsFormProps = {
  tenant: Doc<"tenants"> | { themeConfig?: { paletteName: string }; enabledModules: string[]; feedSections?: FeedSectionConfig[] };
};

export function TenantSettingsForm({ tenant }: TenantSettingsFormProps) {
  const updateTenantSettings = useMutation(api.cms.mutations.updateTenantSettings);
  const [paletteName, setPaletteName] = useState(
    tenant.themeConfig?.paletteName ?? "brick",
  );
  const [enabledModules, setEnabledModules] = useState<string[]>(
    tenant.enabledModules,
  );
  const [feedSections, setFeedSections] = useState<FeedSectionConfig[]>(
    tenant.feedSections ?? [],
  );
  const [saveLabel, setSaveLabel] = useState("Save settings");

  useEffect(() => {
    setPaletteName(tenant.themeConfig?.paletteName ?? "brick");
    setEnabledModules(tenant.enabledModules);
    setFeedSections(tenant.feedSections ?? []);
    setSaveLabel("Save settings");
  }, [tenant]);

  const toggleModule = (module: string) => {
    setEnabledModules((current) =>
      current.includes(module)
        ? current.filter((value) => value !== module)
        : [...current, module],
    );
    setSaveLabel("Save settings");
  };

  const updateSection = (index: number, patch: Partial<FeedSectionConfig>) => {
    setFeedSections((current) =>
      current.map((section, currentIndex) =>
        currentIndex === index ? { ...section, ...patch } : section,
      ),
    );
    setSaveLabel("Save settings");
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setFeedSections((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [section] = next.splice(index, 1);
      next.splice(nextIndex, 0, section);
      return next;
    });
    setSaveLabel("Save settings");
  };

  const addSection = () => {
    setFeedSections((current) => [...current, { kind: "article", title: "New section" }]);
    setSaveLabel("Save settings");
  };

  const removeSection = (index: number) => {
    setFeedSections((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setSaveLabel("Save settings");
  };

  const save = async () => {
    await updateTenantSettings({
      paletteName,
      enabledModules,
      feedSections,
    });
    setSaveLabel("Saved");
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Tenant config</p>
          <h2>Mobile-facing settings</h2>
        </div>
      </div>

      <div className="settings-stack">
        <label>
          <span>Palette</span>
          <select value={paletteName} onChange={(event) => setPaletteName(event.currentTarget.value)}>
            {themePaletteNames.map((palette) => (
              <option key={palette} value={palette}>
                {palette}
              </option>
            ))}
          </select>
        </label>

        <div className="module-grid">
          {ENABLED_MODULES.map((module) => (
            <label className="checkbox-row" key={module}>
              <input
                checked={enabledModules.includes(module)}
                onChange={() => toggleModule(module)}
                type="checkbox"
              />
              <span>{module}</span>
            </label>
          ))}
        </div>

        <div className="settings-sections">
          <div className="section-row-head">
            <strong>Feed sections</strong>
            <button className="ghost-button" onClick={addSection} type="button">
              Add section
            </button>
          </div>
          {feedSections.map((section, index) => (
            <div className="section-row" key={`${section.kind}-${index}`}>
              <select
                value={section.kind}
                onChange={(event) =>
                  updateSection(index, {
                    kind: event.currentTarget.value as FeedSectionConfig["kind"],
                  })
                }
              >
                <option value="article">article</option>
                <option value="episode">episode</option>
                <option value="video">video</option>
              </select>
              <input
                value={section.title}
                onChange={(event) =>
                  updateSection(index, { title: event.currentTarget.value })
                }
              />
              <button className="ghost-button" onClick={() => moveSection(index, -1)} type="button">
                ↑
              </button>
              <button className="ghost-button" onClick={() => moveSection(index, 1)} type="button">
                ↓
              </button>
              <button className="ghost-button danger-button" onClick={() => removeSection(index)} type="button">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-footer">
        <button className="primary-button" onClick={save} type="button">
          {saveLabel}
        </button>
      </div>
    </section>
  );
}
