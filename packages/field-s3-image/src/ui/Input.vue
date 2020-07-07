<template>
  <el-form-item
    :label="fieldConfig.title"
    :prop="name"
    :rules="rules"
    :class="{ 'is-error': errors.length > 0 }"
    class="dockite-field-s3-image"
  >
    <el-alert v-if="!s3Settings" title="No S3 settings found" type="error" show-icon>
      No available S3 settings were found on either the field or schema, please check to make sure
      they are configured
    </el-alert>
    <div v-else>
      <el-upload
        v-show="fieldData.length < settings.limit"
        :key="key"
        action="#"
        mutiple
        :accept="settings.acceptedExtensions.join(',')"
        :http-request="handleUpload"
        :before-upload="handleBeforeUpload"
        :limit="settings.limit"
        :show-file-list="false"
      >
        <el-button type="primary">
          Click to upload
        </el-button>
        <div slot="tip" class="el-upload__tip">
          {{ settings.acceptedExtensions.join(', ') }} files with a size less than
          {{ settings.maxSizeKB }} KB
        </div>
      </el-upload>
      <ul class="el-upload-list el-upload-list--picture">
        <li
          v-for="(file, index) in fieldData"
          :key="file.checksum"
          tabindex="0"
          class="el-upload-list__item is-success"
        >
          <img :src="file.url" :alt="file.alt" class="el-upload-list__item-thumbnail" />

          <div class="dockite-field-s3-image--item">
            <a class="el-upload-list__item-name dockite-field-s3-image--item-name">
              <i class="el-icon-document" />
              {{ file.name }} - {{ index }}
            </a>

            <el-input v-model="file.alt" size="small" placeholder="Image alt text" />
          </div>

          <label class="el-upload-list__item-status-label">
            <i class="el-icon-upload-success el-icon-check" />
          </label>

          <i class="el-icon-close" @click="handleRemoveUpload(index)" />
          <i class="el-icon-close-tip">
            press delete to remove
          </i>
        </li>
      </ul>
      <div v-for="(error, index) in errors" :key="index" class="dockite-field-s3-image--error">
        {{ error }}
      </div>
      <div class="el-form-item__description">
        {{ fieldConfig.description }}
      </div>
    </div>
  </el-form-item>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Field, Schema } from '@dockite/types';
import axios from 'axios';
import gql from 'graphql-tag';

import { S3ImageType, FieldSettings, ImageExtension, S3Settings } from '../types';

const presignURLMutation = gql`
  mutation PresignS3Object($input: PresignInput!) {
    presignS3Object(input: $input) {
      presignedUrl
      expiry
    }
  }
`;

@Component({
  name: 'S3ImageFieldInputComponent',
})
export default class S3ImageFieldInputComponent extends Vue {
  @Prop({ required: true })
  readonly name!: string;

  @Prop({ required: true })
  readonly value!: S3ImageType | S3ImageType[] | null;

  @Prop({ required: true })
  readonly formData!: object;

  @Prop({ required: true })
  readonly fieldConfig!: Field;

  @Prop({ required: true })
  readonly schema!: Schema;

  public rules: object[] = [];

  public errors: string[] = [];

  get settings(): FieldSettings {
    return this.fieldConfig.settings;
  }

  get s3Settings(): S3Settings | null {
    if (this.settings.useSchemaS3Settings && this.schema.settings.s3) {
      return this.schema.settings.s3;
    }

    if (
      this.settings.accessKey &&
      this.settings.secretAccessKey &&
      this.settings.bucket &&
      this.settings.endpoint
    ) {
      return {
        accessKey: this.settings.accessKey,
        secretAccessKey: this.settings.secretAccessKey,
        endpoint: this.settings.endpoint,
        bucket: this.settings.bucket,
      };
    }

    console.log('settings not found', JSON.stringify(this.settings));
    return null;
  }

  get key(): string {
    return 'no-upload';
  }

  get fieldData(): S3ImageType[] {
    if (this.value !== null) {
      if (Array.isArray(this.value)) {
        return this.value;
      }

      return [this.value];
    }

    return [];
  }

  set fieldData(value: S3ImageType[]) {
    if (value.length > 0) {
      if (this.settings.multiple) {
        this.$emit('input', value);
      } else {
        this.$emit('input', value.pop());
      }
    } else {
      this.$emit('input', null);
    }
  }

