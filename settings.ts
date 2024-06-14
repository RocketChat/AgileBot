import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSettingsEnum {
    ScrumMessage = 'scrum_message'
}

export const settings: ISetting[] = [
    {
        id: 'scrum_message',
        type: SettingType.STRING,
        multiline: true,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'Scrum_Message',
        i18nDescription: 'Scrum_Message_Description',
    },
];