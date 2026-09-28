const timers = new Set<Timer>();

export function setManagedInterval(
  operation: () => void | Promise<void>,
  delay: number
): Timer {
  async function runOperation(): Promise<void> {
    try {
      await operation();
    } catch (error) {
      console.error("Managed interval failed", error);
    }
  }

  const timer = setInterval(runOperation, delay);
  timers.add(timer);
  return timer;
}

export function clearManagedTimers(): void {
  for (const timer of timers) {
    clearInterval(timer);
  }
  timers.clear();
}
