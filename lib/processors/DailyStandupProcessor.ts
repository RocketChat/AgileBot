import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IStandupJobContext } from '../../definitions/StandupJobContext';

export class DailyStandupProcessor implements IProcessor {
    public id = 'daily-standup-processor';

    public async processor(jobContext: IStandupJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {

        try {
            const { roomId, message } = jobContext as IStandupJobContext;
            const sender = await read.getUserReader().getAppUser();
            const room = await read.getRoomReader().getById(roomId);

            if (room && sender) {
                const messageBuilder = modify.getCreator().startMessage();
                messageBuilder.setText(message);
                messageBuilder.setRoom(room);
                messageBuilder.setSender(sender);
                await modify.getCreator().finish(messageBuilder);
            }
        } catch (error) {
            console.error('Error sending standup message:', error);
        }
    }
}
