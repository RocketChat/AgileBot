export function generateUUID(): string {
	function randomHex(size: number): string {
		return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
	}

	return [
		randomHex(8),
		randomHex(4),
		'4' + randomHex(3),
		(Math.floor(Math.random() * 4) + 8).toString(16) + randomHex(3),
		randomHex(12),
	].join('-');
}
