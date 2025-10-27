import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';

/**
 * Base service for HEMIS entity synchronization
 * Provides common helper methods for all lookup entities
 */
@Injectable()
export class BaseEntitySyncService {
  private readonly logger = new Logger(BaseEntitySyncService.name);

  constructor() {}

  /**
   * Generic method to get or create a simple entity with code and name
   * Used for most HEMIS lookup entities like: gender, citizenship, country, etc.
   */
  async getOrCreateSimpleEntity<T extends { code: string; name: string; id: number }>(
    repository: Repository<T>,
    data: any,
    entityName: string,
  ): Promise<number | undefined> {
    if (!data || !data.code) return undefined;
    
    try {
      let entity = await repository.findOne({ where: { code: data.code } as any });
      if (!entity) {
        entity = await repository.save({
          code: data.code,
          name: data.name || '',
        } as any);
        this.logger.debug(`Created new ${entityName}: ${data.code}`);
      }
      return entity?.id;
    } catch (error) {
      this.logger.error(`Error syncing ${entityName}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Generic method to handle entities with custom logic
   * Takes a custom sync function
   */
  async getOrCreateCustom<T extends ObjectLiteral>(
    repository: Repository<T>,
    data: any,
    findPredicate: any,
    createFn: (data: any) => any,
    updateFn?: (entity: T, data: any) => any,
  ): Promise<number | undefined> {
    if (!data) return undefined;

    try {
      let entity = await repository.findOne({ where: findPredicate });
      
      if (!entity) {
        entity = await repository.save(createFn(data));
      } else if (updateFn) {
        await repository.update((entity as any).id, updateFn(entity, data));
      }
      
      return (entity as any).id;
    } catch (error) {
      this.logger.error(`Error in custom sync: ${error.message}`);
      return undefined;
    }
  }
}
