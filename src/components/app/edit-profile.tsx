"use client";

import { useRef, useState } from "react";
import { RiCameraLine, RiCloseLine, RiImageAddLine } from "@remixicon/react";
import { Avatar } from "@/components/ui/avatar";
import { CropDialog } from "@/components/ui/crop-dialog";
import { useAuth, type VoyzenUser } from "@/lib/auth-context";
import { useT } from "@/lib/settings-context";

const BIO_LIMIT = 240;

/** Edit name, bio, location, website, avatar and cover in one sheet. */
export function EditProfileDialog({
  user,
  onClose,
}: {
  user: VoyzenUser;
  onClose: () => void;
}) {
  const { updateUser } = useAuth();
  const t = useT();

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");
  const [avatar, setAvatar] = useState(user.avatar);
  const [banner, setBanner] = useState(user.banner);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  // The picked file, shown in the crop dialog until the user confirms.
  const [cropping, setCropping] = useState<{ src: string; field: "avatar" | "banner" } | null>(null);

  const pick = (file: File | undefined, field: "avatar" | "banner") => {
    if (!file) return;
    setCropping({ src: URL.createObjectURL(file), field });
  };

  const save = () => {
    updateUser({
      name: name.trim() || user.name,
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      avatar,
      banner,
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[55] flex items-end justify-center sm:items-center">
      <button
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("editProfile")}
        className="relative flex max-h-[92%] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-float animate-pop-in sm:m-4 sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <h2 className="flex-1 text-base font-semibold text-ink">{t("editProfile")}</h2>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-3"
          >
            <RiCloseLine className="size-5" />
          </button>
        </div>

        <div className="scroll-clean min-h-0 flex-1 overflow-y-auto">
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pick(e.target.files?.[0], "avatar")}
          />
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pick(e.target.files?.[0], "banner")}
          />

          {/* Cover + avatar */}
          <div className="relative h-32 w-full bg-gradient-to-br from-accent to-accent-strong">
            {banner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt="" className="size-full object-cover" />
            )}
            <button
              onClick={() => bannerInput.current?.click()}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black/60"
            >
              <RiImageAddLine className="size-4" />
              {t("cover")}
            </button>
          </div>

          <div className="px-4">
            <button
              onClick={() => avatarInput.current?.click()}
              aria-label={t("changePhoto")}
              className="group relative -mt-10 inline-flex rounded-full border-4 border-surface"
            >
              <Avatar src={avatar} name={name} size={80} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
                <RiCameraLine className="size-6 text-white" />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-accent text-white">
                <RiCameraLine className="size-3.5" />
              </span>
            </button>

            <div className="mt-4 flex flex-col gap-4 pb-4">
              <Field label={t("name")} value={name} onChange={setName} />

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-medium text-ink" htmlFor="bio">
                    {t("bio")}
                  </label>
                  <span className="text-xs text-faint">
                    {bio.length}/{BIO_LIMIT}
                  </span>
                </div>
                <textarea
                  id="bio"
                  value={bio}
                  maxLength={BIO_LIMIT}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder={t("bioPlaceholder")}
                  className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <Field label={t("location")} value={location} onChange={setLocation} placeholder="Los Angeles, CA" />
              <Field label={t("website")} value={website} onChange={setWebsite} placeholder="voyzen.app" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-line bg-surface text-sm font-medium text-ink transition hover:bg-surface-3"
          >
            {t("cancel")}
          </button>
          <button
            onClick={save}
            className="h-11 flex-1 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            {t("save")}
          </button>
        </div>
      </div>

      {cropping && (
        <CropDialog
          src={cropping.src}
          shape={cropping.field === "avatar" ? "avatar" : "cover"}
          onCancel={() => setCropping(null)}
          onApply={(dataUrl) => {
            if (cropping.field === "avatar") setAvatar(dataUrl);
            else setBanner(dataUrl);
            setCropping(null);
          }}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink outline-none transition placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}
