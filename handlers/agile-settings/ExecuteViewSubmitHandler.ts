import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { AgileBotApp } from "../../AgileBotApp";
import { sendNotification } from "../../lib/agile-settings/messages";
import { storeOrUpdateData, removeAllData } from "../../modals/agile-settings/AgileModal";
import { getInteractionRoomData } from "../../lib/agile-settings/roomInteraction";

export class ExecuteViewSubmitHandler {
    constructor(
        private readonly app: AgileBotApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(context: UIKitViewSubmitInteractionContext) {
        const { user, view } = context.getInteractionData();

        if (!user) {
            return {
                success: false,
                error: "No user found",
            };
        }

        const { roomId } = await getInteractionRoomData(
            this.read.getPersistenceReader(),
            user.id
        );

        if (!roomId) {
            return {
                success: false,
                error: "No room to send a message",
            };
        }

        let room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        const agileMessage = view.state?.["agileMessage"]["agileMessage"] || "";
        const selectDays = view.state?.["selectDays"]["selectDays"] || "";
        const time = view.state?.["agileTime"]["agileTime"] || "";

        await sendNotification(
            this.read,
            this.modify,
            user,
            room,
            "Saved successfully",
        );

        await storeOrUpdateData(this.persistence, this.read, roomId, "agile_message", agileMessage);
        await storeOrUpdateData(this.persistence, this.read, roomId, "agile_days", selectDays);
        await storeOrUpdateData(this.persistence, this.read, roomId, "agile_time", time);

        return {
            success: true,
            ...view,
        };
    }
}
