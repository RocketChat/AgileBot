import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { AgileBotApp } from "../../AgileBotApp";

import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";

import { AgileModal } from "../../modals/agile-settings/AgileModal";

export class ExecuteBlockActionHandler {
    constructor(
        private readonly app: AgileBotApp,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly modify: IModify,
        private readonly persistence: IPersistence
    ) {}

    public async run(
        context: UIKitBlockInteractionContext
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();

        const contextualbarBlocks = await AgileModal({
            modify: this.modify,
            read: this.read,
            persistence: this.persistence,
            http: this.http,
            slashCommandContext: undefined,
            uiKitContext: context,
        });

        await this.modify
            .getUiController()
            .updateModalView(
                contextualbarBlocks,
                { triggerId: data.triggerId },
                data.user
            );

        return {
            success: true,
        };
    }
}
