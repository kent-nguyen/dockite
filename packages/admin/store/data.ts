import { Document, Schema, User, Role } from '@dockite/database';
import { DockiteFieldStatic } from '@dockite/types';
import Vue from 'vue';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

import { RootState } from '.';

import {
  AllDocumentsWithSchemaQueryResponse,
  AllDocumentsWithSchemaResultItem,
  AllSchemasQueryResponse,
  AllSchemasResultItem,
  FindDocumentResultItem,
  FindDocumentsQueryResponse,
  GetDocumentQueryResponse,
  GetUserQueryResponse,
  AvailableFieldsQueryResponse,
  GetSchemaWithFieldsQueryResponse,
  ManyResultSet,
  AllWebhooksQueryResponse,
  AllWebhooksResultItem,
  FindWebhookCallsQueryResponse,
  FindWebhookCallsResultItem,
  SearchDocumentsWithSchemaResultItem,
  SearchDocumentsWithSchemaQueryResponse,
  AllSchemaRevisionsResultItem,
  AllSchemaRevisionsQueryResponse,
  AllDocumentRevisionsQueryResponse,
  AllDocumentRevisionsResultItem,
  AllUsersResultItem,
  AllUsersQueryResponse,
  AllRolesQueryResponse,
  AllRolesResultItem,
  AllScopesQueryResponse,
  GetRoleQueryResponse,
} from '~/common/types';
import AllDocumentRevisionsQuery from '~/graphql/queries/all-document-revisions.gql';
import AllDocumentsWithSchemaQuery from '~/graphql/queries/all-documents-with-schema.gql';
import AllRolesQuery from '~/graphql/queries/all-roles.gql';
import AllSchemaRevisionsQuery from '~/graphql/queries/all-schema-revisions.gql';
import AllSchemasQuery from '~/graphql/queries/all-schemas.gql';
import AllScopesQuery from '~/graphql/queries/all-scopes.gql';
import AllUsersQuery from '~/graphql/queries/all-users.gql';
import AllWebhooksQuery from '~/graphql/queries/all-webhooks.gql';
import AvailableFieldsQuery from '~/graphql/queries/available-fields.gql';
import FindDocumentsBySchemaIdQuery from '~/graphql/queries/find-documents-by-schema-id.gql';
import FindDocumentsBySchemaIdsQuery from '~/graphql/queries/find-documents-by-schema-ids.gql';
import FindWebhookCallsByWebhookIdQuery from '~/graphql/queries/find-webhook-calls-by-webhook-id.gql';
import GetDocumentQuery from '~/graphql/queries/get-document.gql';
import GetRoleQuery from '~/graphql/queries/get-role.gql';
import GetSchemaWithFieldsQuery from '~/graphql/queries/get-schema-with-fields.gql';
import GetUserQuery from '~/graphql/queries/get-user.gql';
import SearchDocumentsWithSchemaQuery from '~/graphql/queries/search-documents-with-schema.gql';

export interface DataState {
  allSchemas: ManyResultSet<AllSchemasResultItem>;
  allSchemaRevisions: ManyResultSet<AllSchemaRevisionsResultItem>;
  allDocumentRevisions: ManyResultSet<AllDocumentRevisionsResultItem>;
  allWebhooks: ManyResultSet<AllWebhooksResultItem>;
  allUsers: ManyResultSet<AllUsersResultItem>;
  allRoles: ManyResultSet<AllRolesResultItem>;
  allScopes: string[];
  allDocumentsWithSchema: ManyResultSet<AllDocumentsWithSchemaResultItem>;
  searchDocumentsWithSchema: ManyResultSet<SearchDocumentsWithSchemaResultItem>;
  getDocument: Record<string, Document>;
  getUser: Record<string, Omit<User, 'handleNormalizeScopes'>>;
  getRole: Record<string, Role>;
  getSchemaWithFields: Record<string, Schema>;
  findDocumentsBySchemaId: ManyResultSet<FindDocumentResultItem>;
  findDocumentsBySchemaIds: ManyResultSet<FindDocumentResultItem>;
  availableFields: DockiteFieldStatic[];
  findWebhookCallsByWebhookId: ManyResultSet<FindWebhookCallsResultItem>;
}

export const namespace = 'data';

const makeEmptyResultSet = <T>(): ManyResultSet<T> => {
  return {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  };
};

