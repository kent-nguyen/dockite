import { Document, DocumentRevision, Field } from '@dockite/database';
import GraphQLJSON from 'graphql-type-json';
import { omitBy } from 'lodash';
import {
  Arg,
  Field as GraphQLField,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { getManager, getRepository } from 'typeorm';

import { Authenticated, Authorized } from '../../../common/decorators';
import { DockiteEvents } from '../../../events';

@ObjectType()
class ManyFields {
  @GraphQLField(_type => [Field])
  results!: Field[];

  @GraphQLField(_type => Int)
  totalItems!: number;

  @GraphQLField(_type => Int)
  currentPage!: number;

  @GraphQLField(_type => Int)
  totalPages!: number;

  @GraphQLField(_type => Boolean)
  hasNextPage!: boolean;
}

@Resolver(_of => Field)
export class FieldResolver {
  @Authenticated()
  @Authorized('internal:schema:update', { derriveAlternativeScopes: false })
  @Query(_returns => Field, { nullable: true })
  async getField(@Arg('id') id: string): Promise<Field | null> {
    const repository = getRepository(Field);

    const field = await repository.findOne({
      where: { id, deletedAt: null },
    });

    return field ?? null;
  }

  @Authenticated()
  @Authorized('internal:schema:read', {
    derriveAlternativeScopes: true,
    fieldsOrArgsToPeek: ['schemaId'],
  })
  @Query(_returns => ManyFields)
  async allFields(
    @Arg('page', _type => Int, { defaultValue: 1 })
    page: number,
    @Arg('perPage', _type => Int, { defaultValue: 20 })
    perPage: number,
  ): Promise<ManyFields> {
    const repository = getRepository(Field);

    const [results, totalItems] = await repository.findAndCount({
      where: { deletedAt: null },
      take: perPage,
      skip: perPage * (page - 1),
    });

    const totalPages = Math.ceil(totalItems / perPage);

    return {
      results,
      totalItems,
      currentPage: page,
      hasNextPage: page < totalPages,
      totalPages,
    };
  }

  /**
   * TODO: Perform light validation on fields, settings, groups
   */
  @Authenticated()
  @Authorized('internal:schema:update', { derriveAlternativeScopes: false })
  @Mutation(_returns => Field)
  async createField(
    @Arg('name') name: string,
    @Arg('title') title: string,
    @Arg('description') description: string,
    @Arg('type') type: string,
    // eslint-disable-next-line
    @Arg('settings', _type => GraphQLJSON) settings: Record<string, any>,
    @Arg('schemaId') schemaId: string,
  ): Promise<Field | null> {
    const repository = getRepository(Field);

    const field = repository.create({
      name,
      title,
      description,
      type,
      settings,
      schemaId,
    });

    await this.handleReviseAllDocuments(field.schemaId);

    const savedField = await repository.save(field);

    DockiteEvents.emit('reload');

    return savedField;
  }

  @Authenticated()
  @Authorized('internal:schema:update', { derriveAlternativeScopes: false })
  @Mutation(_returns => Field)
  async updateField(
    @Arg('id') id: string,
    @Arg('name', { nullable: true }) name: string,
    @Arg('title', { nullable: true }) title: string,
    @Arg('description', { nullable: true }) description: string,
    @Arg('type', { nullable: true }) type: string,
    // eslint-disable-next-line
    @Arg('settings', _type => GraphQLJSON, {nullable: true}) settings: Record<string, any>,
  ): Promise<Field | null> {
    const fieldRepository = getRepository(Field);
    const documentRepository = getRepository(Document);

    try {
      const field = await fieldRepository.findOneOrFail(id);

      const attributes = omitBy(
        {
          title,
          name,
          description,
          type,
          settings,
        },
        x => x === null,
      );

      if (name !== field.name) {
        await this.handleReviseAllDocuments(field.schemaId);

        await documentRepository
          .createQueryBuilder('document')
          .update()
          .set({
            data: () =>
              `data - '${field.name}' || jsonb_build_object('${name}', data->'${field.name}')`,
          })
          .where('schemaId = :schemaId', { schemaId: field.schemaId })
          .andWhere('data ? :fieldName', { fieldName: field.name })
          .execute();
      }

      const savedField = await fieldRepository.save({
        ...field,
        ...attributes,
      });

      DockiteEvents.emit('reload');

      return savedField;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  /**
   * TODO: Possibly add a check for if the Field exists and throw
   */
  @Authenticated()
  @Authorized('internal:schema:update', { derriveAlternativeScopes: false })
  @Mutation(_returns => Boolean)
  async removeField(@Arg('id') id: string): Promise<boolean> {
    const repository = getRepository(Field);

    try {
      const field = await repository.findOneOrFail(id);

      await this.handleReviseAllDocuments(field.schemaId);

      await repository.delete(field.id);

      DockiteEvents.emit('reload');

      return true;
    } catch {
      return false;
    }
  }

  private async handleReviseAllDocuments(schemaId: string): Promise<void> {
    const documentRepository = getRepository(Document);
    const revisionRepository = getRepository(DocumentRevision);

    // Create the corresponding revisions
    await getManager().query(
      `
        INSERT INTO ${revisionRepository.metadata.tableName} ("documentId", "data", "userId", "schemaId")
        SELECT d."id", d."data", d."userId", d."schemaId"
        FROM ${documentRepository.metadata.tableName} d
        WHERE d."schemaId" = $1
        `,
      [schemaId],
    );
  }
}
