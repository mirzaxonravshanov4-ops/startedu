import { useCallback, useEffect, useRef, useState } from "react";

export type ExamLockState = {
  /** Test boshlandi va blokirovka faol. */
  active: boolean;
  /** Brauzer hozir to'liq ekran rejimida. */
  fullscreen: boolean;
  /** Qoidabuzarliklar soni (ekrandan chiqish, boshqa oynaga o'tish). */
  violations: number;
  /** Testni boshlash: to'liq ekranga kirish + blokirovka. */
  start: () => Promise<void>;
  /** To'liq ekranga qaytish (ogohlantirish oynasidan). */
  resume: () => Promise<void>;
  /** Test yakunlanganda blokirovkani olib tashlash. */
  stop: () => void;
};

async function requestFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  try {
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  } catch {
    /* foydalanuvchi rad etdi yoki brauzer qo'llab-quvvatlamaydi */
  }
}

async function exitFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}

/**
 * Imtihon rejimi: to'liq ekran, kontekst menyu / nusxalash / devtools tugmalari
 * bloklanadi, boshqa oynaga o'tish qoidabuzarlik sifatida qayd etiladi.
 */
export function useExamLock(): ExamLockState {
  const [active, setActive] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [violations, setViolations] = useState(0);
  const activeRef = useRef(false);

  const setBoth = (v: boolean) => {
    activeRef.current = v;
    setActive(v);
  };

  const start = useCallback(async () => {
    setBoth(true);
    setViolations(0);
    await requestFullscreen();
  }, []);

  const resume = useCallback(async () => {
    await requestFullscreen();
  }, []);

  const stop = useCallback(() => {
    setBoth(false);
    void exitFullscreen();
  }, []);

  useEffect(() => {
    if (!active) {
      document.body.classList.remove("exam-mode");
      return;
    }
    document.body.classList.add("exam-mode");

    const onFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setFullscreen(isFs);
      if (!isFs && activeRef.current) setViolations((v) => v + 1);
    };
    const onBlurOrHide = () => {
      if (document.visibilityState === "hidden" && activeRef.current) {
        setViolations((v) => v + 1);
      }
    };
    const onContext = (e: Event) => e.preventDefault();
    const onCopy = (e: Event) => e.preventDefault();
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const blockedCombo =
        (e.ctrlKey || e.metaKey) && ["p", "s", "u", "c", "x", "f", "r"].includes(k);
      const devtools =
        k === "f12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k));
      if (blockedCombo || devtools) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onBlurOrHide);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    setFullscreen(Boolean(document.fullscreenElement));

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onBlurOrHide);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.body.classList.remove("exam-mode");
    };
  }, [active]);

  useEffect(
    () => () => {
      document.body.classList.remove("exam-mode");
      void exitFullscreen();
    },
    [],
  );

  return { active, fullscreen, violations, start, resume, stop };
}
