import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { AgileBotApp } from '../AgileBotApp';
import { sendNotification } from '../lib/Messages';
import { storeOrUpdateData, removeAllData, addRoomId, removeRoomId } from '../lib/PersistenceMethods';
import { getRoom } from '../lib/RoomInteraction';
import { Modals } from '../definitions/ModalsEnum';
import { getRoomIds } from '../lib/PersistenceMethods';

export class ExecuteViewSubmitHandler {
	constructor(
		private readonly app: AgileBotApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

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

		const agileMessage = view.state?.['agileMessage']['agileMessage'] || '';
		const selectDays = view.state?.['selectDays']['selectDays'] || '';
		const time = view.state?.['agileTime']['agileTime'] || '';
		const toggleChoice = view.state?.['agileToggle']['agileToggle'] || '';

		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_message', agileMessage);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_days', selectDays);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_time', time);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_toggle', toggleChoice);

		if (toggleChoice === 'on') {
			await addRoomId(this.persistence, this.read, room.id);
			await sendNotification(this.read, this.modify, user, room, `Agile settings enabled for room: ${room.displayName}`);
		} else if (toggleChoice === 'off') {
			await removeRoomId(this.persistence, this.read, room.id);
			await sendNotification(this.read, this.modify, user, room, `Agile settings disabled for room: ${room.displayName}`);
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
}
