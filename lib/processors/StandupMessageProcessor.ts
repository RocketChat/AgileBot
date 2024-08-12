import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IAgileSettingsPersistenceData } from '../../definitions/ExecutorProps';
import { getRoomIds } from '../PersistenceMethods';
import { DailyStandupProcessor } from './DailyStandupProcessor';

export class StandupMessageProcessor implements IProcessor {
	public id = 'standup-message';

	public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
		const roomIds = await getRoomIds(read);
		const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

		for (const roomId of roomIds) {
			const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId);
			const data = (await read.getPersistenceReader().readByAssociation(assoc)) as IAgileSettingsPersistenceData[];

			if (data && data.length > 0) {
				const { agile_message, agile_time, agile_days } = data[0];
				if (agile_days.includes(today)) {
					const hours = parseInt(agile_time.slice(0, 2), 10);
					const minutes = parseInt(agile_time.slice(2, 4), 10);
					const totalMinutes = hours * 60 + minutes;

					console.log(totalMinutes);
					const jobContext = {
						roomId,
						message: agile_message,
					};

					const schedule = {
						id: 'daily-standup-processor',
						processor: new DailyStandupProcessor(),
						when: `${totalMinutes} minutes`,
						data: jobContext,
					};
					await modify.getScheduler().scheduleOnce(schedule);
				}
			}
		}
	}
}
