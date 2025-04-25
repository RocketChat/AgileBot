export function removeColonFromTime(timeStr: string): string {
	if (timeStr.includes(':')) {
		return timeStr.replace(':', '');
	}
	return timeStr;
}
