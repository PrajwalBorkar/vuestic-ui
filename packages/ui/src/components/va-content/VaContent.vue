<template>
  <div class="va-content">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'VaContent',
}
</script>

<style lang="scss">
@import '../../styles/resources';
@import '../../styles/global';

.va-content {
  line-height: $line-height;
  font-family: var(--va-font-family);

  h1 {
    @include va-display(1);
  }

  h2 {
    @include va-display(2);
  }

  h3 {
    @include va-display(3);
  }

  h4 {
    @include va-display(4);
  }

  h5 {
    @include va-display(5);
  }

  h6 {
    @include va-display(6);
  }

  i {
    font-style: italic;
  }

  hr.separator {
    height: 2px;
    background-color: #eeeeee;
    border: none;
  }

  p {
    font-size: 1rem;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  pre {
    margin-bottom: 1rem;
    overflow-x: auto;
    white-space: pre;
    word-wrap: normal;

    &.code {
      @include va-code-snippet();
    }
  }

  code {
    display: inline-block;
    word-wrap: break-word;
  }

  strong {
    font-weight: $font-weight-bold;
  }

  // NOTE Ideally we want this to work with mixins too, but no idea how to achieve that :/.
  ol {
    @extend .va-ordered;
  }

  //This is kind of weird though not sure about any workaround :(
  ul:not(.va-option-list__list) {
    @extend .va-unordered;
  }

  blockquote {
    @extend .va-blockquote;
  }

  figure {
    border-radius: 0;
    border: none;
    box-sizing: border-box;
    box-shadow: $widget-box-shadow;
    word-wrap: break-word;

    figcaption {
      flex: 1 1 auto;
      padding: 1.25rem;
    }

    p:last-child {
      margin-bottom: 0;
    }
  }

  table {
    @extend .va-table;
  }

  a {
    &.link { @extend .link; }
    &.link-secondary { @extend .link-secondary; }
  }
}
</style>
