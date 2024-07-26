import {
    AbstractAccountCreationPlugin,
    AccountCreationPlugin,
    AccountCreationPluginConfig,
    CreateAccountResponse,
    Chains,
    CreateAccountContext,
} from '@wharfkit/session'
import {AccountCreationPluginMetadata} from '@wharfkit/session'

export class AccountCreationPluginTEMPLATE
    extends AbstractAccountCreationPlugin
    implements AccountCreationPlugin
{
    /**
     * The logic configuration for the account-creation plugin.
     */
    readonly config: AccountCreationPluginConfig = {
        // Should the user interface display a chain selector?
        requiresChainSelect: true,

        // Optionally specify if this plugin only works with specific blockchains.
        // supportedChains: [Chains.Jungle4],
    }
    /**
     * The metadata for the account-creation plugin to be displayed in the user interface.
     */
    readonly metadata: AccountCreationPluginMetadata = AccountCreationPluginMetadata.from({
        name: 'Account Creation Plugin Template',
        description: 'A template that can be used to build account creation plugins!',
        logo: 'base_64_encoded_image',
        homepage: 'https://someplace.com',
    })
    /**
     * A unique string identifier for this account-creation plugin.
     *
     * It's recommended this is all lower case, no spaces, and only URL-friendly special characters (dashes, underscores, etc)
     */
    get id(): string {
        return 'account-creation-plugin-template'
    }

    /**
     * The name of the account-creation plugin to be displayed in the user interface.
     */
    get name(): string {
        return 'Account Creation Plugin Template'
    }

    /**
     * Performs the account creationg logic required to create the account.
     *
     * @param options CreateAccountContext
     * @returns Promise<CreateAccountResponse>
     */
    // TODO: Remove these eslint rule modifiers when you are implementing this method.
    /* eslint-disable @typescript-eslint/no-unused-vars */
    async create(context: CreateAccountContext): Promise<CreateAccountResponse> {
        // Example response...
        return {
            chain: Chains.EOS,
            accountName: 'wharfkit1111',
        }
    }
}
