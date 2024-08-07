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

const ROOM_IDS_KEY = 'agile_room_id';

export async function addRoomId(persistence: IPersistence, read: IRead, roomId: string): Promise<void> {
	const storedData = await getStoredRoomIds(read);
	const roomIds = storedData || [];

	if (!roomIds.includes(roomId)) {
		roomIds.push(roomId);
		await updateStoredRoomIds(persistence, roomIds);
	}
}

export async function removeRoomId(persistence: IPersistence, read: IRead, roomId: string): Promise<void> {
	const storedData = await getStoredRoomIds(read);
	let roomIds = storedData || [];

	roomIds = roomIds.filter((id: string) => id !== roomId);
	await updateStoredRoomIds(persistence, roomIds);
}

export async function getRoomIds(read: IRead): Promise<string[]> {
	const storedData = await getStoredRoomIds(read);
	return storedData || [];
}

async function getStoredRoomIds(read: IRead): Promise<string[]> {
	const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, ROOM_IDS_KEY);
	const storedData = await read.getPersistenceReader().readByAssociation(assoc);
	return storedData.length > 0 ? storedData[0][ROOM_IDS_KEY] : [];
}

async function updateStoredRoomIds(persistence: IPersistence, roomIds: string[]): Promise<void> {
	const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, ROOM_IDS_KEY);
	await persistence.removeByAssociation(assoc);
	const newData = { [ROOM_IDS_KEY]: roomIds };
	await persistence.createWithAssociation(newData, assoc);
}
