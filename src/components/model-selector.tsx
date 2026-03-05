"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Cpu, User, HardDrive, Globe, Check } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { COUNTRIES, POPULAR_CODES, COUNTRY_BY_CODE } from "@/lib/countries";

const MODELS = [
  { value: "bu-mini", label: "BU Mini" },
  { value: "bu-max", label: "BU Max" },
];

/* ------------------------------------------------------------------ */
/*  IconDropdown                                                       */
/* ------------------------------------------------------------------ */

interface DropdownItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface IconDropdownProps {
  icon: ReactNode;
  title: string;
  activeColor: string; // e.g. "amber" | "green" | "purple" | "blue"
  isActive: boolean;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function IconDropdown({
  icon,
  title,
  activeColor,
  isActive,
  children,
  open,
  onToggle,
  onClose,
}: IconDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const colorMap: Record<string, { bg: string; text: string }> = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
    green: { bg: "bg-green-500/10", text: "text-green-400" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
  };

  const colors = colorMap[activeColor] ?? colorMap.amber;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        title={title}
        className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
          isActive
            ? `${colors.bg} ${colors.text} border-transparent`
            : "bg-transparent hover:bg-zinc-800 text-zinc-500 border-zinc-700"
        }`}
      >
        {icon}
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 right-0 w-[200px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 flex flex-col max-h-[320px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownRow({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-800 flex items-center gap-2 ${
        selected ? "text-white font-medium" : "text-zinc-400"
      }`}
    >
      {icon && <span className="w-4 flex-shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {selected && <Check size={12} className="text-zinc-400 flex-shrink-0" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  ProxyDropdown                                                      */
/* ------------------------------------------------------------------ */

function ProxyDropdown({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const { proxyCountryCode, setProxyCountryCode } = useSettings();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const popular = COUNTRIES.filter((c) => POPULAR_CODES.has(c.code));
  const others = COUNTRIES.filter((c) => !POPULAR_CODES.has(c.code));

  const lowerSearch = search.toLowerCase();
  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.code.includes(lowerSearch),
      )
    : null;

  const selectCountry = useCallback(
    (code: string) => {
      setProxyCountryCode(code);
      onClose();
      setSearch("");
    },
    [setProxyCountryCode, onClose],
  );

  const current = COUNTRY_BY_CODE.get(proxyCountryCode);
  const title = current ? `Proxy: ${current.name}` : "Proxy";

  return (
    <IconDropdown
      icon={<Globe size={16} />}
      title={title}
      activeColor="blue"
      isActive={!!proxyCountryCode}
      open={open}
      onToggle={onToggle}
      onClose={onClose}
    >
      <div className="p-2 border-b border-zinc-800">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search countries…"
          className="w-full bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1.5 outline-none placeholder-zinc-500"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {!filtered && (
          <DropdownRow
            label="No proxy"
            selected={!proxyCountryCode}
            onSelect={() => selectCountry("")}
          />
        )}
        {filtered ? (
          filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-zinc-500 text-center">
              No results
            </div>
          ) : (
            filtered.map((c) => (
              <DropdownRow
                key={c.code}
                label={c.name}
                icon={
                  <span className="text-[10px] text-zinc-600 uppercase">
                    {c.code}
                  </span>
                }
                selected={proxyCountryCode === c.code}
                onSelect={() => selectCountry(c.code)}
              />
            ))
          )
        ) : (
          <>
            <div className="px-3 pt-2 pb-1 text-[10px] text-zinc-500 uppercase tracking-wider">
              Popular
            </div>
            {popular.map((c) => (
              <DropdownRow
                key={c.code}
                label={c.name}
                icon={
                  <span className="text-[10px] text-zinc-600 uppercase">
                    {c.code}
                  </span>
                }
                selected={proxyCountryCode === c.code}
                onSelect={() => selectCountry(c.code)}
              />
            ))}
            <div className="mx-2 my-1 h-px bg-zinc-800" />
            <div className="px-3 pt-1 pb-1 text-[10px] text-zinc-500 uppercase tracking-wider">
              All countries
            </div>
            {others.map((c) => (
              <DropdownRow
                key={c.code}
                label={c.name}
                icon={
                  <span className="text-[10px] text-zinc-600 uppercase">
                    {c.code}
                  </span>
                }
                selected={proxyCountryCode === c.code}
                onSelect={() => selectCountry(c.code)}
              />
            ))}
          </>
        )}
      </div>
    </IconDropdown>
  );
}

