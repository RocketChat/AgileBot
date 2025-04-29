export function removeColonFromTime(timeStr: string): string {
	if (timeStr.includes(':')) {
		return timeStr.replace(':', '');
	}
	return timeStr;
}

export function addColonToTime(timeStr: string): string {
	if (timeStr.length === 4) {
		return timeStr.slice(0, 2) + ':' + timeStr.slice(2);
	}
	return timeStr;
}