export const state = (): DataState => ({
  allSchemas: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  allWebhooks: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  allUsers: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  allRoles: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  allScopes: [],
  allDocumentsWithSchema: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  allSchemaRevisions: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  allDocumentRevisions: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  searchDocumentsWithSchema: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  getDocument: {},
  getUser: {},
  getRole: {},
  getSchemaWithFields: {},
  findDocumentsBySchemaId: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  findDocumentsBySchemaIds: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
  availableFields: [],
  findWebhookCallsByWebhookId: {
    results: [],
    totalItems: null,
    totalPages: null,
    currentPage: null,
    hasNextPage: null,
  },
});

export const getters: GetterTree<DataState, RootState> = {
  getDocumentById: state => (id: string): Document | null => {
    return state.getDocument[id] ?? null;
  },

  getUserById: state => (id: string): Omit<User, 'handleNormalizeScopes'> | null => {
    return state.getUser[id] ?? null;
  },

  getRoleByName: state => (name: string): Role | null => {
    return state.getRole[name] ?? null;
  },

  getSchemaNameById: state => (id: string): string => {
    const schema = state.allSchemas.results.find(schema => schema.id === id);

    return schema ? schema.title : '';
  },

  getSchemaWithFieldsById: state => (id: string): Schema | null => {
    const schema = state.getSchemaWithFields[id];

    return schema ?? null;
  },
};

