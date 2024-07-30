import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';

export class StandupMessageProcessor implements IProcessor {
	public id = 'standup-message';
	public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
		console.log("hello world");
	}
}