/* ------------------------------------------------------------------ */
/*  SettingsBar                                                        */
/* ------------------------------------------------------------------ */

export function SettingsBar() {
  const {
    model,
    setModel,
    profileId,
    setProfileId,
    workspaceId,
    setWorkspaceId,
    profiles,
    workspaces,
  } = useSettings();

  // Only one dropdown open at a time
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggle = useCallback(
    (name: string) =>
      setOpenDropdown((prev) => (prev === name ? null : name)),
    [],
  );
  const close = useCallback(() => setOpenDropdown(null), []);

  return (
    <div className="flex items-center gap-1">
      {/* Model */}
      <IconDropdown
        icon={<Cpu size={16} />}
        title={`Model: ${MODELS.find((m) => m.value === model)?.label ?? model}`}
        activeColor="amber"
        isActive={true}
        open={openDropdown === "model"}
        onToggle={() => toggle("model")}
        onClose={close}
      >
        {MODELS.map((m) => (
          <DropdownRow
            key={m.value}
            label={m.label}
            icon={<Cpu size={12} />}
            selected={model === m.value}
            onSelect={() => {
              setModel(m.value);
              close();
            }}
          />
        ))}
      </IconDropdown>

      {/* Profile */}
      <IconDropdown
        icon={<User size={16} />}
        title={
          profileId
            ? `Profile: ${profiles.find((p) => p.id === profileId)?.name ?? profileId.slice(0, 8)}`
            : "Profile"
        }
        activeColor="green"
        isActive={!!profileId}
        open={openDropdown === "profile"}
        onToggle={() => toggle("profile")}
        onClose={close}
      >
        <DropdownRow
          label="No profile"
          icon={<User size={12} />}
          selected={!profileId}
          onSelect={() => {
            setProfileId("");
            close();
          }}
        />
        {profiles.map((p) => (
          <DropdownRow
            key={p.id}
            label={p.name || p.id.slice(0, 8)}
            icon={<User size={12} />}
            selected={profileId === p.id}
            onSelect={() => {
              setProfileId(p.id);
              close();
            }}
          />
        ))}
      </IconDropdown>

      {/* Workspace */}
      <IconDropdown
        icon={<HardDrive size={16} />}
        title={
          workspaceId
            ? `Workspace: ${workspaces.find((w) => w.id === workspaceId)?.name ?? workspaceId.slice(0, 8)}`
            : "Workspace"
        }
        activeColor="purple"
        isActive={!!workspaceId}
        open={openDropdown === "workspace"}
        onToggle={() => toggle("workspace")}
        onClose={close}
      >
        <DropdownRow
          label="No workspace"
          icon={<HardDrive size={12} />}
          selected={!workspaceId}
          onSelect={() => {
            setWorkspaceId("");
            close();
          }}
        />
        {workspaces.map((w) => (
          <DropdownRow
            key={w.id}
            label={w.name || w.id.slice(0, 8)}
            icon={<HardDrive size={12} />}
            selected={workspaceId === w.id}
            onSelect={() => {
              setWorkspaceId(w.id);
              close();
            }}
          />
        ))}
      </IconDropdown>

      {/* Proxy */}
      <ProxyDropdown
        open={openDropdown === "proxy"}
        onToggle={() => toggle("proxy")}
        onClose={close}
      />
    </div>
  );
}