export const actions: ActionTree<DataState, RootState> = {
  async fetchAllSchemas({ commit }, payload: boolean = false): Promise<void> {
    const { data } = await this.$apolloClient.query<AllSchemasQueryResponse>({
      query: AllSchemasQuery,
      fetchPolicy: payload ? 'no-cache' : 'cache-first',
    });

    if (!data.allSchemas) {
      throw new Error('graphql: allSchemas could not be fetched');
    }

    commit('setAllSchemas', data);
  },

  async fetchAllDocumentsWithSchema({ commit }, payload = 1): Promise<void> {
    const { data } = await this.$apolloClient.query<AllDocumentsWithSchemaQueryResponse>({
      query: AllDocumentsWithSchemaQuery,
      variables: { page: payload },
    });

    if (!data.allDocuments) {
      throw new Error('graphql: allDocumentsWithSchema could not be fetched');
    }

    commit('setAllDocumentsWithSchema', data);
  },

  async fetchAllSchemaRevisionsForSchema(
    { commit },
    payload: { schemaId: string; perPage?: Number },
  ): Promise<void> {
    const { data } = await this.$apolloClient.query<AllSchemaRevisionsQueryResponse>({
      query: AllSchemaRevisionsQuery,
      fetchPolicy: 'no-cache',
      variables: {
        schemaId: payload.schemaId,
        perPage: payload.perPage ?? null,
      },
    });

    if (!data.allSchemaRevisions) {
      throw new Error('graphql: allSchemaRevisions could not be fetched');
    }

    commit('setAllSchemaRevisionsForSchema', data);
  },
  async fetchAllDocumentRevisionsForDocument(
    { commit },
    payload: { documentId: string; perPage?: Number },
  ): Promise<void> {
    const { data } = await this.$apolloClient.query<AllDocumentRevisionsQueryResponse>({
      query: AllDocumentRevisionsQuery,
      fetchPolicy: 'no-cache',
      variables: {
        documentId: payload.documentId,
        perPage: payload.perPage ?? null,
      },
    });

    if (!data.allDocumentRevisions) {
      throw new Error('graphql: allDocumentRevisions could not be fetched');
    }

    commit('setAllDocumentRevisionsForDocument', data);
  },

  async fetchSearchDocumentsWithSchema(
    { commit },
    payload: { term: string; schemaId?: string; page?: number },
  ): Promise<void> {
    const { data } = await this.$apolloClient.query<SearchDocumentsWithSchemaQueryResponse>({
      query: SearchDocumentsWithSchemaQuery,
      variables: { ...payload },
    });

    if (!data.searchDocuments) {
      throw new Error('graphql: searchDocumentsWithSchema could not be fetched');
    }

    commit('setSearchDocumentsWithSchema', data);
  },

  async fetchDocumentById(
    { state, commit },
    payload: { id: string; force?: boolean },
  ): Promise<void> {
    if (state.getDocument[payload.id] && !payload.force) {
      return;
    }

    const { data } = await this.$apolloClient.query<GetDocumentQueryResponse>({
      query: GetDocumentQuery,
      variables: { id: payload.id },
    });

    if (!data.getDocument) {
      throw new Error('graphql: getDocument could not be fetched');
    }

    commit('setDocument', data);
  },

  async fetchSchemaWithFieldsById(
    { state, commit },
    payload: { id: string; force?: boolean },
  ): Promise<void> {
    if (state.getSchemaWithFields[payload.id] && !payload.force) {
      return;
    }

    const { data } = await this.$apolloClient.query<GetSchemaWithFieldsQueryResponse>({
      query: GetSchemaWithFieldsQuery,
      variables: { id: payload.id },
    });

    if (!data.getSchema) {
      throw new Error('graphql: getSchema could not be fetched');
    }

    commit('setSchemaWithFields', data);
  },

  async fetchFindDocumentsBySchemaId(
    { commit },
    payload: { schemaId: string; page?: number },
  ): Promise<void> {
    const { data } = await this.$apolloClient.query<FindDocumentsQueryResponse>({
      query: FindDocumentsBySchemaIdQuery,
      variables: { id: payload.schemaId, page: payload.page ?? 1 },
    });

    if (!data.findDocuments) {
      throw new Error('graphql: allDocumentsWithSchema could not be fetched');
    }

    commit('setFindDocumentsBySchemaId', data);
  },

  async fetchFindDocumentsBySchemaIds(
    { commit },
    payload: { schemaIds: string[]; page?: number },
  ): Promise<void> {
    const { data } = await this.$apolloClient.query<FindDocumentsQueryResponse>({
      query: FindDocumentsBySchemaIdsQuery,
      variables: { ids: payload.schemaIds, page: payload.page ?? 1 },
    });

    if (!data.findDocuments) {
      throw new Error('graphql: allDocumentsWithSchema could not be fetched');
    }

    commit('setFindDocumentsBySchemaIds', data);
  },

  async fetchAvailableFields({ commit }): Promise<void> {
    const { data } = await this.$apolloClient.query<AvailableFieldsQueryResponse>({
      query: AvailableFieldsQuery,
    });

    if (!data.availableFields) {
      throw new Error('graphql: availableFields could not be fetched');
    }

    commit('setAvailableFields', data);
  },

  async fetchAllWebhooks({ commit }): Promise<void> {
    const { data } = await this.$apolloClient.query<AllWebhooksQueryResponse>({
      query: AllWebhooksQuery,
    });

    if (!data.allWebhooks) {
      throw new Error('graphql: allWebhooks could not be fetched');
    }

    commit('setAllWebhooks', data);
  },

  async fetchAllUsers({ commit }, payload = 1): Promise<void> {
    const { data } = await this.$apolloClient.query<AllUsersQueryResponse>({
      query: AllUsersQuery,
      variables: { page: payload },
    });

    if (!data.allUsers) {
      throw new Error('graphql: allUsers could not be fetched');
    }

    commit('setAllUsers', data);
  },

  async fetchUserById({ state, commit }, payload: { id: string; force?: boolean }): Promise<void> {
    if (state.getUser[payload.id] && !payload.force) {
      return;
    }

    const { data } = await this.$apolloClient.query<GetUserQueryResponse>({
      query: GetUserQuery,
      variables: { id: payload.id },
    });

    if (!data.getUser) {
      throw new Error('graphql: getUser could not be fetched');
    }

    commit('setUser', data);
  },

  async fetchAllRoles({ commit }, payload?: { page?: number; perPage?: number }): Promise<void> {
    let variables = { page: 1, perPage: 20 };

    if (payload) {
      variables = { ...variables, ...payload };
    }

    const { data } = await this.$apolloClient.query<AllRolesQueryResponse>({
      query: AllRolesQuery,
      variables,
    });

    if (!data.allRoles) {
      throw new Error('graphql: allRoles could not be fetched');
    }

    commit('setAllRoles', data);
  },

  async fetchRoleByName(
    { state, commit },
    payload: { name: string; force?: boolean },
  ): Promise<void> {
    if (state.getRole[payload.name] && !payload.force) {
      return;
    }

    const { data } = await this.$apolloClient.query<GetRoleQueryResponse>({
      query: GetRoleQuery,
      variables: { name: payload.name },
    });

    if (!data.getRole) {
      throw new Error('graphql: getRole could not be fetched');
    }

    commit('setRole', data);
  },

  async fetchAllScopes({ commit }): Promise<void> {
    const { data } = await this.$apolloClient.query<AllScopesQueryResponse>({
      query: AllScopesQuery,
    });

    if (!data.allScopes) {
      throw new Error('graphql: allScopes could not be fetched');
    }

    commit('setAllScopes', data);
  },

  async fetchFindWebhookCallsByWebhookId(
    { commit },
    payload: { webhookId: string; page?: number },
  ): Promise<void> {
    const { data } = await this.$apolloClient.query<FindWebhookCallsQueryResponse>({
      query: FindWebhookCallsByWebhookIdQuery,
      variables: { id: payload.webhookId, page: payload.page ?? 1 },
      fetchPolicy: 'no-cache',
    });

    if (!data.findWebhookCalls) {
      throw new Error('graphql: findWebhookCalls could not be fetched');
    }

    commit('setFindWebhookCallsByWebhookId', data);
  },
};

