const DEFAULT_TIMEOUT = 2000;

export const afterPaint = (task, timeout = DEFAULT_TIMEOUT) => {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = window.setTimeout(task, 200);
  return () => window.clearTimeout(handle);
};

export default afterPaint;
