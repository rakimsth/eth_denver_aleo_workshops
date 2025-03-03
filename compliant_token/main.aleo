import credits.aleo;
import token_registry.aleo;

// Program Name
program whitelisted_token.aleo {
    
    // Admin address (only admin can modify the whitelist and allowed jurisdictions)
    const ADMIN_ADDRESS: address = aleo1f9rwrqkpng27xmuf630xuup479mcyl6etnzwu74v3329jg06zcxq7wktzl;

    // Unique token identifier
    const TOKEN_ID: field = 71619063553950105623552field;

    // Whitelist mapping: stores approved addresses
    mapping whitelist: address => bool;

    // Jurisdiction mapping: stores allowed country codes (ISO 3166-1 alpha-2 codes)
    mapping allowed_jurisdictions: string => bool;

    /**
     * Admin adds an address to the whitelist.
     */
    transition add_to_whitelist(user: address) {
        assert_eq(self.caller, ADMIN_ADDRESS); // Only admin can add to the whitelist
        whitelist.set(user, true);
    }

    /**
     * Admin removes an address from the whitelist.
     */
    transition remove_from_whitelist(user: address) {
        assert_eq(self.caller, ADMIN_ADDRESS); // Only admin can remove from the whitelist
        whitelist.remove(user);
    }

    /**
     * Admin adds an allowed jurisdiction (country code).
     */
    transition add_allowed_jurisdiction(country_code: string) {
        assert_eq(self.caller, ADMIN_ADDRESS); // Only admin can manage jurisdictions
        allowed_jurisdictions.set(country_code, true);
    }

    /**
     * Admin removes an allowed jurisdiction.
     */
    transition remove_allowed_jurisdiction(country_code: string) {
        assert_eq(self.caller, ADMIN_ADDRESS);
        allowed_jurisdictions.remove(country_code);
    }

    /**
     * Transfers tokens but ensures:
     * 1. The recipient is whitelisted.
     * 2. The recipient's jurisdiction is allowed.
     */
    async transition transfer_compliant(
        input_token: token_registry.aleo/Token, // Token being transferred
        amount: u128, // Amount to transfer
        recipient: address, // Recipient address
        recipient_country: string // Recipient’s country code (ISO 3166-1 alpha-2)
    ) -> (token_registry.aleo/Token, token_registry.aleo/Token, Future) {
        
        // Ensure the recipient is whitelisted
        let is_whitelisted: bool = whitelist.contains(recipient);
        assert(is_whitelisted); // Prevent transfers to non-whitelisted addresses

        // Ensure the recipient's jurisdiction is allowed
        let is_jurisdiction_allowed: bool = allowed_jurisdictions.contains(recipient_country);
        assert(is_jurisdiction_allowed); // Prevent transfers to restricted countries

        // **Authorize the token for transfer**
        let prehook_output: (token_registry.aleo/Token, token_registry.aleo/Token, Future) = token_registry.aleo/prehook_private(
            input_token,
            amount,
            4294967295u32 // Maximum expiration time
        );

        // **Transfer to recipient**
        let transfer_output: (token_registry.aleo/Token, token_registry.aleo/Token, Future) = token_registry.aleo/transfer_private(
            recipient,
            amount,
            prehook_output.1
        );

        return (
            prehook_output.0,    // Remaining balance from authorization
            transfer_output.1,   // Transferred token amount
            finalize_transfer(transfer_output.2) // Await finalization
        );
    }

    /**
     * Finalizes the transfer process.
     */
    async function finalize_transfer(f: Future) {
        f.await();
    }
}
