import { en } from './locales/en';

export const t = (key: any, params?: any) => {
	const translation = en[key];

	const withEmoji = translation.replace(/:([a-z_]+):/g, (match, code) => {
		const emojiMap: Record<string, string> = {
			smile: '😄',
		};
		return emojiMap[code] || match;
	});

	if (!params) return withEmoji;

	const withVars = withEmoji.replace(/\${([^}]+)}/g, (match, path) => {
		return path.split('.').reduce((obj: any, key: string) => obj?.[key], params) ?? match;
	});

	return withVars;
};
