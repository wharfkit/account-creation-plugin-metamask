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

const DEFAULT_SNAP_ORIGIN = 'local:http://localhost:8080'
const ACCOUNT_CREATION_SERVICE_URL =
    'https://adding-login-through-apple.account-creation-portal.pages.dev/buy'

export class AccountCreationPluginMetamask
    extends AbstractAccountCreationPlugin
    implements AccountCreationPlugin
{
    public installedSnap: Snap | null = null
    public provider: MetaMaskInpageProvider | null = null
    public isFlask = false

    readonly config: AccountCreationPluginConfig = {
        requiresChainSelect: true,
        supportedChains: [Chains.EOS, Chains.Jungle4],
    }

    readonly metadata: AccountCreationPluginMetadata = AccountCreationPluginMetadata.from({
        name: 'Account Creation Plugin Metamask',
        description: 'Plugin to create EOS accounts using Metamask public key.',
    })

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

        const publicKey = await this.retrievePublicKey(currentChain.id)

        qs.set('owner_key', String(publicKey))
        qs.set('active_key', String(publicKey))
        const accountCreator = new AccountCreator({
            supportedChains: [String(currentChain.id)],
            fullCreationServiceUrl: `${ACCOUNT_CREATION_SERVICE_URL}?${qs.toString()}`,
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

    async initialize() {
        if (!this.provider) {
            this.provider = await getSnapsProvider()
        }
        if (this.provider && !this.installedSnap) {
            this.isFlask = await checkIsFlask(this.provider)
            await this.setSnap()
            if (!this.installedSnap) {
                await this.requestSnap()
                if (this.installedSnap) {
                    await this.initialize()
                }
            }
        }
    }

    async retrievePublicKey(chainId: Checksum256Type): Promise<PublicKey> {
        await this.initialize()
        if (!this.provider) {
            throw new Error('Metamask not found')
        }
        const result = (await this.invokeSnap({
            method: 'antelope_getPublicKey',
            params: {chainId: String(chainId)},
        })) as string
        return PublicKey.from(result)
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
        this.installedSnap = snaps[DEFAULT_SNAP_ORIGIN] ?? null
    }

    async requestSnap(id?: string, version?: string) {
        const snapId = id || DEFAULT_SNAP_ORIGIN
        const snaps = (await this.request({
            method: 'wallet_requestSnaps',
            params: {
                [snapId]: version ? {version} : {},
            },
        })) as Record<string, Snap>
        this.installedSnap = snaps?.[snapId] ?? null
    }

    async invokeSnap({method, params}: InvokeSnapParams, id?: string) {
        const snapId = id || DEFAULT_SNAP_ORIGIN
        return this.request({
            method: 'wallet_invokeSnap',
            params: {snapId, request: {method, params}},
        })
    }
}
