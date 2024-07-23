import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { sendDirectMessage, sendMessage } from '../Messages';
import { IPollData, Poll } from '../../definitions/PollProps';
import { t } from '../../i18n/translation';

export class QuickPollProcessor implements IProcessor {
    public id = Poll.ProcessorId;

    public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
        const { uuid } = jobContext;

        const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, uuid);
        const [pollData] = (await read.getPersistenceReader().readByAssociation(assoc)) as IPollData[];
        if (!pollData) {
            console.error(t('poll_with_uuid_not_found'));
            return;
        }

        const room = await read.getRoomReader().getById(pollData.roomId);
        if (!room) {
            console.error(t('poll_with_room_not_found'));
            return;
        }

        const totalVotes = pollData.responses.yes.length + pollData.responses.no.length;

        const yesPercentage = totalVotes > 0 ? (pollData.responses.yes.length / totalVotes) * 100 : 0;
        const noPercentage = totalVotes > 0 ? (pollData.responses.no.length / totalVotes) * 100 : 0;

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
${pollData.pollMessage}
Created by: ${pollData.creatorName}

## Verdict: ${summaryResult}
        `;

        const detailedStatsText = `
## Detailed Poll Results:
${pollData.pollMessage}

Yes (${yesPercentage.toFixed(2)}%): ${pollData.responses.yes.join(', ')}
No (${noPercentage.toFixed(2)}%): ${pollData.responses.no.join(', ')}
        `;

        const sender = await read.getUserReader().getAppUser();
        if (!sender) {
            console.error(t('poll_app_user_not_found'));
            return;
        }

        await sendMessage(modify, room, sender, channelSummaryText);

        const creator = await read.getUserReader().getById(pollData.creatorId);
        if (creator) {
            await sendDirectMessage(read, modify, creator, detailedStatsText, persis);
        } else {
            console.error(t('poll_creator_with_username_not_found'));
        }

        await persis.removeByAssociation(assoc);
    }
}
