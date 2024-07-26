import {assert} from 'chai'
import {Chains, PermissionLevel, SessionKit} from '@wharfkit/session'
import {
    mockChainDefinition,
    mockPermissionLevel,
    mockSessionKitArgs,
    mockSessionKitOptions,
} from '@wharfkit/mock-data'

import {AccountCreationPluginTEMPLATE} from '$lib'

suite('AccountCreationPluginTEMPLATE', function () {
    test('createAccount', async function () {
        // const kit = new SessionKit(
        //     {
        //         ...mockSessionKitArgs,
        //         accountCreationPlugins: [new AccountCreationPluginTEMPLATE()],
        //     },
        //     mockSessionKitOptions
        // )
        // const result = await kit.createAccount({
        //     chain: mockChainDefinition.id,
        //     permissionLevel: mockPermissionLevel,
        // })
        // Add your own assertions here...
    })
})
