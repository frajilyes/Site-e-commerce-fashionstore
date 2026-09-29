import { useCallback, useEffect, useState } from "react";
import { healthApi } from "../Api";

const IDLE_STATE = {
  status: "idle",
  uptime: null,
  error: null,
  checkedAt: null,
};

const probeHealth = async () => {
  try {
    const data = await healthApi.getHealth();
    return {
      status: "online",
      uptime: data?.uptime ?? null,
      error: null,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "offline",
      uptime: null,
      error: error.message,
      checkedAt: new Date().toISOString(),
    };
  }
};

export const useApiHealth = ({ auto = true } = {}) => {
  const [state, setState] = useState(
    auto ? { ...IDLE_STATE, status: "checking" } : IDLE_STATE,
  );
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (!auto && runId === 0) return undefined;

    let cancelled = false;
    probeHealth().then((next) => {
      if (!cancelled) setState(next);
    });

    return () => {
      cancelled = true;
    };
  }, [auto, runId]);

  const check = useCallback(() => {
    setState((prev) => ({ ...prev, status: "checking", error: null }));
    setRunId((id) => id + 1);
  }, []);

  return { ...state, check };
};

export default useApiHealth;
