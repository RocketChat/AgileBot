import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { AgileBotApp } from '../AgileBotApp';
import { sendNotification } from '../lib/Messages';
import { storeOrUpdateData, removeAllData, addRoomId, removeRoomId } from '../lib/PersistenceMethods';
import { getRoom } from '../lib/RoomInteraction';
import { Modals } from '../definitions/ModalsEnum';
import { getRoomIds } from '../lib/PersistenceMethods';
import { removeColonFromTime } from '../lib/HandleTimeString';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IPollData, Poll } from '../definitions/PollProps';
import { generateUUID } from '../lib/GenerateUUID';
import { t } from '../i18n/translation';
import { createPollButtons, buildVoteDisplay } from '../lib/PollHelpers';
import { POLL_CONSTANTS } from '../definitions/PollConstants';

export class ExecuteViewSubmitHandler {
	constructor(
		private readonly app: AgileBotApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) { }

	public async run(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

		if (!user) {
			return {
				success: false,
				error: 'No user found',
			};
		}

		const modalId = view.id;

		switch (modalId) {
			case Modals.AgileSettings:
				return await this.handleAgileSettingsModal(context);
			case Modals.MeetingReminder:
				return await this.handleMeetingModal(context);
			case Modals.PollCreation:
				return await this.handlePollCreationModal(context);
			default:
				return {
					success: false,
					error: 'Unknown modal ID',
				};
		}
	}

	private async handleMeetingModal(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

		const { room, error } = await getRoom(this.read, user.id);
		if (error || !room) {
			return {
				success: false,
				error: error || 'Room not found',
			};
		}

		const author = await this.read.getUserReader().getAppUser();

		const meetingLink = view.state?.['meetingLink']['meetingLink'] || '';
		const meetingTitle = view.state?.['meetingTitle']['meetingTitle'] || '';
		const meetingTimeStr = view.state?.['meetingTime']['meetingTime'] || '';
		const minutesBeforeStr = view.state?.['minutesBefore']['minutesBefore'] || '0';

		if (!/^\d{4}$/.test(meetingTimeStr)) {
			await sendNotification(this.read, this.modify, user, room, 'Invalid meeting time format. Please use 24-hour format (HHMM).');
			return {
				success: false,
				error: 'Invalid meeting time format. Please use 24-hour format (HHMM).',
			};
		}

		const meetingTime = parseInt(meetingTimeStr, 10);
		const meetingHours = Math.floor(meetingTime / 100);
		const meetingMinutes = meetingTime % 100;

		if (meetingHours < 0 || meetingHours > 23 || meetingMinutes < 0 || meetingMinutes > 59) {
			await sendNotification(
				this.read,
				this.modify,
				user,
				room,
				'Invalid meeting time. Hours must be between 00 and 23 and minutes between 00 and 59.',
			);
			return {
				success: false,
				error: 'Invalid meeting time. Hours must be between 00 and 23 and minutes between 00 and 59.',
			};
		}

		const minutesBefore = parseInt(minutesBeforeStr, 10);
		if (isNaN(minutesBefore) || minutesBefore < 0) {
			await sendNotification(
				this.read,
				this.modify,
				user,
				room,
				'Invalid "minutes before" value. It must be a non-negative integer.',
			);
			return {
				success: false,
				error: 'Invalid "minutes before" value. It must be a non-negative integer.',
			};
		}

		const now = new Date();
		const meetingDate = new Date();
		meetingDate.setHours(meetingHours, meetingMinutes, 0, 0);

		const timeLeft = Math.floor((meetingDate.getTime() - now.getTime()) / 1000 - minutesBefore * 60);

		if (timeLeft < 0) {
			await sendNotification(this.read, this.modify, user, room, 'Invalid meeting time. The meeting time must be in the future.');
			return {
				success: false,
				error: 'Invalid meeting time. The meeting time must be in the future.',
			};
		}

		const messageText = `### Meeting alert \n ${meetingTitle} \n\n Meeting link: ${meetingLink}`;

		const task = {
			id: 'meeting-reminder',
			when: `${timeLeft} seconds`,
			data: {
				room: room,
				sender: author ?? user,
				message: messageText,
			},
		};

		await sendNotification(this.read, this.modify, user, room, `Scheduled meeting reminder for ${meetingTimeStr}.`);

		await this.modify.getScheduler().scheduleOnce(task);

		return {
			success: true,
			...view,
		};
	}

