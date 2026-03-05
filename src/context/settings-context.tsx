"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { listProfiles, listWorkspaces } from "@/lib/api";
import type { Profile, WorkspaceView } from "@/lib/types";

interface SettingsContextType {
  model: string;
  setModel: (m: string) => void;
  profileId: string;
  setProfileId: (id: string) => void;
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
  proxyCountryCode: string;
  setProxyCountryCode: (code: string) => void;
  profiles: Profile[];
  workspaces: WorkspaceView[];
  isLoadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function usePersisted(key: string, fallback: string) {
  const [value, setValue] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) setValue(saved);
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (v: string) => {
      setValue(v);
      if (v) localStorage.setItem(key, v);
      else localStorage.removeItem(key);
    },
    [key],
  );

  return [value, set, loaded] as const;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = usePersisted("bu-model", "bu-mini");
  const [profileId, setProfileId, profileLoaded] = usePersisted("bu-profile", "");
  const [workspaceId, setWorkspaceId, workspaceLoaded] = usePersisted("bu-workspace", "");
  const [proxyCountryCode, setProxyCountryCode] = usePersisted("bu-proxy", "");

  const { data: profilesData, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
    staleTime: 60_000,
  });

  const { data: workspacesData, isLoading: loadingWorkspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
    staleTime: 60_000,
  });

  const profiles = profilesData?.items ?? [];
  const workspaces = workspacesData?.items ?? [];

  // Auto-default to first profile if user hasn't explicitly chosen one
  useEffect(() => {
    if (profileLoaded && !profileId && profiles.length > 0) {
      setProfileId(profiles[0].id);
    }
  }, [profileLoaded, profileId, profiles, setProfileId]);

  // Auto-default to first workspace if user hasn't explicitly chosen one
  useEffect(() => {
    if (workspaceLoaded && !workspaceId && workspaces.length > 0) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [workspaceLoaded, workspaceId, workspaces, setWorkspaceId]);

  return (
    <SettingsContext.Provider
      value={{
        model,
        setModel,
        profileId,
        setProfileId,
        workspaceId,
        setWorkspaceId,
        proxyCountryCode,
        setProxyCountryCode,
        profiles,
        workspaces,
        isLoadingSettings: loadingProfiles || loadingWorkspaces,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
