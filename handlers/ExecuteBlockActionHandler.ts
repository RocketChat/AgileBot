import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AgileBotApp } from '../AgileBotApp';
import { IUIKitResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { sendNotification } from '../lib/Messages';
import { IPollData, Poll } from '../definitions/PollProps';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { t } from '../i18n/translation';

export class ExecuteBlockActionHandler {
	constructor(
		private readonly app: AgileBotApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

	public async run(context: UIKitBlockInteractionContext): Promise<IUIKitResponse> {
		const { actionId, user, value, room } = context.getInteractionData();

		if (!room || !value) {
			return {
				success: false,
			};
		}

		switch (actionId) {
			case Poll.PollYes:
				await this.handleQuickPollYes(user, room, value);
				break;
			case Poll.PollNo:
				await this.handleQuickPollNo(user, room, value);
				break;
		}

		return {
			success: true,
		};
	}

	private async handleQuickPollYes(user: IUser, room: IRoom, value: string) {
		if (room) {
			const responseStored = await this.storePollResponse(value, 'yes', user.name);
			await sendNotification(
				this.read,
				this.modify,
				user,
				room,
				responseStored ? t('poll_response_recorded_yes') : t('poll_already_ended'),
			);
		}
	}

	private async handleQuickPollNo(user: IUser, room: IRoom, value: string) {
		if (room) {
			const responseStored = await this.storePollResponse(value, 'no', user.name);
			await sendNotification(
				this.read,
				this.modify,
				user,
				room,
				responseStored ? t('poll_response_recorded_no') : t('poll_already_ended'),
			);
		}
	}

	private async storePollResponse(uuid: string, response: string, userName: string): Promise<boolean> {
		const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
		const [pollData] = (await this.read.getPersistenceReader().readByAssociation(assoc)) as IPollData[];
		if (!pollData) {
			console.error(`Poll with ID ${uuid} not found`);
			return false;
		}

		const otherResponse = response === 'yes' ? 'no' : 'yes';

		pollData.responses[otherResponse] = pollData.responses[otherResponse].filter((name) => name !== userName);

		if (!pollData.responses[response].includes(userName)) {
			pollData.responses[response].push(userName);
		}

		await this.persistence.updateByAssociation(assoc, pollData);
		return true;
	}
}
