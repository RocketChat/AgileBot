import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IAgileSettingsPersistenceData } from '../../definitions/agile-settings/ExecutorProps';
import { getInteractionRoomData, storeInteractionRoomData } from '../../lib/roomInteraction';

export async function MeetingReminderModal({
	modify,
	read,
	persistence,
	http,
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

	const blocks = modify.getCreator().getBlockBuilder();

	blocks.addInputBlock({
		label: {
			text: 'Enter Message',
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'agileMessage',
			multiline: true,
			placeholder: {
				text: '',
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'agileMessage',
	});

	blocks.addInputBlock({
		label: {
			text: 'Select Days',
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newMultiStaticElement({
			actionId: 'selectDays',
			options: [
				{
					value: 'monday',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Monday',
						emoji: true,
					},
				},
				{
					value: 'tuesday',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Tuesday',
						emoji: true,
					},
				},
				{
					value: 'wednesday',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Wednesday',
						emoji: true,
					},
				},
				{
					value: 'thursday',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Thursday',
						emoji: true,
					},
				},
				{
					value: 'friday',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Friday',
						emoji: true,
					},
				},
				{
					value: 'saturday',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Saturday',
						emoji: true,
					},
				},
				{
					value: 'sunday',
					text: {
						type: TextObjectType.PLAINTEXT,
						text: 'Sunday',
						emoji: true,
					},
				},
			],
		}),
		blockId: 'selectDays',
	});

	blocks.addInputBlock({
		label: {
			text: 'Enter time',
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'agileTime',
			placeholder: {
				text: '24-hour format',
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'agileTime',
	});

	return {
		id: 'meetingModalId',
		title: blocks.newPlainTextObject('Agile Settings'),
		submit: blocks.newButtonElement({
			text: blocks.newPlainTextObject('Submit'),
		}),
		blocks: blocks.getBlocks(),
	};
}