export const mutations: MutationTree<DataState> = {
  setAllSchemas(state, payload: AllSchemasQueryResponse) {
    state.allSchemas = { ...payload.allSchemas };
  },

  setAllSchemaRevisionsForSchema(state, payload: AllSchemaRevisionsQueryResponse): void {
    state.allSchemaRevisions = { ...payload.allSchemaRevisions };
  },

  setAllDocumentRevisionsForDocument(state, payload: AllDocumentRevisionsQueryResponse): void {
    state.allDocumentRevisions = { ...payload.allDocumentRevisions };
  },

  setAllDocumentsWithSchema(state, payload: AllDocumentsWithSchemaQueryResponse): void {
    state.allDocumentsWithSchema = { ...payload.allDocuments };
  },

  setSearchDocumentsWithSchema(state, payload: SearchDocumentsWithSchemaQueryResponse): void {
    state.searchDocumentsWithSchema = { ...payload.searchDocuments };
  },

  setDocument(state, payload: GetDocumentQueryResponse) {
    state.getDocument = {
      ...state.getDocument,
      [payload.getDocument.id]: {
        ...payload.getDocument,
      },
    };
  },

  setUser(state, payload: GetUserQueryResponse) {
    state.getUser = {
      ...state.getUser,
      [payload.getUser.id]: {
        ...payload.getUser,
      },
    };
  },

  setRole(state, payload: GetRoleQueryResponse) {
    state.getRole = {
      ...state.getRole,
      [payload.getRole.name]: {
        ...payload.getRole,
      },
    };
  },

  setSchemaWithFields(state, payload: GetSchemaWithFieldsQueryResponse): void {
    state.getSchemaWithFields = {
      ...state.getSchemaWithFields,
      [payload.getSchema.id]: {
        ...payload.getSchema,
      },
    };
  },

  removeSchemaWithFields(state, payload: string): void {
    Vue.delete(state.getSchemaWithFields, payload);
  },

  removeDocument(state, payload: string): void {
    Vue.delete(state.getDocument, payload);
  },

  setFindDocumentsBySchemaId(state, payload: FindDocumentsQueryResponse): void {
    state.findDocumentsBySchemaId = { ...payload.findDocuments };
  },

  setFindDocumentsBySchemaIds(state, payload: FindDocumentsQueryResponse): void {
    state.findDocumentsBySchemaIds = { ...payload.findDocuments };
  },

  setAvailableFields(state, payload: AvailableFieldsQueryResponse): void {
    state.availableFields = payload.availableFields;
  },

  setAllWebhooks(state, payload: AllWebhooksQueryResponse) {
    state.allWebhooks = { ...payload.allWebhooks };
  },

  setAllUsers(state, payload: AllUsersQueryResponse) {
    state.allUsers = { ...payload.allUsers };
  },

  setAllRoles(state, payload: AllRolesQueryResponse) {
    state.allRoles = { ...payload.allRoles };
  },

  setAllScopes(state, payload: AllScopesQueryResponse) {
    state.allScopes = { ...payload.allScopes };
  },

  setFindWebhookCallsByWebhookId(state, payload: FindWebhookCallsQueryResponse): void {
    state.findWebhookCallsByWebhookId = { ...payload.findWebhookCalls };
  },

  clearDocumentData(state, payload?: string): void {
    if (payload) {
      Vue.delete(state.getDocument, payload);
    }

    state.allDocumentsWithSchema = makeEmptyResultSet<AllDocumentsWithSchemaResultItem>();
    state.findDocumentsBySchemaId = makeEmptyResultSet<FindDocumentResultItem>();
    state.findDocumentsBySchemaIds = makeEmptyResultSet<FindDocumentResultItem>();
    state.searchDocumentsWithSchema = makeEmptyResultSet<SearchDocumentsWithSchemaResultItem>();
  },

  clearSchemaData(state, payload?: string): void {
    if (payload) {
      Vue.delete(state.getSchemaWithFields, payload);
    }

    state.allSchemas = makeEmptyResultSet<AllSchemasResultItem>();
  },

  clearUserData(state, payload?: string): void {
    if (payload) {
      Vue.delete(state.getUser, payload);
    }

    state.allUsers = makeEmptyResultSet<AllUsersResultItem>();
  },

  clearRoleData(state, payload?: string): void {
    if (payload) {
      Vue.delete(state.getRole, payload);
    }

    state.allRoles = makeEmptyResultSet<AllRolesResultItem>();
  },
};
