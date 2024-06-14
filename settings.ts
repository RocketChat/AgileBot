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
    {
        id: 'scrum_days',
        type: SettingType.MULTI_SELECT,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'Scrum_days',
        i18nDescription: 'Scrum_Days_Description',
        values: [
            { key: 'Monday', i18nLabel: 'Monday' },
            { key: 'Tuesday', i18nLabel: 'Tuesday' },
            { key: 'Wednesday', i18nLabel: 'Wednesday' },
            { key: 'Thursday', i18nLabel: 'Thursday' },
            { key: 'Friday', i18nLabel: 'Friday' },
            { key: 'Saturday', i18nLabel: 'Saturday' },
            { key: 'Sunday', i18nLabel: 'Sunday' },
        ],
    },
    {
        id: 'scrum_time',
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'Scrum_Time',
        i18nDescription: 'Scrum_Time_Description',
    },
];