	private async handleAgileSettingsModal(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

		const { room, error } = await getRoom(this.read, user.id);
		if (error || !room) {
			return {
				success: false,
				error: error || 'Room not found',
			};
		}

		const agileMessage = view.state?.['agileMessage']?.['agileMessage'] || '';
		const selectDays = view.state?.['selectDays']?.['selectDays'] || '';
		const time = view.state?.['agileTime']?.['agileTime'] || '';
		const toggleChoice = view.state?.['agileToggle']?.['agileToggle'] || '';

		const validatedTime = removeColonFromTime(time);

		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_message', agileMessage);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_days', selectDays);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_time', validatedTime);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_toggle', toggleChoice);

		const roomName = room.displayName || room.slugifiedName || room.id;

		if (toggleChoice === 'on') {
			await addRoomId(this.persistence, this.read, room.id);
			await sendNotification(this.read, this.modify, user, room, `Agile settings enabled for room: ${roomName}`);
		} else if (toggleChoice === 'off') {
			await removeRoomId(this.persistence, this.read, room.id);
			await sendNotification(this.read, this.modify, user, room, `Agile settings disabled for room: ${roomName}`);
		}

		const storedRoomIds = await getRoomIds(this.read);
		console.log('Stored rooms:', storedRoomIds);

		await sendNotification(
			this.read,
			this.modify,
			user,
			room,
			`**Settings saved successfully.** \n Selected days: ${selectDays} \n Time: ${time} UTC`,
		);

		return {
			success: true,
			...view,
		};
	}

	private async handlePollCreationModal(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

		const { room, error } = await getRoom(this.read, user.id);
		if (error || !room) {
			return {
				success: false,
				error: error || 'Room not found',
			};
		}

		const author = await this.read.getUserReader().getAppUser();

		const pollQuestion = view.state?.['pollQuestion']?.['pollQuestion'] || '';
		const pollDurationStr = view.state?.['pollDuration']?.['pollDuration'] || '5';
		const pollOptionsRaw = view.state?.['pollOptions']?.['pollOptions'] || '';
		const lockVotes = view.state?.['pollLockVotes']?.['pollLockVotes'] || 'no';
		const showResults = view.state?.['pollShowResults']?.['pollShowResults'] || 'no';

		const { MAX_OPTIONS, MAX_OPTION_LENGTH, MIN_OPTIONS } = POLL_CONSTANTS;

		if (!pollQuestion || pollQuestion.trim().length === 0) {
			await sendNotification(this.read, this.modify, user, room, t('poll_empty_question'));
			return { success: false, error: 'Empty question' };
		}

		const timeInMinutes = parseInt(pollDurationStr, 10);
		if (isNaN(timeInMinutes) || timeInMinutes <= 0) {
			await sendNotification(this.read, this.modify, user, room, t('invalid_time_argument'));
			return { success: false, error: 'Invalid time' };
		}

		if (timeInMinutes > POLL_CONSTANTS.MAX_TIME_MINUTES) {
			await sendNotification(this.read, this.modify, user, room, t('time_argument_too_large'));
			return { success: false, error: 'Time too large' };
		}

		let options: string[];
		if (pollOptionsRaw.trim().length > 0) {
			options = pollOptionsRaw.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
		} else {
			options = ['Yes', 'No'];
		}

		if (options.length > MAX_OPTIONS) {
			await sendNotification(this.read, this.modify, user, room, t('poll_max_options_exceeded').replace('${count}', String(options.length)));
			return { success: false, error: 'Too many options' };
		}

		if (pollOptionsRaw.trim().length > 0 && options.length < MIN_OPTIONS) {
			await sendNotification(this.read, this.modify, user, room, t('poll_min_options_required'));
			return { success: false, error: 'Not enough options' };
		}

		for (const opt of options) {
			if (opt.length > MAX_OPTION_LENGTH) {
				await sendNotification(this.read, this.modify, user, room, t('poll_option_too_long').replace('${option}', opt.slice(0, 20) + '...'));
				return { success: false, error: 'Option too long' };
			}
		}

		const lowerCaseOptions = options.map((o) => o.toLowerCase());
		const duplicates = options.filter((opt, index) => lowerCaseOptions.indexOf(opt.toLowerCase()) !== index);
		if (duplicates.length > 0) {
			await sendNotification(this.read, this.modify, user, room, t('poll_duplicate_options').replace('${option}', duplicates[0]));
			return { success: false, error: 'Duplicate options' };
		}

		const isVoteLocked = lockVotes === 'yes';
		const isPublic = showResults === 'yes';
		const timeInSeconds = timeInMinutes * 60;
		const uuid = generateUUID();

		const responses: { [option: string]: string[] } = {};
		options.forEach((opt) => {
			responses[opt] = [];
		});

		const pollData: IPollData = {
			time: pollDurationStr,
			message: pollQuestion,
			uuid,
			roomId: room.id,
			creatorName: user.name,
			creatorId: user.id,
			pollMessage: pollQuestion,
			messageId: '',
			options,
			responses,
			isVoteLocked,
			lockedVoters: [],
			isPublic,
		};

		const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
		await this.persistence.createWithAssociation(pollData, assoc);

		const { optionButtons, cancelButton } = createPollButtons(options, uuid, isPublic);

		const builder = this.modify
			.getCreator()
			.startMessage()
			.setSender(author ?? user)
			.setRoom(room)
			.setBlocks([
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `## Poll has started ${isVoteLocked ? '🔒' : ''}\n**${pollData.pollMessage}**${isPublic ? '\n━━━━━━━━━━━━━━━━━\n' + buildVoteDisplay(options, responses, isPublic) : ''}\n_Created by: ${pollData.creatorName}${isVoteLocked ? ' • Votes locked_' : '_'}`,
					},
				},
				{
					type: 'actions',
					elements: [...optionButtons, cancelButton],
				},
			]);

		const messageId = await this.modify.getCreator().finish(builder);

		const when = new Date();
		when.setSeconds(when.getSeconds() + timeInSeconds);

		const job = {
			id: Poll.ProcessorId,
			when,
			data: { uuid },
		};

		const scheduledJobId = await this.modify.getScheduler().scheduleOnce(job);

		pollData.messageId = messageId;
		pollData.jobId = scheduledJobId || uuid;
		await this.persistence.updateByAssociation(assoc, pollData);

		return {
			success: true,
			...view,
		};
	}
}
