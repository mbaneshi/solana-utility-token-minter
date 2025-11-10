import axios from 'axios';
import { logger } from './logger';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  enabled?: boolean;
  timeout?: number;
}

export class WebhookManager {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = {
      enabled: true,
      timeout: 5000,
      ...config,
    };
  }

  /**
   * Send webhook notification
   */
  async send(event: string, data: Record<string, any>): Promise<void> {
    if (!this.config.enabled) {
      logger.debug('Webhooks disabled, skipping notification');
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    try {
      logger.debug(`Sending webhook for event: ${event}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.secret) {
        headers['X-Webhook-Secret'] = this.config.secret;
      }

      await axios.post(this.config.url, payload, {
        headers,
        timeout: this.config.timeout,
      });

      logger.success(`Webhook sent for event: ${event}`);
    } catch (error) {
      logger.error(`Failed to send webhook: ${error}`);
      // Don't throw - webhooks should not break main flow
    }
  }

  /**
   * Send token minted notification
   */
  async notifyMint(mintAddress: string, amount: number, recipient: string): Promise<void> {
    await this.send('token.minted', {
      mintAddress,
      amount,
      recipient,
    });
  }

  /**
   * Send token burned notification
   */
  async notifyBurn(mintAddress: string, amount: number, account: string): Promise<void> {
    await this.send('token.burned', {
      mintAddress,
      amount,
      account,
    });
  }

  /**
   * Send token transferred notification
   */
  async notifyTransfer(
    mintAddress: string,
    amount: number,
    from: string,
    to: string
  ): Promise<void> {
    await this.send('token.transferred', {
      mintAddress,
      amount,
      from,
      to,
    });
  }

  /**
   * Send account frozen notification
   */
  async notifyFreeze(mintAddress: string, account: string): Promise<void> {
    await this.send('account.frozen', {
      mintAddress,
      account,
    });
  }

  /**
   * Send account thawed notification
   */
  async notifyThaw(mintAddress: string, account: string): Promise<void> {
    await this.send('account.thawed', {
      mintAddress,
      account,
    });
  }

  /**
   * Send authority changed notification
   */
  async notifyAuthorityChange(
    mintAddress: string,
    authorityType: string,
    newAuthority: string | null
  ): Promise<void> {
    await this.send('authority.changed', {
      mintAddress,
      authorityType,
      newAuthority,
      revoked: newAuthority === null,
    });
  }

  /**
   * Send airdrop completed notification
   */
  async notifyAirdropComplete(
    mintAddress: string,
    totalRecipients: number,
    totalAmount: number,
    successful: number,
    failed: number
  ): Promise<void> {
    await this.send('airdrop.completed', {
      mintAddress,
      totalRecipients,
      totalAmount,
      successful,
      failed,
    });
  }

  /**
   * Send supply alert notification
   */
  async notifySupplyAlert(
    mintAddress: string,
    currentSupply: number,
    threshold: number
  ): Promise<void> {
    await this.send('supply.alert', {
      mintAddress,
      currentSupply,
      threshold,
      exceeded: currentSupply > threshold,
    });
  }
}

/**
 * Create webhook manager from environment variables
 */
export function createWebhookManager(): WebhookManager | null {
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    return null;
  }

  return new WebhookManager({
    url: webhookUrl,
    secret: process.env.WEBHOOK_SECRET,
    enabled: process.env.WEBHOOK_ENABLED !== 'false',
  });
}
