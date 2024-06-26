import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';
import { getInteractionRoomData, storeInteractionRoomData } from '../../lib/RoomInteraction';
import { Modals } from '../../definitions/ModalsEnum';
import { t } from '../../i18n/translation';

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
	const room = slashCommandContext?.getRoom() || uiKitContext?.getInteractionData().room;
	const user = slashCommandContext?.getSender() || uiKitContext?.getInteractionData().user;

	if (user?.id) {
		let roomId: string;

		if (room?.id) {
			roomId = room.id;
			await storeInteractionRoomData(persistence, user.id, roomId);
		} else {
			roomId = (await getInteractionRoomData(read.getPersistenceReader(), user.id)).roomId;
		}
	}

	const blocks = modify.getCreator().getBlockBuilder();

	blocks.addInputBlock({
		label: {
			text: t('meeting_modal_title'),
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'meetingLink',
			placeholder: {
				text: t('meeting_link_placeholder'),
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'meetingLink',
	});

	blocks.addInputBlock({
		label: {
			text: t('meeting_title_label'),
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'meetingTitle',
			placeholder: {
				text: t('meeting_title_placeholder'),
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'meetingTitle',
	});

	blocks.addInputBlock({
		label: {
			text: t('meeting_time_label'),
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'meetingTime',
			placeholder: {
				text: t('meeting_time_placeholder'),
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'meetingTime',
	});

	blocks.addInputBlock({
		label: {
			text: t('minutes_before_label'),
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'minutesBefore',
			placeholder: {
				text: t('minutes_before_placeholder'),
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'minutesBefore',
	});

	return {
		id: Modals.MeetingReminder,
		title: blocks.newPlainTextObject(t('schedule_meeting_reminder_title')),
		submit: blocks.newButtonElement({
			text: blocks.newPlainTextObject(t('submit')),
		}),
		blocks: blocks.getBlocks(),
	};
}
