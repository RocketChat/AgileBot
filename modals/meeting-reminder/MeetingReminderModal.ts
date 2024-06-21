import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { UIKitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks';

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
			text: 'Meeting link',
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'meetingLink',
			placeholder: {
				text: 'Enter the meeting link',
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'meetingLink',
	});

	blocks.addInputBlock({
		label: {
			text: 'Meeting Title',
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'meetingTitle',
			placeholder: {
				text: 'Enter the meeting title',
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'meetingTitle',
	});

	blocks.addInputBlock({
		label: {
			text: 'Meeting time',
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'meetingTime',
			placeholder: {
				text: 'Enter the meeting time (24-hour format)',
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'meetingTime',
	});

	blocks.addInputBlock({
		label: {
			text: 'Minutes to post before',
			type: TextObjectType.PLAINTEXT,
		},
		element: blocks.newPlainTextInputElement({
			actionId: 'minutesBefore',
			placeholder: {
				text: 'Enter minutes to post reminder before meeting',
				type: TextObjectType.PLAINTEXT,
			},
		}),
		blockId: 'minutesBefore',
	});

	return {
		id: 'meetingModalId',
		title: blocks.newPlainTextObject('Schedule Meeting Reminder'),
		submit: blocks.newButtonElement({
			text: blocks.newPlainTextObject('Submit'),
		}),
		blocks: blocks.getBlocks(),
	};
}
