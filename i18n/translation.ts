import { en } from './locales/en';

export const t = (key: any) => {
	const translation = en[key];
	return translation;
};
