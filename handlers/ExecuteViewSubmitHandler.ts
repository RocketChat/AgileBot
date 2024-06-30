import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { AgileBotApp } from '../AgileBotApp';
import { sendNotification } from '../lib/Messages';
import { storeOrUpdateData, removeAllData } from '../lib/PersistenceMethods';
import { getRoom } from '../lib/RoomInteraction';
import { Modals } from '../definitions/ModalsEnum';

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

		const meetingTime = parseInt(meetingTimeStr, 10);
		const meetingHours = Math.floor(meetingTime / 100);
		const meetingMinutes = meetingTime % 100;
		const minutesBefore = parseInt(minutesBeforeStr, 10);

		const a = new Date();
		const b = new Date().setHours(meetingHours, meetingMinutes, 0, 0);
		const c = new Date();
		c.setTime(b);

		const timeLeft = Math.floor((b - a.getTime()) / 1000 - minutesBefore * 60);

		const messageText = `Please join the meeting: ${meetingLink}\nTitle: ${meetingTitle}`;

		const task = {
			id: 'meeting-reminder',
			when: `${timeLeft} seconds`,
			data: {
				room: room,
				sender: author ?? user,
				message: messageText,
			},
		};

		await sendNotification(this.read, this.modify, user, room, `Scheduled meeting reminder ${meetingTimeStr}, ${a}`);

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

		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_message', agileMessage);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_days', selectDays);
		await storeOrUpdateData(this.persistence, this.read, room.id, 'agile_time', time);

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
