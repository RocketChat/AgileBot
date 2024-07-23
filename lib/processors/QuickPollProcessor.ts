import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { sendDirectMessage, sendMessage } from '../Messages';
import { IPollData } from '../../definitions/PollProps';

export class QuickPollProcessor implements IProcessor {
    public id = 'quick-poll';

    public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
        const { uuid } = jobContext;

        const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
        const [pollData] = (await read.getPersistenceReader().readByAssociation(assoc)) as IPollData[];
        if (!pollData) {
            console.error(`Poll with ID ${uuid} not found`);
            return;
        }

        const room = await read.getRoomReader().getById(pollData.roomId);
        if (!room) {
            console.error(`Room with ID ${pollData.roomId} not found`);
            return;
        }

        let summaryResult = '';
        if (pollData.responses.yes.length > pollData.responses.no.length) {
            summaryResult = 'YES';
        } else if (pollData.responses.no.length > pollData.responses.yes.length) {
            summaryResult = 'NO';
        } else {
            summaryResult = 'TIE';
        }

        const channelSummaryText = `
## Poll Results:
Message: ${pollData.pollMessage}
Created by: ${pollData.creatorName}

# Verdict: ${summaryResult}
        `;

        const detailedStatsText = `
Detailed Poll Results:
Message: ${pollData.pollMessage}

Yes: ${pollData.responses.yes.join(', ')}
No: ${pollData.responses.no.join(', ')}
        `;

        const sender = await read.getUserReader().getAppUser();
        if (!sender) {
            console.error(`App user not found`);
            return;
        }

        await sendMessage(modify, room, sender, channelSummaryText);

        const creator = await read.getUserReader().getById(pollData.creatorId);
        if (creator) {
            await sendDirectMessage(read, modify, creator, detailedStatsText, persis);
        } else {
            console.error(`Creator with username ${pollData.creatorName} not found`);
        }

        // Delete the poll record from persistence
        await persis.removeByAssociation(assoc);
    }
}
