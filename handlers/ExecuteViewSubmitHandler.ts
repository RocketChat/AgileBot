import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { AgileBotApp } from '../AgileBotApp';
import { sendNotification } from '../lib/messages';
import { storeOrUpdateData, removeAllData } from '../lib/PersistenceMethods';
import { getInteractionRoomData } from '../lib/roomInteraction';

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
			case 'promptModalId':
				return await this.handlePromptModal(context);
			case 'meetingModalId':
				return await this.handleMeetingModal(context);
			default:
				return {
					success: false,
					error: 'Unknown modal ID',
				};
		}
	}

	private async getRoom(userId: string): Promise<{ room: IRoom | null; error: string | null }> {
		const { roomId } = await getInteractionRoomData(this.read.getPersistenceReader(), userId);

		if (!roomId) {
			return { room: null, error: 'No room to send a message' };
		}

		const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

		if (!room) {
			return { room: null, error: 'Room not found' };
		}

		return { room, error: null };
	}

	private async handleMeetingModal(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

		const { room, error } = await this.getRoom(user.id);
		if (error || !room) {
			return {
				success: false,
				error: error || 'Room not found',
			};
		}

		const author = await this.read.getUserReader().getAppUser();

		const meetingLink = view.state?.['meetingLink']['meetingLink'] || '';

		const messageText = `Please join this: ${meetingLink}`;

		const task = {
			id: 'meeting-reminder',
			when: '3 seconds',
			data: {
				room: room,
				sender: author ?? user,
				message: messageText,
			},
		};

		await sendNotification(this.read, this.modify, user, room, `Scheduled meeting`);

		await this.modify.getScheduler().scheduleOnce(task);

		return {
			success: true,
			...view,
		};
	}

	private async handlePromptModal(context: UIKitViewSubmitInteractionContext) {
		const { user, view } = context.getInteractionData();

		const { room, error } = await this.getRoom(user.id);
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
