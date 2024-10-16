import { Filter, FilterResult } from './pool-filters';
import { Connection, Finality } from '@solana/web3.js';
import { LiquidityPoolKeysV4 } from '@raydium-io/raydium-sdk';
import { COMMITMENT_LEVEL, logger, PF_MIGRATION_WALLET } from '../helpers';

export class BurnFilter implements Filter {
  constructor(private readonly connection: Connection) {}

  async execute(poolKeys: LiquidityPoolKeysV4): Promise<FilterResult> {
    try {
      const isPumpFunToken = poolKeys.baseMint.toString().endsWith('pump');
      if (isPumpFunToken) {
        const lpMintSignature = await this.connection.getSignaturesForAddress(poolKeys.lpMint);
        const signatureData = await this.connection.getTransaction(lpMintSignature[0].signature, {
          maxSupportedTransactionVersion: 1,
          commitment: COMMITMENT_LEVEL as Finality,
        });

        const signerIsPumpFunMigrationAccount = signatureData?.transaction.message.staticAccountKeys
          .toString()
          .includes(PF_MIGRATION_WALLET);

        if (!signerIsPumpFunMigrationAccount) {
          return {
            ok: false,
            message: `PF -> Pump Fun token but signer is not Pump Fun Migration Account`,
          };
        }
      }

      const amount = await this.connection.getTokenSupply(poolKeys.lpMint, this.connection.commitment);
      const burned = amount.value.uiAmount === 0;
      return { ok: burned, message: burned ? undefined : "Burned -> Creator didn't burn LP" };
    } catch (e: any) {
      logger.error(e);
      if (e.code == -32602) {
        return { ok: true };
      }

      logger.error({ mint: poolKeys.baseMint }, `Failed to check if LP is burned`);
    }

    return { ok: false, message: 'Failed to check if LP is burned' };
  }
}
