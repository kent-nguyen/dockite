import { Document, Field } from '@dockite/database';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  getRepository,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';

@EventSubscriber()
export class FieldSubscriber implements EntitySubscriberInterface {
  listenTo(): typeof Field {
    return Field;
  }

  async beforeInsert(event: InsertEvent<Field>): Promise<void> {
    const { entity } = event;

    const f = new Field();

    f.setDockiteField.apply(entity);

    if (!entity.dockiteField) {
      return;
    }

    await entity.dockiteField.onFieldCreate();
  }

  async beforeUpdate(event: UpdateEvent<Field>): Promise<void> {
    const { entity } = event;

    const f = new Field();

    f.setDockiteField.apply(entity);

    if (!entity.dockiteField) {
      return;
    }

    await entity.dockiteField.onFieldUpdate();
  }

  async afterInsert(event: InsertEvent<Field>): Promise<void> {
    console.log('field update');
    await getRepository(Document)
      .createQueryBuilder()
      .update()
      .set({
        data: () =>
          `data || '{ "${event.entity.name}": ${this.dataToJSONBValue(
            event.entity.settings.default !== undefined
              ? event.entity.settings.default
              : event.entity.dockiteField?.defaultValue(),
          )} }'`,
        updatedAt: () => '"updatedAt"',
      })
      .where('schemaId = :schemaId', { schemaId: event.entity.schemaId })
      .andWhere('data ->> :fieldName IS NULL', { fieldName: event.entity.name })
      .callListeners(false)
      .execute();
  }

  async beforeRemove(event: RemoveEvent<Field>): Promise<void> {
    await getRepository(Document)
      .createQueryBuilder()
      .update()
      .set({
        data: () => `data - '${event.entity?.name}'`,
        updatedAt: () => '"updatedAt"',
      })
      .callListeners(false)
      .where('schemaId = :schemaId', { schemaId: event.entity?.schemaId })
      .execute();
  }

  private dataToJSONBValue(data: any): any {
    if (typeof data === 'string') {
      return `${JSON.stringify(data)}`;
    }

    if (typeof data === 'boolean') {
      return data;
    }

    if (typeof data === 'number') {
      return data;
    }

    if (typeof data === 'undefined' || data === null) {
      return null;
    }

    if (data instanceof Date) {
      return `${JSON.stringify(data.toISOString())}"`;
    }

    return `${JSON.stringify(data)}`;
  }
}
