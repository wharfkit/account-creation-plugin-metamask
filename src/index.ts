import {AccountCreator} from '@greymass/create-account'
import {
    AbstractAccountCreationPlugin,
    AccountCreationPlugin,
    AccountCreationPluginConfig,
    Chains,
    Checksum256Type,
    CreateAccountContext,
    PublicKey,
} from '@wharfkit/session'
import {AccountCreationPluginMetadata} from '@wharfkit/session'
import {MetaMaskInpageProvider, RequestArguments} from '@metamask/providers'
import {checkIsFlask, getSnapsProvider, InvokeSnapParams, Snap} from './metamask'

export type GetSnapsResponse = Record<string, Snap>

const ACCOUNT_CREATION_SERVICE_URL = 'https://eos.account.unicove.com/buy'
const DEFAULT_SETUP_PAGE = 'https://unicove.com/eos/metamask'
const DEFAULT_SNAP_ORIGIN = 'npm:@greymass/eos-wallet'

export interface AccountCreationPluginMetaMaskConfig {
    accountCreationServiceUrl?: string
    snapOrigin?: string
    setupPageUrl?: string
}

export class AccountCreationPluginMetamask
    extends AbstractAccountCreationPlugin
    implements AccountCreationPlugin
{
    public installedSnap: Snap | null = null
    public provider: MetaMaskInpageProvider | null = null
    public isFlask = false

    public accountCreationServiceUrl: string
    public snapOrigin: string
    public setupPageUrl: string

    readonly config: AccountCreationPluginConfig = {
        requiresChainSelect: true,
        supportedChains: [Chains.EOS, Chains.Jungle4],
    }

    readonly metadata: AccountCreationPluginMetadata = AccountCreationPluginMetadata.from({
        name: 'Account Creation Plugin Metamask',
        description: 'Plugin to create EOS accounts using Metamask public key.',
    })

    constructor(walletPluginMetaMaskConfig?: AccountCreationPluginMetaMaskConfig) {
        super()

        this.accountCreationServiceUrl =
            walletPluginMetaMaskConfig?.accountCreationServiceUrl || ACCOUNT_CREATION_SERVICE_URL
        this.snapOrigin = walletPluginMetaMaskConfig?.snapOrigin || DEFAULT_SNAP_ORIGIN
        this.setupPageUrl = walletPluginMetaMaskConfig?.setupPageUrl || DEFAULT_SETUP_PAGE
    }

    get id(): string {
        return 'account-creation-plugin-metamask'
    }

    get name(): string {
        return 'Account Creation Plugin Metamask'
    }

    async create(context: CreateAccountContext) {
        if (!context.chain) {
            throw new Error('Chain not provided')
        }
        const currentChain = this.config.supportedChains?.find(
            (chain) => chain.name === context.chain?.name
        )
        if (!currentChain) {
            throw new Error(
                `Chain not supported. This plugin only supports ${this.config.supportedChains
                    ?.map((chain) => chain.name)
                    .join(', ')}`
            )
        }
        const qs = new URLSearchParams()
        qs.set('supported_chains', String(currentChain))
        if (context.appName) {
            qs.set('scope', String(context.appName))
        }

        const {ownerPublicKey, activePublicKey} = await this.retrievePublicKeys(currentChain.id)

        qs.set('owner_key', String(ownerPublicKey))
        qs.set('active_key', String(activePublicKey))
        const accountCreator = new AccountCreator({
            supportedChains: [String(currentChain.id)],
            fullCreationServiceUrl: `${this.accountCreationServiceUrl}?${qs.toString()}`,
            scope: context.appName || 'Antelope App',
        })
        const accountCreationResponse = await accountCreator.createAccount()

        if ('sa' in accountCreationResponse && 'sp' in accountCreationResponse) {
            return {
                accountName: accountCreationResponse.sa,
                chain: context.chain,
            }
        } else {
            throw new Error(accountCreationResponse.error)
        }
    }

    async initialize(context?: CreateAccountContext) {
        if (!this.provider) {
            this.provider = await getSnapsProvider()
        }
        if (this.provider && !this.installedSnap) {
            this.isFlask = await checkIsFlask(this.provider)
            await this.setSnap()
            if (!this.installedSnap) {
                context?.ui?.prompt({
                    title: 'Antelope Snap Setup Required',
                    body: `
                        It looks like the Antelope snap for MetaMask isn't installed yet.

                        Click the button below to go to our setup page:
                    `,
                    elements: [
                        {
                            type: 'button',
                            label: 'Go to Setup Page',
                            data: {
                                onClick: () => {
                                    window.open(this.setupPageUrl, '_blank')
                                },
                            },
                        },
                    ],
                })
            }
        }
    }

    async retrievePublicKeys(
        chainId: Checksum256Type
    ): Promise<{ownerPublicKey: string; activePublicKey: string}> {
        await this.initialize()
        if (!this.provider) {
            throw new Error('Metamask not found')
        }
        const ownerPublicKey = (await this.invokeSnap({
            method: 'antelope_getOwnerPublicKey',
            params: {chainId: String(chainId)},
        })) as string
        const activePublicKey = (await this.invokeSnap({
            method: 'antelope_getActivePublicKey',
            params: {chainId: String(chainId)},
        })) as string
        return {ownerPublicKey, activePublicKey}
    }

    async request({method, params}) {
        if (!this.provider) {
            throw new Error('Snap provider not found')
        }
        const data =
            (await this.provider.request({
                method,
                params,
            } as RequestArguments)) ?? null
        return data
    }

    async setSnap() {
        const snaps = (await this.request({
            method: 'wallet_getSnaps',
            params: {},
        })) as GetSnapsResponse
        this.installedSnap = snaps[this.snapOrigin] ?? null
    }

    async requestSnap(id?: string, version?: string) {
        const snapId = id || this.snapOrigin
        const snaps = (await this.request({
            method: 'wallet_requestSnaps',
            params: {
                [snapId]: version ? {version} : {},
            },
        })) as Record<string, Snap>
        this.installedSnap = snaps?.[snapId] ?? null
    }

    async invokeSnap({method, params}: InvokeSnapParams, id?: string) {
        const snapId = id || this.snapOrigin
        return this.request({
            method: 'wallet_invokeSnap',
            params: {snapId, request: {method, params}},
        })
    }
}
