import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { UIKitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks";
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IAgileSettingsPersistenceData } from "../../definitions/agile-settings/ExecutorProps";

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

export async function AgileModal({
    modify,
    read,
    persistence,
    http,
    slashCommandContext,
    uiKitContext,
}: {
    modify: IModify;
    read: IRead;
    persistence: IPersistence;
    http: IHttp;
    slashCommandContext?: SlashCommandContext;
    uiKitContext?: UIKitInteractionContext;
}): Promise<IUIKitModalViewParam> {
    const room =
        slashCommandContext?.getRoom() ||
        uiKitContext?.getInteractionData().room;
    const user =
        slashCommandContext?.getSender() ||
        uiKitContext?.getInteractionData().user;

    let agileMessage = "";
    let agileTime = "";
    let agileDays: string[] = [];

    if (user?.id) {
        let roomId: string;

        if (room?.id) {
            roomId = room.id;

            const assoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id);
            const data = (await read.getPersistenceReader().readByAssociation(assoc)) as IAgileSettingsPersistenceData[];
            console.log(data);
            
            if (data && data.length > 0) {
                agileMessage = data[0].agile_message;
                agileTime = data[0].agile_time;
                agileDays = data[0].agile_days;
            }
        }
    }

    const blocks = modify.getCreator().getBlockBuilder();

    blocks.addInputBlock({
        label: {
            text: "Enter Message",
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newPlainTextInputElement({
            actionId: "agileMessage",
            multiline: true,
            initialValue: agileMessage,
            placeholder: {
                text: "Post all your updates in this thread :typing:",
                type: TextObjectType.PLAINTEXT,
            },
        }),
        blockId: "agileMessage",
    });

    blocks.addInputBlock({
        label: {
            text: "Select Days",
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newMultiStaticElement({
            actionId: "selectDays",
            initialValue: agileDays,
            options: [
                {
                    value: "monday",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Monday",
                        emoji: true,
                    },
                },
                {
                    value: "tuesday",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Tuesday",
                        emoji: true,
                    },
                },
                {
                    value: "wednesday",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Wednesday",
                        emoji: true,
                    },
                },
                {
                    value: "thursday",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Thursday",
                        emoji: true,
                    },
                },
                {
                    value: "friday",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Friday",
                        emoji: true,
                    },
                },
                {
                    value: "saturday",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Saturday",
                        emoji: true,
                    },
                },
                {
                    value: "sunday",
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Sunday",
                        emoji: true,
                    },
                },
            ],
        }),
        blockId: "selectDays",
    });

    blocks.addInputBlock({
        label: {
            text: "Enter time",
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newPlainTextInputElement({
            actionId: "agileTime",
            initialValue: agileTime,
            placeholder: {
                text: "24-hour format",
                type: TextObjectType.PLAINTEXT,
            },
        }),
        blockId: "agileTime",
    });

    return {
        id: "promptModalId",
        title: blocks.newPlainTextObject("Agile Settings"),
        submit: blocks.newButtonElement({
            text: blocks.newPlainTextObject("Submit"),
        }),
        blocks: blocks.getBlocks(),
    };
}
