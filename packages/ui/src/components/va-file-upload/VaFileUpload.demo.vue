<template>
  <VbDemo class="file-upload">
    <VbCard
      title="types"
      style="width: 100%;"
    >
      <p>list (default)</p>
      <va-file-upload v-model="basic" />
      <p>single</p>
      <va-file-upload
        v-model="single"
        type="single"
      />
      <p>gallery</p>
      <va-file-upload
        v-model="gallery"
        type="gallery"
      />
    </VbCard>
    <VbCard>
      <p>With file types</p>
      <va-file-upload
        dropzone
        v-model="withFileTypes"
        file-types=".gif,.jpg,.jpeg"
      />
    </VbCard>
    <VbCard
      title="dropzone"
      style="width: 100%;"
    >
      <p>list</p>
      <va-file-upload
        v-model="basic"
        dropzone
      />
      <p>gallery</p>
      <va-file-upload
        v-model="gallery"
        type="gallery"
        dropzone
      />
    </VbCard>
    <VbCard
      title="disabled"
      style="width: 100%;"
    >
      <va-file-upload
        v-model="basic"
        disabled
      />
    </VbCard>
    <VbCard title="default files list">
      <va-file-upload v-model="defaultFileList" />
      <va-file-upload
        v-model="defaultFileList"
        type="gallery"
      />
    </VbCard>
    <VbCard
      title="colors"
      style="width: 100%;"
    >
      <va-file-upload
        v-model="basic"
        color="info"
      />
      <va-file-upload
        v-model="gallery"
        type="gallery"
        color="success"
      />
      <va-file-upload
        v-model="basic"
        dropzone
        color="warning"
      />
    </VbCard>

    <VbCard
      title="custom drop zone and button text"
      style="width: 100%;"
    >
      <va-file-upload
        v-model="basic"
        dropzone
        drop-zone-text="Custom drop zone text"
        upload-button-text="Custom upload button text"
        color="info"
      />
    </VbCard>

    <VbCard
      title="slot"
      style="width: 100%;"
    >
      <va-file-upload
        v-model="basic"
      >
        <div class="p-4">
          <p class="mb-2">This is slot, click or drag'n'drop file to upload</p>
          <img
            src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
            width="100"
            height="100"
            alt="Slot usage"
          />
        </div>
      </va-file-upload>
    </VbCard>

    <VbCard
      title="undo"
      style="width: 100%;"
    >
      <p>list</p>
      <va-file-upload v-model="defaultFileList" undo />
      <p>gallery</p>
      <va-file-upload
        v-model="defaultFileList"
        type="gallery"
        undo
      />
    </VbCard>
    <VbCard
      title="undo with custom duration"
      style="width: 100%;"
    >
      <p>list</p>
      <va-file-upload
        v-model="defaultFileList"
        undo
        :undo-duration="10000"
      />
      <p>gallery</p>
      <va-file-upload
        v-model="defaultFileList"
        type="gallery"
        undo
        :undo-duration="10000"
      />
    </VbCard>

    <VbCard
      title="file-removed and file-added event"
      style="width: 100%;"
    >
      <va-file-upload
        v-model="basic"
        @file-removed="$vaToast.init('File removed')"
        @file-added="$vaToast.init('File added')"
      />
    </VbCard>

    <VbCard
      title="Custom undo button text; custom deleted file message"
    >
      <p>list</p>
      <va-file-upload
        v-model="defaultFileList"
        undo
        :undo-duration="10000"
        undo-button-text="Cancel"
        deleted-file-message="Woah! File just disappeared!"
      />
      <p>gallery</p>
      <va-file-upload
        v-model="defaultFileList"
        type="gallery"
        undo
        :undo-duration="10000"
        undo-button-text="Cancel"
        deleted-file-message="Woah! File just disappeared!"
      />
    </VbCard>
  </VbDemo>
</template>

<script>
import { VaFileUpload } from './index'

export default {
  components: { VaFileUpload },
  data () {
    return {
      basic: [],
      single: [],
      gallery: [],
      withFileTypes: [],
      defaultFileList: [
        {
          name: 'xxx.png',
          url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
        },
        {
          url: 'https://via.placeholder.com/150',
          size: 15000,
        },
      ],
    }
  },
}
</script>
