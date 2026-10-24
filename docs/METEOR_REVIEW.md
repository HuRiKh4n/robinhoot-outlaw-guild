# Meteor account-only integration review

Reviewed October 23, 2026 against the current npm release artifacts and official Meteor documentation.

## Finding

A supported account-only flow exists in `@meteorwallet/sdk@3.24.0`. Use `MeteorConnect.createAction({ id: 'near::sign_in', input: { target: { blockchain: 'near', network: 'mainnet' } } })`, then `promptForExecution()`. Do not pass `addFunctionCallKey`, legacy `contract`, or message parameters. Do not use `near::sign_in_and_sign_message`.

The previous exclusion applied to the legacy Selector adapter, not to the current standalone SDK. The newer SDK explicitly documents optional function-call keys and an account-only sign-in type.

## Official sources and compatibility

- [Meteor's integration guide](https://github.com/Meteor-Wallet/meteor-public#integrate-meteor-into-your-dapp) recommends Selector but shows the older contract-based API.
- [Official SDK 3.24.0 documentation and package](https://www.npmjs.com/package/@meteorwallet/sdk/v/3.24.0) documents account-only `near::sign_in`, optional `addFunctionCallKey`, restoration, sign-out, and the mobile bridge.
- [Published SDK artifact](https://registry.npmjs.org/@meteorwallet/sdk/-/sdk-3.24.0.tgz) includes `README.md`, `SECURITY.md`, `dist/index.js` and TypeScript declarations. These were inspected directly rather than relying on the old API-reference website.
- [Meteor's public security documentation](https://github.com/Meteor-Wallet/meteor-public/blob/main/meteor-v2/SECURITY-PUBLIC.md) describes the encrypted mobile bridge and its security boundaries.
- [Selector Meteor adapter 10.1.4](https://www.npmjs.com/package/@near-wallet-selector/meteor-wallet/v/10.1.4) still pins SDK `1.0.24`. Its `signIn` chooses `ALL_METHODS`/`SELECTED_METHODS` and the SDK generates and saves a key even with an empty contract value. Omitting contractId is not a reliable account-only integration with that adapter.
- [Meteor's separately published Selector adapter 7.0.3](https://www.npmjs.com/package/@meteorwallet/wallet-selector/v/7.0.3) pins Selector 7.0.3 and SDK `^0.6.0`; it is not a bridge to SDK 3.x.
- [Selector Meteor app adapter 10.1.4](https://www.npmjs.com/package/@near-wallet-selector/meteor-wallet-app/v/10.1.4) is for Meteor's in-app environment and documents a required contract ID. It is not a general Android Chrome/desktop solution.

The revision therefore uses the official SDK directly. It removes Selector and MyNearWallet instead of silently overriding an old adapter's SDK dependency across incompatible API versions. The SDK is framework-independent and dynamically imported after React mounts; its own popup is a shadow-DOM web component. Shared initialization and subscription cleanup support React 19 Strict Mode.

## Code paths verified in SDK 3.24.0

1. `IMCAInput_Near_SignIn` makes `addFunctionCallKey` and legacy `contract` optional.
2. The web/extension `MeteorWallet.requestSignIn` creates `KeyPair.fromRandom` only when a function-call key definition exists and lacks a public key. Keystore `setKey` runs only when that key pair was generated. With both options omitted, the wallet login receives no public key, contract ID or message-signing parameters.
3. The mobile `nearActionToMobileBridge` path normalizes the same two optional fields. Its key generation is conditional on that definition; the account-only action carries `network` with no function-call-key definition.
4. `near::sign_out` with an account having an empty `publicKeys` array is local cleanup. No on-chain revocation transaction is requested by this phase.

RobinHoot adds a keystore that rejects NEAR key writes and reads, exposes only connection operations to the UI, rejects unexpected key-bearing connection results, and does not restore key-bearing sessions. No mock approval or dummy contract is used to make a permission request appear read-only.

## Permissions and security implications

Account-only connection shares a public NEAR account ID with RobinHoot. It grants no contract methods, fee allowance, transaction permission or NEP-413 signing authorization. This is not a cryptographically authenticated user session or proof of token ownership. Browser-stored account metadata is untrusted.

The mobile bridge generates and persists cryptographic transport identities used to authenticate/encrypt bridge communication. Those are distinct from NEAR account access keys: they are not added to the NEAR account and grant no NEAR signing authority. Do not describe this SDK as generating no cryptographic keys at all. Account metadata and bridge state are isolated under the `robinhoot:meteor:` storage namespace.

If function-call authorization is added in a future phase, users must explicitly approve the contract, method allowlist and gas allowance. `ALL_METHODS` means all methods on the specified receiver, not full access to the entire wallet, but it still authorizes contract calls. A stolen browser-stored key can use its allowed methods until revoked or exhausted. Such calls can have application-level consequences even without native token-transfer permission. The safest future option is no key at all; otherwise use a reviewed contract, narrow method allowlist and bounded allowance, never full access or a fabricated contract. Revocation must be explained separately from local disconnect. None of that authorization is implemented here.

## Browser support and validation boundary

- Desktop: official SDK choice of Meteor Web popup or installed compatible Meteor extension.
- Android Chrome: Meteor Web popup/tab or the official Meteor Mobile pairing/Open flow. The bridge is enabled with RobinHoot partner metadata and production backend defaults. No custom deep-link construction, permission bypass, or account-transfer flow is enabled.
- The SDK popup mounts outside RobinHoot's native dialog, so RobinHoot closes its dialog before handing over focus. Blocking popups or cancelling returns to a retryable RobinHoot state. Drafts remain available.
- Run the preview as a top-level HTTPS page. Mobile pairing requires Meteor's bridge/backend and installed mobile app to be reachable and supported. If pairing is unavailable, the SDK may offer only Meteor Web.
- Automated tests use the real SDK on desktop and Pixel 7 Chromium emulation, mocking external web/extension responses. They inspect outgoing mainnet login payloads, empty authorized-key metadata, session restoration, switching, disconnect, cancellation, popup blocking and storage failure. They do not prove actual on-chain state or live wallet UI behavior.
- Physical Android pairing, PIN exchange, app handoff/return, and live Meteor Web/extension account selection remain mandatory preview acceptance checks. Reject any unexpected AddKey, transaction or signing prompt.

## Dependency limitations

The SDK currently pins nanoid 5.1.5; this project overrides that dependency to patched 5.1.16 within the same major. Next.js's PostCSS override remains 8.5.31. The SDK's query-string chain still includes a moderate decode-uri-component denial-of-service advisory, and the NEAR cryptography chain includes a low elliptic advisory. These findings remain; connection tests are not a full SDK security audit. Normal account connection exposes no signing action. Phase 7A adds a separately gated, explicit NEP-413 identity proof; see PHASE_7A_IDENTITY.md. The decode-uri-component fix changes to an ESM-only release outside the declared dependency range; it is not silently forced into the legacy parser. Review upstream updates before expanding scope.

## Phase 7A addendum

The installed official SDK also supports `near::sign_message` for a connected account. This is now exposed only through the separately configured identity page after explicit action, not through normal Connect. It supplies a server-issued message/recipient/nonce with no contract, access key or callback. Physical wallet compatibility and the hosted authenticated end-to-end flow remain unaccepted. See [the Phase 7A report](PHASE_7A_IDENTITY.md).
