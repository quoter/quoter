const timers = new Set<Timer>();

export function setManagedInterval(
	callback: () => void | Promise<void>,
	delay: number,
): Timer {
	const timer = setInterval(() => {
		Promise.resolve(callback()).catch((error) => {
			console.error("Managed interval failed", error);
		});
	}, delay);
	timers.add(timer);
	return timer;
}

export function clearManagedTimers(): void {
	for (const timer of timers) clearInterval(timer);
	timers.clear();
}
