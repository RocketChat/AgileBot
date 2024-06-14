import {
    IAppAccessors,
    IConfigurationExtend,
    IConfigurationModify,
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { SummarizeCommand } from "./commands/Summarize";
import { ThreadInit } from "./commands/Thread";
import { AgileSettings } from "./commands/AgileSettings";
import { AppSettingsEnum, settings } from "./settings";
import { ISetting } from "@rocket.chat/apps-engine/definition/settings";
import {UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { UIKitActionButtonInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IPersistence, IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IUIKitResponse } from "@rocket.chat/apps-engine/definition/uikit";
import { UIKitBlockInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { ExecuteBlockActionHandler } from "./handlers/agile-settings/ExecuteBlockActionHandler";
import { ExecuteViewSubmitHandler } from "./handlers/agile-settings/ExecuteViewSubmitHandler";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";

export class AgileBotApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        const handler = new ExecuteBlockActionHandler(
            this,
            read,
            http,
            modify,
            persistence
        );
        return await handler.run(context);
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const handler = new ExecuteViewSubmitHandler(
            this,
            read,
            http,
            modify,
            persistence
        );
        return await handler.run(context);
    }

    public async extendConfiguration(configuration: IConfigurationExtend) {
        configuration.slashCommands.provideSlashCommand(new SummarizeCommand());
        configuration.slashCommands.provideSlashCommand(new ThreadInit());
        configuration.slashCommands.provideSlashCommand(new AgileSettings(this));


        await Promise.all(
            settings.map((setting) =>
                configuration.settings.provideSetting(setting)
            )
        );
    }
    
    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        
    }
}
