import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  CreateNftInput,
  CreateNftOutput,
} from '@metaplex-foundation/js';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    category?: string;
    files?: Array<{
      uri: string;
      type: string;
    }>;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
  twitter?: string;
  discord?: string;
  telegram?: string;
}

export class MetadataManager {
  private metaplex: Metaplex;

  constructor(
    connection: Connection,
    payer: Keypair,
    private useArweave: boolean = true
  ) {
    this.metaplex = Metaplex.make(connection)
      .use(keypairIdentity(payer));

    if (useArweave) {
      this.metaplex.use(
        bundlrStorage({
          address: connection.rpcEndpoint.includes('devnet')
            ? 'https://devnet.bundlr.network'
            : 'https://node1.bundlr.network',
          providerUrl: connection.rpcEndpoint,
          timeout: 60000,
        })
      );
    }
  }

  /**
   * Upload image to decentralized storage
   */
  async uploadImage(imagePath: string): Promise<string> {
    try {
      logger.info('Uploading image to permanent storage...');

      const imageBuffer = fs.readFileSync(imagePath);
      const imageFile = toMetaplexFile(imageBuffer, path.basename(imagePath));

      const uri = await this.metaplex.storage().upload(imageFile);

      logger.success(`Image uploaded: ${uri}`);
      return uri;
    } catch (error) {
      logger.error('Failed to upload image:', error);
      throw error;
    }
  }

  /**
   * Create metadata JSON and upload
   */
  async uploadMetadata(metadata: TokenMetadata): Promise<string> {
    try {
      logger.info('Uploading metadata to permanent storage...');

      // Prepare metadata object - convert number values to strings
      const metadataObject: any = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        ...(metadata.externalUrl && { external_url: metadata.externalUrl }),
        ...(metadata.attributes && {
          attributes: metadata.attributes.map(attr => ({
            ...attr,
            value: String(attr.value)
          }))
        }),
        ...(metadata.properties && { properties: metadata.properties }),
      };

      const { uri } = await this.metaplex.nfts().uploadMetadata(metadataObject);

      logger.success(`Metadata uploaded: ${uri}`);
      return uri;
    } catch (error) {
      logger.error('Failed to upload metadata:', error);
      throw error;
    }
  }

  /**
   * Create on-chain metadata for token
   */
  async createTokenMetadata(
    mint: PublicKey,
    metadataUri: string,
    name: string,
    symbol: string,
    updateAuthority?: Keypair
  ): Promise<CreateNftOutput> {
    try {
      logger.info('Creating on-chain metadata...');

      const { nft } = await this.metaplex.nfts().create({
        uri: metadataUri,
        name: name,
        symbol: symbol,
        sellerFeeBasisPoints: 0, // No seller fees for utility tokens
        isMutable: true, // Allow metadata updates
        tokenStandard: 0 as any, // Fungible token
        ...(updateAuthority && { updateAuthority }),
      } as any);

      logger.success(`Metadata created: ${nft.address.toBase58()}`);
      return { nft } as CreateNftOutput;
    } catch (error) {
      logger.error('Failed to create metadata:', error);
      throw error;
    }
  }

  /**
   * Update existing metadata
   */
  async updateMetadata(
    mint: PublicKey,
    newMetadataUri: string,
    updateAuthority: Keypair
  ): Promise<void> {
    try {
      logger.info('Updating metadata...');

      const nft = await this.metaplex.nfts().findByMint({ mintAddress: mint });

      await this.metaplex.nfts().update({
        nftOrSft: nft,
        uri: newMetadataUri,
        updateAuthority,
      });

      logger.success('Metadata updated successfully');
    } catch (error) {
      logger.error('Failed to update metadata:', error);
      throw error;
    }
  }

  /**
   * Get metadata for a token
   */
  async getMetadata(mint: PublicKey): Promise<any> {
    try {
      const nft = await this.metaplex.nfts().findByMint({ mintAddress: mint });
      return nft;
    } catch (error) {
      logger.error('Failed to get metadata:', error);
      throw error;
    }
  }

  /**
   * Complete metadata creation workflow
   */
  async createCompleteMetadata(
    mint: PublicKey,
    metadata: TokenMetadata,
    imagePath?: string,
    updateAuthority?: Keypair
  ): Promise<{ metadataUri: string; metadataAddress: PublicKey }> {
    try {
      logger.section('Creating Complete Token Metadata');

      // Upload image if provided
      let imageUri = metadata.image;
      if (imagePath && fs.existsSync(imagePath)) {
        imageUri = await this.uploadImage(imagePath);
      }

      // Update metadata with image URI
      const updatedMetadata = { ...metadata, image: imageUri };

      // Add standard attributes
      if (!updatedMetadata.attributes) {
        updatedMetadata.attributes = [];
      }
      updatedMetadata.attributes.push(
        { trait_type: 'Token Type', value: 'Utility' },
        { trait_type: 'Blockchain', value: 'Solana' },
        { trait_type: 'Standard', value: 'SPL Token' }
      );

      // Upload metadata JSON
      const metadataUri = await this.uploadMetadata(updatedMetadata);

      // Create on-chain metadata
      const { nft } = await this.createTokenMetadata(
        mint,
        metadataUri,
        metadata.name,
        metadata.symbol,
        updateAuthority
      );

      logger.success('Complete metadata created successfully!');
      logger.table({
        'Metadata URI': metadataUri,
        'Metadata Account': nft.address.toBase58(),
        'Image URI': imageUri,
      });

      return {
        metadataUri,
        metadataAddress: nft.address,
      };
    } catch (error) {
      logger.error('Failed to create complete metadata:', error);
      throw error;
    }
  }

  /**
   * Generate metadata JSON file locally
   */
  static generateMetadataFile(
    metadata: TokenMetadata,
    outputPath: string
  ): void {
    try {
      const metadataObject = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.externalUrl,
        attributes: metadata.attributes || [
          { trait_type: 'Token Type', value: 'Utility' },
          { trait_type: 'Blockchain', value: 'Solana' },
          { trait_type: 'Standard', value: 'SPL Token' },
        ],
        properties: metadata.properties || {
          category: 'utility',
          files: [
            {
              uri: metadata.image,
              type: 'image/png',
            },
          ],
        },
      };

      fs.writeFileSync(
        outputPath,
        JSON.stringify(metadataObject, null, 2),
        'utf-8'
      );

      logger.success(`Metadata file generated: ${outputPath}`);
    } catch (error) {
      logger.error('Failed to generate metadata file:', error);
      throw error;
    }
  }

  /**
   * Validate metadata structure
   */
  static validateMetadata(metadata: TokenMetadata): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!metadata.name || metadata.name.length > 32) {
      errors.push('Name is required and must be max 32 characters');
    }

    if (!metadata.symbol || metadata.symbol.length > 10) {
      errors.push('Symbol is required and must be max 10 characters');
    }

    if (!metadata.description) {
      errors.push('Description is required');
    }

    if (!metadata.image) {
      errors.push('Image URI is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
