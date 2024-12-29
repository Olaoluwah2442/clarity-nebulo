import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can create user profile",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('nebulo_social', 'create-profile', [
                types.ascii("user1"),
                types.utf8("My bio")
            ], wallet_1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        
        let profileBlock = chain.mineBlock([
            Tx.contractCall('nebulo_social', 'get-profile', [
                types.principal(wallet_1.address)
            ], wallet_1.address)
        ]);
        
        const profile = profileBlock.receipts[0].result.expectOk().expectSome();
        assertEquals(profile['username'], "user1");
    }
});

Clarinet.test({
    name: "Can create and tip posts",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        // First mint some tokens
        let mintBlock = chain.mineBlock([
            Tx.contractCall('nebulo_social', 'mint-tokens', [
                types.uint(1000),
                types.principal(wallet_1.address)
            ], deployer.address)
        ]);
        
        mintBlock.receipts[0].result.expectOk();
        
        // Create a post
        let postBlock = chain.mineBlock([
            Tx.contractCall('nebulo_social', 'create-post', [
                types.utf8("Hello Nebulo!")
            ], wallet_2.address)
        ]);
        
        postBlock.receipts[0].result.expectOk();
        const postId = postBlock.receipts[0].result.expectOk();
        
        // Tip the post
        let tipBlock = chain.mineBlock([
            Tx.contractCall('nebulo_social', 'tip-post', [
                postId,
                types.uint(100)
            ], wallet_1.address)
        ]);
        
        tipBlock.receipts[0].result.expectOk();
    }
});

Clarinet.test({
    name: "Can follow users and like posts",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('nebulo_social', 'follow-user', [
                types.principal(wallet_2.address)
            ], wallet_1.address),
            
            Tx.contractCall('nebulo_social', 'create-post', [
                types.utf8("Test post")
            ], wallet_2.address),
            
            Tx.contractCall('nebulo_social', 'like-post', [
                types.uint(0)
            ], wallet_1.address)
        ]);
        
        block.receipts.forEach(receipt => {
            receipt.result.expectOk();
        });
    }
});