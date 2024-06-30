import { IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';

export async function storeOrUpdateData(persistence: IPersistence, read: IRead, roomId: string, key: string, data: string): Promise<void> {
	const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId);
	const existingData = await read.getPersistenceReader().readByAssociation(assoc);

	if (existingData && existingData.length > 0) {
		const storedData = existingData[0];
		storedData[key] = data;
		await persistence.updateByAssociation(assoc, storedData);
	} else {
		const newData = { [key]: data };
		await persistence.createWithAssociation(newData, assoc);
	}
}

export async function removeAllData(persistence: IPersistence, read: IRead, roomId: string): Promise<void> {
	const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId);
	const data = await read.getPersistenceReader().readByAssociation(assoc);

	for (const record of data) {
		await persistence.removeByAssociation(assoc);
	}
}
