import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

interface PollData {
	time: string;
	message: string;
	uuid: string;
	roomId: string;
	creatorName: string;
	responses: {
		yes: string[];
		no: string[];
	};
}

export class QuickPollProcessor implements IProcessor {
	public id = 'quick-poll';

	public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
		const { uuid } = jobContext;

		const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
		const [pollData] = (await read.getPersistenceReader().readByAssociation(assoc)) as PollData[];
		if (!pollData) {
			console.error(`Poll with ID ${uuid} not found`);
			return;
		}

		const room = await read.getRoomReader().getById(pollData.roomId);
		if (!room) {
			console.error(`Room with ID ${pollData.roomId} not found`);
			return;
		}

		const messageText = `
            Poll Results:
            Message: ${pollData.message}
            Created by: ${pollData.creatorName}

            Yes:
            ${pollData.responses.yes.join(', ')}

            No:
            ${pollData.responses.no.join(', ')}
        `;

		const sendMessage = async (data: { room: any; message: string; sender: any }) => {
			try {
				if (data.room) {
					const messageBuilder = modify.getCreator().startMessage();
					messageBuilder.setText(data.message);
					messageBuilder.setRoom(data.room);
					messageBuilder.setSender(data.sender);
					await modify.getCreator().finish(messageBuilder);
				}
			} catch (error) {
				console.log(error);
			}
		};

		const sender = await read.getUserReader().getAppUser();
		await sendMessage({ room, message: messageText, sender });
	}
}
