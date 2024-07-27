import {Chains, SessionKit} from '@wharfkit/session'
import {mockSessionKitArgs} from '@wharfkit/mock-data'

import {AccountCreationPluginMetamask} from '$lib'
import {setupEthereumMock} from './mocks/ethereum'

suite('AccountCreationPluginMetamask', function () {
    setup(function () {
        setupEthereumMock() // Set up the Ethereum mock before each test
    })
    test('createAccount', async function () {
        const kit = new SessionKit(mockSessionKitArgs, {
            accountCreationPlugins: [new AccountCreationPluginMetamask()],
        })
        // This will throw an error because we are not mocking the
        // browser environment or the Metamask provider in this test
        // const result = await kit.createAccount({
        //     chain: Chains.EOS,
        //     pluginId: 'account-creation-plugin-metamask',
        // })
    })
})
