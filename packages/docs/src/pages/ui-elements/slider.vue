<template>
  <docs-content :config="configComputed" />
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component'
import DocsContent from '../../components/DocsContent.vue'
import sliderConfig from '../../page-configs/ui-elements/slider/page-config'

@Options({
  name: 'DocsSlider',
  components: {
    DocsContent,
  },
})
export default class Slider extends Vue {
  get configComputed () {
    return sliderConfig
  }
}
</script>
