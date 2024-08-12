import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { sendMessageToRoom } from '../lib/SendMessageToRoom';
import { IPollData, Poll } from '../definitions/PollProps';
import { generateUUID } from '../lib/GenerateUUID';
import { t } from '../i18n/translation';

export class QuickPoll implements ISlashCommand {
	public command = 'agile-poll';
	public i18nParamsExample: string = 'quick_poll_examples';
	public i18nDescription: string = 'quick_poll_description';
	public providesPreview: boolean = false;

	public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
		const author = context.getSender();
		const user = await read.getUserReader().getAppUser();
		const room: IRoom = context.getRoom();

		const args = context.getArguments();

		if (args.length < 2) {
			await sendMessageToRoom(room, modify, user ?? author, t('please_provide_both_arguments'));
			return;
		}

		const time = args[0];
		const message = args.slice(1).join(' ');

		const timeInMinutes = parseInt(time, 10);
		if (isNaN(timeInMinutes) || timeInMinutes <= 0) {
			await sendMessageToRoom(room, modify, user ?? author, t('invalid_time_argument'));
			return;
		}

		const maxTimeInMinutes = 7 * 24 * 60; // 1 week time limit. Change as needed in future.
		if (timeInMinutes > maxTimeInMinutes) {
			await sendMessageToRoom(room, modify, user ?? author, t('time_argument_too_large'));
			return;
		}

		const timeInSeconds = timeInMinutes * 60;

		const uuid = generateUUID();

		const pollData: IPollData = {
			time,
			message,
			uuid,
			roomId: room.id,
			creatorName: author.name,
			creatorId: author.id,
			pollMessage: message,
			messageId: '',
			responses: {
				yes: [],
				no: [],
			},
		};

		const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
		await persis.createWithAssociation(pollData, assoc);

		const builder = modify
			.getCreator()
			.startMessage()
			.setSender(user ?? author)
			.setRoom(room)
			.setBlocks([
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `## Poll has started \n ${pollData.message} \n\n Created by: ${pollData.creatorName}`,
					},
				},
				{
					type: 'actions',
					elements: [
						{
							type: 'button',
							appId: 'a056c6fd-b2ca-4db8-8c54-0f206a4bf7ae',
							blockId: 'yes-button-block-id',
							actionId: Poll.PollYes,
							value: `${uuid}`,
							text: {
								type: 'plain_text',
								text: t('yes'),
								emoji: true,
							},
						},
						{
							type: 'button',
							appId: 'a056c6fd-b2ca-4db8-8c54-0f206a4bf7ae',
							blockId: 'no-button-block-id',
							actionId: Poll.PollNo,
							value: `${uuid}`,
							text: {
								type: 'plain_text',
								text: t('no'),
								emoji: true,
							},
						},
					],
				},
			]);

		const messageId = await modify.getCreator().finish(builder);

		pollData.messageId = messageId;
		await persis.updateByAssociation(assoc, pollData);

		const when = new Date();
		when.setSeconds(when.getSeconds() + timeInSeconds);

		const job = {
			id: Poll.ProcessorId,
			when,
			data: { uuid },
		};

		await modify.getScheduler().scheduleOnce(job);
	}
}
