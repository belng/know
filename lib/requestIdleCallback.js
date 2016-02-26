if (process && process.title === 'node' && global.requestIdleCallback) { // eslint-disable-line no-undef
	global.requestIdleCallback = fn => {
		return setTimeout(() => {
			let deadline = Date.now() + 50;
			fn({
				timeRemaining: () => Math.max(0, deadline - Date.now()),
				didTimeout: false
			});
		}, 0);
	};
	global.cancelIdleCallback = handle => clearTimeout(handle);
}
