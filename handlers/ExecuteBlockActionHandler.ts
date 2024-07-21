import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AgileBotApp } from '../AgileBotApp';
import { IUIKitResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { sendNotification } from '../lib/Messages';
import { IPollData } from '../definitions/PollProps';

export class ExecuteBlockActionHandler {
	constructor(
		private readonly app: AgileBotApp,
		private readonly read: IRead,
		private readonly http: IHttp,
		private readonly modify: IModify,
		private readonly persistence: IPersistence,
	) {}

	public async run(context: UIKitBlockInteractionContext): Promise<IUIKitResponse> {
		const { actionId, user, container, blockId, value, triggerId, room } = context.getInteractionData();
		console.log(user);
		console.log(room);

		switch (actionId) {
			case 'quickpoll_yes':
				await this.handleQuickPollYes(user, room, value);
				break;
			case 'quickpoll_no':
				await this.handleQuickPollNo(user, room, value);
				break;
			default:
				console.log('Default');
		}

		return {
			success: true,
		};
	}

	private async handleQuickPollYes(user, room, value) {
		if (room) {
			await sendNotification(
				this.read,
				this.modify,
				user,
				room,
				`${user.name} replied - Yes in room ${room.displayName}. Poll ID: ${value}`,
			);
			await this.storePollResponse(value, 'yes', user.name);
		}
	}

	private async handleQuickPollNo(user, room, value) {
		if (room) {
			await sendNotification(
				this.read,
				this.modify,
				user,
				room,
				`${user.name} replied - No in room ${room.displayName}. Poll ID: ${value}`,
			);
			await this.storePollResponse(value, 'no', user.name);
		}
	}

	private async storePollResponse(uuid: string, response: string, userName: string) {
		const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
		const [pollData] = (await this.read.getPersistenceReader().readByAssociation(assoc)) as IPollData[];
		if (!pollData) {
			console.error(`Poll with ID ${uuid} not found`);
			return;
		}

		const otherResponse = response === 'yes' ? 'no' : 'yes';

		pollData.responses[otherResponse] = pollData.responses[otherResponse].filter((name) => name !== userName);

		if (!pollData.responses[response].includes(userName)) {
			pollData.responses[response].push(userName);
		}

		console.log(pollData);

		await this.persistence.updateByAssociation(assoc, pollData);
	}
}