  async handleUpload({ file }: { file: File }) {
    try {
      const checksum = await this.getSHA256ChecksumFromFile(file);

      const { data: presignUrlData } = await this.$apolloClient.mutate({
        mutation: presignURLMutation,
        variables: {
          input: {
            ...this.s3Settings,
            object: `${this.schema.name}/${checksum.substring(0, 8)}/${file.name.toLowerCase()}`,
          },
        },
      });

      const { presignedUrl } = presignUrlData.presignS3Object;

      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      const fileUrl = presignedUrl.substring(0, presignedUrl.indexOf('?'));

      if (this.settings.multiple) {
        this.fieldData = [
          ...this.fieldData,
          {
            name: file.name,
            alt: '',
            type: file.type,
            checksum,
            size: file.size,
            url: fileUrl,
          },
        ];
      } else {
        this.fieldData = [
          {
            name: file.name,
            alt: '',
            type: file.type,
            checksum,
            size: file.size,
            url: fileUrl,
          },
        ];
      }
    } catch (err) {
      this.addError(`An error occurred whilst uploading your file: ${file.name}`);
    }
  }

  async handleBeforeUpload(file: File): Promise<void> {
    const sizeInKB = file.size / 1000;

    let hasError = false;

    console.log({ file });

    const [fileExtension] = file.name.split('.').reverse();

    if (
      !this.settings.acceptedExtensions.includes(
        `.${fileExtension.toLowerCase()}` as ImageExtension,
      )
    ) {
      this.addError(
        `The file uploaded was not in the list of allowed file types: ${this.settings.acceptedExtensions.join(
          ', ',
        )}, extension provided: .${fileExtension.toLowerCase()}`,
      );
      hasError = true;
    }

    if (sizeInKB > this.settings.maxSizeKB) {
      this.addError(
        `The image uploaded is too large. Max size: ${
          this.settings.maxSizeKB
        } KB Provided size: ${Math.ceil(sizeInKB)} KB`,
      );
      hasError = true;
    }

    if (this.settings.imageValidation) {
      const image = new Image();

      const imgPromise = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      image.src = URL.createObjectURL(file);

      await imgPromise;

      console.log(image);

      if (this.settings.minWidth && image.width < this.settings.minWidth) {
        this.addError(
          `The image uploaded must have a width of atleast ${this.settings.minWidth} pixels`,
        );
        hasError = true;
      }

      if (this.settings.maxWidth && image.width > this.settings.maxWidth) {
        this.addError(
          `The image uploaded must have a width no greater than ${this.settings.maxWidth} pixels`,
        );
        hasError = true;
      }

      if (this.settings.minHeight && image.height < this.settings.minHeight) {
        this.addError(
          `The image uploaded must have a height of atleast ${this.settings.minHeight} pixels`,
        );
        hasError = true;
      }

      if (this.settings.maxHeight && image.height > this.settings.maxHeight) {
        this.addError(
          `The image uploaded must have a height no greater than ${this.settings.maxHeight} pixels`,
        );
        hasError = true;
      }

      if (this.settings.ratio && image.width / image.height !== this.settings.ratio) {
        this.addError(`The image uploaded must have an aspect ratio of ${this.settings.ratio}`);
        hasError = true;
      }
    }

    if (hasError) {
      throw new Error('Error during beforeUpload');
    }
  }

  public handleRemoveUpload(index: number): void {
    this.fieldData = this.fieldData.filter((_, i) => i !== index);
  }

  async getSHA256ChecksumFromFile(file: File): Promise<string> {
    const checksumeArrayBuffer = await window.crypto.subtle.digest(
      'SHA-256',
      await file.arrayBuffer(),
    );

    const checksum = Array.from(new Uint8Array(checksumeArrayBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return checksum;
  }

  public addError(message: string): void {
    this.errors.unshift(message);

    window.setTimeout(() => {
      this.errors.pop();
    }, 7000);
  }

  beforeMount(): void {
    if (this.value === null) {
      // this.$emit('input', );
    }
  }
}
</script>

<style lang="scss">
.dockite-field-s3-image--item {
  display: flex;
  height: 100%;
  width: 100%;

  flex-direction: column;
  justify-content: center;
}

.dockite-field-s3-image--item-name {
  line-height: 1.2 !important;
  padding-bottom: 7px;
}

.dockite-field-s3-image--error {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
}
</style>