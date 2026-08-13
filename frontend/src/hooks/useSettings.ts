import { useEffect, useState } from "react";

const THRESHOLD_KEY = "ids_threshold";
const DEFAULT_THRESHOLD = 0.5;

export function useSettings() {
  const [threshold, setThresholdState] = useState<number>(() => {
    const stored = localStorage.getItem(THRESHOLD_KEY);
    return stored ? Number(stored) : DEFAULT_THRESHOLD;
  });

  useEffect(() => {
    localStorage.setItem(THRESHOLD_KEY, String(threshold));
  }, [threshold]);

  function setThreshold(value: number) {
    setThresholdState(value);
  }

  function resetThreshold() {
    setThresholdState(DEFAULT_THRESHOLD);
  }

  return { threshold, setThreshold, resetThreshold };
}