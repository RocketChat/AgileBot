import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IAgileSettingsPersistenceData } from '../../definitions/ExecutorProps';
import { getInteractionRoomData, storeInteractionRoomData } from '../../lib/RoomInteraction';
import { Modals } from '../../definitions/ModalsEnum';
import { t } from '../../i18n/translation';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export async function AgileModal({
	modify,
	read,
	persistence,
	slashCommandContext,
	uiKitContext,
}: {
	modify: IModify;
	read: IRead;
	persistence: IPersistence;
	http: IHttp;
	slashCommandContext?: SlashCommandContext;
	uiKitContext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
	const app = (await read.getUserReader().getAppUser()) as IUser;
	const room = slashCommandContext?.getRoom() || uiKitContext?.getInteractionData().room;
	const user = slashCommandContext?.getSender() || uiKitContext?.getInteractionData().user;

	let agileMessage = '';
	let agileTime = '';
	let agileDays: string[] = [];
	let agileToggle = 'off';

	if (user?.id) {
		let roomId: string;

		if (room?.id) {
			roomId = room.id;
			await storeInteractionRoomData(persistence, user.id, roomId);
		} else {
			roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
		}
		const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId);
		const data = (await read.getPersistenceReader().readByAssociation(assoc)) as IAgileSettingsPersistenceData[];

		if (data && data.length > 0) {
			agileMessage = data[0].agile_message;
			agileTime = data[0].agile_time;
			agileDays = data[0].agile_days;
			agileToggle = data[0].agile_toggle;
		}
	}

	return {
		id: Modals.AgileSettings,
		title: { type: 'plain_text', text: t('agile_modal_title') },
		submit: {
			type: 'button',
			text: { type: 'plain_text', text: t('submit') },
			actionId: 'submit_agile_config',
			blockId: 'agile_config_submit',
			appId: app.id
		},
		blocks: [
			{
				type: 'section',
				text: {
					type: 'plain_text',
					text: t('agile_toggle_title')
				}
			},
			{
				type: 'actions',
				blockId: 'agileToggle',
				elements: [
					{
						type: 'radio_button',
						actionId: 'agileToggle',
						appId: app.id,
						blockId: 'agileToggle',
						options: [
							{
								text: { type: 'plain_text', text: 'On' },
								value: 'on'
							},
							{
								text: { type: 'plain_text', text: 'Off' },
								value: 'off'
							}
						],
						initialOption: agileToggle === 'on' ? 
							{ text: { type: 'plain_text', text: 'On' }, value: 'on' } : 
							{ text: { type: 'plain_text', text: 'Off' }, value: 'off' }
					}
				]
			},
			{
				type: 'input',
				label: {
					type: 'plain_text',
					text: t('agile_message_title'),
				},
				element: {
					type: 'plain_text_input',
					appId: app.id,
					actionId: 'agileMessage',
					blockId: 'agileMessage',
					initialValue: agileMessage,
					placeholder: {
						type: 'plain_text',
						text: t('agile_message_placeholder'),
					},
					multiline: true,
				},
			},
			{
				type: 'input',
				label: {
					type: 'plain_text',
					text: t('agile_select_days_title'),
				},
				element: {
					type: 'multi_static_select',
					appId: app.id,
					actionId: 'selectDays',
					blockId: 'selectDays',
					initialValue: agileDays,
					options: [
						{
							text: { type: 'plain_text', text: 'Monday', emoji: true },
							value: 'monday'
						},
						{
							text: { type: 'plain_text', text: 'Tuesday', emoji: true },
							value: 'tuesday'
						},
						{
							text: { type: 'plain_text', text: 'Wednesday', emoji: true },
							value: 'wednesday'
						},
						{
							text: { type: 'plain_text', text: 'Thursday', emoji: true },
							value: 'thursday'
						},
						{
							text: { type: 'plain_text', text: 'Friday', emoji: true },
							value: 'friday'
						},
						{
							text: { type: 'plain_text', text: 'Saturday', emoji: true },
							value: 'saturday'
						},
						{
							text: { type: 'plain_text', text: 'Sunday', emoji: true },
							value: 'sunday'
						}
					],
					placeholder: {
						type: 'plain_text',
						text: 'Select days'
					}
				}
			},
			{
				type: 'section',
				text: {
					type: 'plain_text',
					text: t('agile_time_title')
				}
			},
			{
				type: 'actions',
				elements: [
					{
						type: 'time_picker',
						actionId: 'agileTime',
						initialTime: agileTime || '00:00',
						placeholder: {
							type: 'plain_text',
							text: 'Select time in 24-hour format',
						},
						appId: app.id,
						blockId: 'agileTime',
					},
				],
			},
		],
	};
}
