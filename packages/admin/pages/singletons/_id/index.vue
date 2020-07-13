<template>
  <fragment>
    <portal to="header">
      <el-row style="width: 100%" type="flex" justify="space-between" align="middle">
        <h2>
          {{ singletonName }}
        </h2>

        <el-row type="flex" align="middle">
          <el-dropdown>
            <el-button size="medium">
              Actions
              <i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>
                <router-link :to="`/singleton/${singletonId}/edit`">
                  <i class="el-icon-edit" />
                  Edit
                </router-link>
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link
                  :to="`/singleton/${singletonId}/delete`"
                  style="color: rgb(245, 108, 108)"
                >
                  <i class="el-icon-delete" />
                  Delete
                </router-link>
              </el-dropdown-item>
              <el-dropdown-item divided>
                <router-link :to="`/singletons/${singletonId}/revisions`">
                  <i class="el-icon-document-copy" />
                  Revisions
                </router-link>
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link :to="`/singletons/${singletonId}/import`">
                  <i class="el-icon-upload2" />
                  Import Singleton
                </router-link>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-row>
      </el-row>
    </portal>
    <div v-if="ready" class="singleton-document-page">
      <el-form ref="formEl" label-position="top" :model="form" @submit.native.prevent="submit">
        <el-tabs v-model="currentTab" type="border-card">
          <el-tab-pane v-for="tab in availableTabs" :key="tab" :label="tab" :name="tab">
            <component
              :is="$dockiteFieldManager[field.type].input"
              v-for="field in getFieldsByGroupName(tab)"
              :key="field.id"
              v-model="form[field.name]"
              :name="field.name"
              :field-config="field"
              :form-data="form"
            >
            </component>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <el-row type="flex" justify="space-between" align="middle" style="margin-top: 1rem;">
        <el-button type="text" @click="$router.go(-1)">
          Cancel
        </el-button>

        <el-button type="primary" @click="submit">
          Save
        </el-button>
      </el-row>
    </div>
  </fragment>
</template>

<script lang="ts">
import { Singleton, Field } from '@dockite/database';
import { Form } from 'element-ui';
import { sortBy, omit } from 'lodash';
import { Component, Vue, Watch, Ref } from 'nuxt-property-decorator';
import { Fragment } from 'vue-fragment';

import Logo from '~/components/base/logo.vue';
import * as auth from '~/store/auth';
import * as data from '~/store/data';
import * as singleton from '~/store/singleton';

@Component({
  components: {
    Fragment,
    Logo,
  },
})
export default class CreateSingletonDocumentPage extends Vue {
  public currentTab = 'Default';

  public form: Record<string, any> = {};

  public ready = false;

  @Ref()
  readonly formEl!: Form;

  get singletonId(): string {
    return this.$route.params.id;
  }

  get singletonName(): string {
    return this.singleton?.title ?? '';
  }

  get singleton(): Singleton | null {
    return this.$store.getters[`${data.namespace}/getSingletonWithFieldsById`](this.singletonId);
  }

  get fields(): Field[] {
    if (this.singleton) {
      return this.singleton.fields;
    }

    return [];
  }

  get groups(): Record<string, string[]> {
    if (this.singleton) {
      return this.singleton.groups;
    }

    return {};
  }

  get availableTabs(): string[] {
    if (this.singleton) {
      return Object.keys(this.singleton.groups);
    }

    return [];
  }

  get user(): string {
    return this.$store.getters[`${auth.namespace}/fullName`];
  }

  public getFieldsByGroupName(name: string): Field[] {
    const filteredFields = this.fields.filter(field => this.groups[name].includes(field.name));

    return sortBy(filteredFields, [i => this.groups[name].indexOf(i.name)]);
  }

  public getGroupNameFromFieldName(name: string): string {
    for (const key of Object.keys(this.groups)) {
      if (this.groups[key].includes(name)) {
        return key;
      }
    }

    return '';
  }

  public initialiseForm(): void {
    this.fields.forEach(field => {
      if (this.singleton && Object.keys(this.singleton.data).includes(field.name)) {
        Vue.set(this.form, field.name, this.singleton.data[field.name]);
      }

      if (!Object.keys(this.form).includes(field.name)) {
        Vue.set(this.form, field.name, null);
      }
    });
  }

  public fetchSingletonById(): Promise<void> {
    return this.$store.dispatch(`${data.namespace}/fetchSingletonWithFieldsById`, {
      id: this.$route.params.id,
    });
  }

  public async submit(): Promise<void> {
    try {
      if (!this.singleton) {
        throw new Error("Singleton hasn't been loaded");
      }

      await this.formEl.validate();

      await this.$store.dispatch(`${singleton.namespace}/updateSingletonAndFields`, {
        singleton: {
          ...omit(this.singleton, 'fields'),
          data: this.form,
        },
        fields: this.singleton.fields,
        deletedFields: [],
      });

      this.$message({
        message: 'Singleton updated successfully',
        type: 'success',
      });

      this.$router.push(`/singletons`);
    } catch (_) {
      // It's any's all the way down
      (this.formEl as any).fields
        .filter((f: any): boolean => f.validateState === 'error')
        .forEach((f: any): void => {
          const groupName = this.getGroupNameFromFieldName(f.prop);

          this.$message({
            message: `${groupName}: ${f.validateMessage}`,
            type: 'warning',
          });
        });
    }
  }

  @Watch('singletonId', { immediate: true })
  public async handleSingletonIdChange(): Promise<void> {
    this.ready = false;

    await this.fetchSingletonById();
    this.initialiseForm();
    this.currentTab = this.availableTabs[0];

    this.ready = true;
  }
}
</script>

<style></style>