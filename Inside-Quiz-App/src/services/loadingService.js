let loading = false;
const listeners = new Set();

export function setLoading(value) {
	loading = !!value;
	for (const fn of listeners) {
		try { fn(loading); } catch (e) { console.error(e); }
	}
}

export function subscribe(fn) {
	listeners.add(fn);
	// trả về unsubscribe
	return () => listeners.delete(fn);
}

export function getLoading() {
	return loading;
}
