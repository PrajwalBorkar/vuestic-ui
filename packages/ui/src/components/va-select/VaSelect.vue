<template>
  <va-dropdown
    ref="dropdown"
    class="va-select__dropdown va-select-dropdown"
    trigger="none"
    anchorSelector=".va-input-wrapper__field"
    :aria-label="`select option (currently selected: ${$props.modelValue})`"
    :placement="$props.placement"
    :disabled="$props.disabled"
    :max-height="$props.maxHeight"
    :fixed="$props.fixed"
    :close-on-content-click="closeOnContentClick"
    :stateful="false"
    :offset="[1, 0]"
    keep-anchor-width
    v-model="showDropdownContentComputed"
    @keydown.up.stop.prevent="showDropdown"
    @keydown.down.stop.prevent="showDropdown"
    @keydown.space.stop.prevent="showDropdown"
    @keydown.enter.stop.prevent="showDropdown"
    @click.prevent="onSelectClick"
  >
    <template #anchor>
      <va-input-wrapper
        ref="input"
        class="va-select"
        :model-value="valueComputedString"
        :success="$props.success"
        :error="computedError"
        :color="$props.color"
        :label="$props.label"
        :loading="$props.loading"
        :disabled="$props.disabled"
        :outline="$props.outline"
        :bordered="$props.bordered"
        :required-mark="$props.requiredMark"
        :messages="$props.messages"
        :error-messages="computedErrorMessages"
        :focused="isFocused"
        :tabindex="tabIndexComputed"
        @focus="onInputFocus"
        @blur="onInputBlur"
      >
        <template
          v-if="$slots.prepend"
          #prepend
        >
          <slot name="prepend" />
        </template>

        <template
          v-if="$slots.append"
          #append
        >
          <slot name="append" />
        </template>

        <template
          v-if="$slots.prependInner"
          #prependInner
        >
          <slot name="prependInner" />
        </template>

        <template #icon>
          <va-icon
            v-if="showClearIcon"
            role="button"
            aria-hidden="false"
            aria-label="reset"
            tabindex="0"
            v-bind="clearIconProps"
            @click.stop="reset"
            @keydown.enter.stop="reset"
            @keydown.space.stop="reset"
          />
        </template>

        <template #appendInner>
          <slot
            v-if="$slots.appendInner"
            name="appendInner"
          />
          <va-icon
            :color="toggleIconColor"
            :name="toggleIcon"
          />
        </template>

        <template
          #default
        >
          <span
            v-if="isPlaceholder"
            class="va-select__placeholder"
          >
            {{ $props.placeholder }}
          </span>
          <slot
            v-else
            name="content"
            v-bind="{
              valueString: valueComputedString,
              value: valueComputed,
              tabindex: tabIndexComputed,
            }"
          >
            {{ valueComputedString }}
          </slot>
        </template>
      </va-input-wrapper>
    </template>

    <!-- Stop propagation for enter keyup event, to prevent VaDropdown closing -->
    <va-dropdown-content
      class="va-select-dropdown__content"
      :style="{ width: $props.width }"
      @keyup.enter.stop="() => undefined"
      @keydown.tab.stop.prevent="() => undefined"
      @keydown.esc.prevent="hideAndFocus"
    >
      <va-input
        v-if="showSearchInput"
        ref="searchBar"
        class="va-select__input"
        placeholder="Search"
        aria-label="options filter"
        :tabindex="tabIndexComputed"
        :bordered="true"
        v-model="searchInput"
        @keydown.up.stop.prevent="hoverPreviousOption"
        @keydown.left.stop.prevent="hoverPreviousOption"
        @keydown.down.stop.prevent="hoverNextOption"
        @keydown.right.stop.prevent="hoverNextOption"
        @keydown.enter.prevent="selectOrAddOption"
        @focus="hoveredOption = null"
      />
      <div class="va-select-dropdown__options-wrapper">
        <va-select-option-list
          ref="optionList"
          v-model:hoveredOption="hoveredOption"
          :style="{ maxHeight: $props.maxHeight }"
          :options="filteredOptions"
          :selected-value="valueComputed"
          :get-selected-state="checkIsOptionSelected"
          :get-text="getText"
          :get-track-by="getTrackBy"
          :get-group-by="getGroupBy"
          :search="searchInput"
          :no-options-text="$props.noOptionsText"
          :color="$props.color"
          :tabindex="tabIndexComputed"
          @select-option="selectOption"
          @no-previous-option-to-hover="focusSearchBar"
          @keydown.enter.stop.prevent="selectHoveredOption"
          @keydown.space.stop.prevent="selectHoveredOption"
          @keydown.tab.stop.prevent="searchBar && searchBar.focus()"
          @keydown="onHintedSearch"
          @scroll-bottom="onScrollBottom"
        />
      </div>
    </va-dropdown-content>
  </va-dropdown>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, watch, nextTick, Ref, shallowRef } from 'vue'

import { warn } from '../../services/utils'
import {
  useSelectableList, useSelectableListProps,
  useValidation, useValidationProps, useValidationEmits, ValidationProps,
  useFormProps,
  useLoadingProps,
  useColors,
  useMaxSelections, useMaxSelectionsProps,
  useClearableProps, useClearable, useClearableEmits,
  useFocusDeep,
} from '../../composables'

import { VaDropdown, VaDropdownContent } from '../va-dropdown'
import { VaIcon } from '../va-icon'
import { VaInput, VaInputWrapper } from '../va-input'
import { VaSelectOptionList } from './VaSelectOptionList'

import { SelectDropdownIcon, SelectOption, Placement } from './types'

export default defineComponent({
  name: 'VaSelect',

  components: {
    VaSelectOptionList,
    VaIcon,
    VaDropdown,
    VaDropdownContent,
    VaInput,
    VaInputWrapper,
  },

  emits: [
    'update:modelValue',
    'update-search',
    'create-new',
    'scroll-bottom',
    ...useValidationEmits,
    ...useClearableEmits,
  ],

  props: {
    ...useSelectableListProps,
    ...useValidationProps as ValidationProps<SelectOption>,
    ...useLoadingProps,
    ...useMaxSelectionsProps,
    ...useClearableProps,
    ...useFormProps,

    modelValue: {
      type: [String, Number, Array, Object] as PropType<SelectOption | SelectOption[]>,
      default: '',
    },

    // Dropdown placement
    placement: {
      type: String as PropType<Placement>,
      default: 'bottom',
      validator: (placement: string) => ['top', 'bottom'].includes(placement),
    },

    allowCreate: {
      type: [Boolean, String] as PropType<boolean | 'unique'>,
      default: false,
      validator: (mode: string | boolean) => [true, false, 'unique'].includes(mode),
    },

    color: { type: String, default: 'primary' },
    multiple: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
    separator: { type: String, default: ', ' },
    width: { type: String, default: '100%' },
    maxHeight: { type: String, default: '256px' },
    noOptionsText: { type: String, default: 'Items not found' },
    fixed: { type: Boolean, default: true },
    hideSelected: { type: Boolean, default: false },
    tabindex: { type: Number, default: 0 },
    dropdownIcon: {
      type: [String, Object] as PropType<string | SelectDropdownIcon>,
      default: (): SelectDropdownIcon => ({
        open: 'expand_more',
        close: 'expand_less',
      }),
      validator: (value: string | SelectDropdownIcon) => {
        if (typeof value === 'string') { return true }
        const isOpenIconString = typeof value.open === 'string'
        const isCloseIconString = typeof value.close === 'string'
        return isOpenIconString && isCloseIconString
      },
    },

    // Input style
    outline: { type: Boolean, default: false },
    bordered: { type: Boolean, default: false },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    requiredMark: { type: Boolean, default: false },
  },

  setup (props, { emit }) {
    const optionList = shallowRef<typeof VaSelectOptionList>()
    const input = shallowRef<typeof VaInput>()
    const searchBar = shallowRef<typeof VaInput>()

    const isInputFocused = useFocusDeep()
    const isFocused = computed(() => isInputFocused.value || showDropdownContent.value)

    const { getHoverColor, getColor } = useColors()
    const { getOptionByValue, getValue, getText, getTrackBy, getGroupBy } = useSelectableList(props)

    const {
      validate,
      computedError,
      computedErrorMessages,
    } = useValidation(props, emit, () => reset(), () => focus())

    const colorComputed = computed(() => getColor(props.color))
    const toggleIconColor = computed(() => props.readonly ? getHoverColor(colorComputed.value) : colorComputed.value)

    const onScrollBottom = () => {
      emit('scroll-bottom')
    }

    const searchInput = ref('')
    const showSearchInput = computed(() => props.searchable || props.allowCreate)

    watch(searchInput, (value) => {
      emit('update-search', value)
      hoveredOption.value = null
    })

    // Select value

    const valueComputed = computed<SelectOption | SelectOption[]>({
      get () {
        const value = getOptionByValue(props.modelValue)

        if (props.multiple) {
          if (!value) {
            return []
          }

          if (!Array.isArray(value)) {
            return [value]
          }

          return value.map((o) => getOptionByValue(o))
        }

        if (Array.isArray(value)) {
          warn('Model value should be a string or a number for a single Select.')

          if (value.length) {
            return value[value.length - 1]
          }
        }

        return value
      },

      set (value: SelectOption | SelectOption[]) {
        if (Array.isArray(value)) {
          emit('update:modelValue', value.map(getValue))
        } else {
          emit('update:modelValue', getValue(value))
        }
      },
    })

    const valueComputedString = computed<string>(() => {
      if (!valueComputed.value) { return props.clearValue }
      if (typeof valueComputed.value === 'string' || typeof valueComputed.value === 'number') { return valueComputed.value }
      if (Array.isArray(valueComputed.value)) {
        return valueComputed.value.map((value) => getText(value)).join(props.separator) || props.clearValue
      }

      return getText(valueComputed.value)
    })

    const isPlaceholder = computed(() => props.placeholder && !valueComputedString.value)

    // Icons

    const {
      canBeCleared,
      clearIconProps,
      onFocus,
      onBlur,
    } = useClearable(props, valueComputed)

    const showClearIcon = computed(() => {
      if (!canBeCleared.value) { return false }
      if (props.multiple && Array.isArray(valueComputed.value)) { return !!valueComputed.value.length }
      return true
    })

    const toggleIcon = computed(() => {
      if (!props.dropdownIcon) { return '' }

      if (typeof props.dropdownIcon === 'string') {
        return props.dropdownIcon
      }

      return showDropdownContent.value ? props.dropdownIcon.close : props.dropdownIcon.open
    })

    // Options

    const filteredOptions = computed(() => {
      if (!props.options) { return [] }

      if (props.hideSelected) {
        return props.options.filter((option) => !checkIsOptionSelected(option))
      }

      return props.options
    })

    const checkIsOptionSelected = (option: SelectOption) => {
      if (!valueComputed.value) { return false }

      if (Array.isArray(valueComputed.value)) {
        return !!valueComputed.value.find((valueItem) => compareOptions(valueItem, option))
      }

      return compareOptions(valueComputed.value, option)
    }

    const compareOptions = (option1: SelectOption, option2: SelectOption) => {
      const one = getValue(option1)
      const two = getValue(option2)

      // identity check works nice for strings and exact matches.
      if (one === two) {
        return true
      }
      if (typeof one === 'string' && typeof two === 'string') {
        return one === two
      }
      if (one === null || two === null) {
        return false
      }
      if (typeof one === 'object' && typeof two === 'object') {
        return getTrackBy(one) === getTrackBy(two)
      }

      return false
    }

    const isValueComputedArray = (v: Ref<SelectOption | SelectOption[]>): v is Ref<SelectOption[]> => Array.isArray(v.value)

    const selectOption = (option: SelectOption) => {
      if (hoveredOption.value === null) {
        hideAndFocus()
        return
      }

      if (showSearchInput.value) {
        searchInput.value = ''
      }

      if (props.multiple && isValueComputedArray(valueComputed)) {
        const { exceedsMaxSelections, addOption } = useMaxSelections(valueComputed, ref(props.maxSelections), emit)

        const isSelected = checkIsOptionSelected(getValue(option))

        if (isSelected) {
          // Unselect
          valueComputed.value = valueComputed.value.filter((optionSelected) => !compareOptions(getValue(option), getValue(optionSelected)))
        } else {
          if (exceedsMaxSelections()) { return }
          addOption(getValue(option))
        }
      } else {
        valueComputed.value = typeof option === 'string' || typeof option === 'number' ? option : { ...option }
        hideAndFocus()
      }
    }

    const addNewOption = () => {
      // Do not emit if option already exist and allow create is `unique`
      const hasAddedOption = props.options?.some((option: SelectOption) => getText(option) === searchInput.value)

      if (!(props.allowCreate === 'unique' && hasAddedOption)) {
        emit('create-new', searchInput.value)
        searchInput.value = ''
      }
    }

    // Hovered options

    const hoveredOption = ref<SelectOption | null>(null)

    const selectHoveredOption = () => {
      if (!hoveredOption.value) { return }

      if (!showDropdownContent.value) {
        // We can not select options if they are hidden
        showDropdown()
        return
      }

      selectOption(hoveredOption.value)
    }

    const selectOrAddOption = () => {
      const allowedToCreate = !!props.allowCreate && searchInput.value !== ''

      if (hoveredOption.value !== null) {
        selectHoveredOption()
      } else if (allowedToCreate) {
        addNewOption()
      }
    }

    const hoverPreviousOption = () => {
      optionList.value?.hoverPreviousOption()
    }

    const hoverNextOption = () => {
      optionList.value?.hoverNextOption()
    }

    // Dropdown content

    const showDropdownContent = ref(false)

    const showDropdownContentComputed = computed({
      get: () => showDropdownContent.value,
      set: (show: boolean) => {
        show ? showDropdown() : hideDropdown()
      },
    })

    const closeOnContentClick = computed(() => {
      return !(props.multiple || props.searchable || props.allowCreate)
    })

    const showDropdown = () => {
      if (props.disabled || props.readonly) { return }

      showDropdownContent.value = true
      scrollToSelected()
      focusSearchOrOptions()
    }

    const hideDropdown = () => {
      showDropdownContent.value = false
      searchInput.value = ''
      validate()
    }

    const toggleDropdown = () => {
      if (showDropdownContent.value) {
        hideAndFocus()
      } else {
        showDropdown()
      }
    }

    const onSelectClick = () => {
      if (props.disabled || props.readonly) { return }
      toggleDropdown()
    }

    const hideAndFocus = () => {
      hideDropdown()
      isInputFocused.value = true
    }

    const focusSearchBar = () => {
      searchBar.value?.focus()
    }

    const focusOptionList = () => {
      optionList.value?.focus()
      !props.modelValue && optionList.value?.hoverFirstOption()
    }

    const focusSearchOrOptions = () => nextTick(() => {
      if (showSearchInput.value) {
        focusSearchBar()
      } else {
        focusOptionList()
      }
    })

    const onInputFocus = () => {
      isInputFocused.value = true
      onFocus()
    }

    const onInputBlur = () => {
      if (showDropdownContentComputed.value) { return }

      onBlur()

      isInputFocused.value
        ? isInputFocused.value = false
        : validate()
    }

    /** @public */
    const focus = () => {
      if (props.disabled) { return }
      input.value?.focus()
    }

    /** @public */
    const blur = () => {
      if (showDropdownContentComputed.value) {
        showDropdownContentComputed.value = false
      }

      nextTick(input.value?.blur)
    }

    /** @public */
    const reset = () => {
      if (props.multiple) {
        valueComputed.value = Array.isArray(props.clearValue) ? props.clearValue : []
      } else {
        valueComputed.value = props.clearValue
      }

      searchInput.value = ''
      emit('clear')
    }

    const tabIndexComputed = computed(() => props.disabled ? -1 : props.tabindex)

    const scrollToSelected = () => {
      const selected = valueComputed.value
      const nothingSelected = typeof selected !== 'object' && Array.isArray(selected) && !selected.length

      if (nothingSelected) { return }

      const scrollTo = Array.isArray(selected) ? selected[selected.length - 1] : selected
      hoveredOption.value = scrollTo
      nextTick(() => optionList.value?.scrollToOption(scrollTo))
    }

    // Hinted search

    let hintedSearchQuery = ''
    let hintedSearchQueryTimeoutIndex!: ReturnType<typeof setTimeout>
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ']

    // Hinted search - hover option if you typing it's value on select without search-bar
    const onHintedSearch = (event: KeyboardEvent) => {
      if (navigationKeys.some(key => key === event.key)) {
        return
      }

      const isLetter: boolean = event.key.length === 1
      const isDeleteKey: boolean = event.key === 'Backspace' || event.key === 'Delete'

      clearTimeout(hintedSearchQueryTimeoutIndex)

      if (isDeleteKey) {
        // Remove last letter from query
        hintedSearchQuery = hintedSearchQuery ? hintedSearchQuery.slice(0, -1) : ''
      } else if (isLetter) {
        // Add every new letter to the query
        hintedSearchQuery += event.key
      }

      if (showSearchInput.value) {
        searchInput.value = hintedSearchQuery
        return
      }

      // Search for an option that matches the query
      if (hintedSearchQuery) {
        const appropriateOption = props.options.find(option => getText(option).toLowerCase().startsWith(hintedSearchQuery.toLowerCase()))
        if (appropriateOption) {
          hoveredOption.value = appropriateOption
        }
      }

      hintedSearchQueryTimeoutIndex = setTimeout(() => { hintedSearchQuery = '' }, 1000)
    }

    return {
      isFocused,

      input,
      optionList,
      searchBar,

      reset,
      focus,
      blur,

      onInputFocus,
      onInputBlur,
      focusOptionList,
      onSelectClick,
      focusSearchBar,
      searchInput,
      showSearchInput,
      hoveredOption,
      tabIndexComputed,
      valueComputed,
      valueComputedString,
      showClearIcon,
      toggleIcon,
      computedErrorMessages,
      computedError,
      filteredOptions,
      checkIsOptionSelected,
      closeOnContentClick,
      selectOption,
      selectOrAddOption,
      selectHoveredOption,
      hoverPreviousOption,
      hoverNextOption,
      showDropdownContentComputed,
      showDropdown,
      hideDropdown,
      hideAndFocus,
      toggleDropdown,
      toggleIconColor,
      onHintedSearch,
      getText,
      getTrackBy,
      getGroupBy,
      onScrollBottom,
      clearIconProps,
      isPlaceholder,
    }
  },
})
</script>

<style lang="scss">
@import "../../styles/resources";
@import "variables";

.va-select {
  cursor: var(--va-select-cursor);

  &__placeholder {
    color: var(--va-input-placeholder-text-color);
  }
}

.va-select-dropdown {
  .va-dropdown__anchor {
    display: block;
  }

  &__content {
    overflow: hidden;
    border-bottom-right-radius: var(--va-select-dropdown-border-radius);
    border-bottom-left-radius: var(--va-select-dropdown-border-radius);
    border-top-right-radius: 0;
    border-top-left-radius: 0;
    box-shadow: var(--va-select-box-shadow);
    padding: 0;
  }

  &__options-wrapper {
    background: var(--va-select-dropdown-background);
    overflow-y: auto;

    @include va-scroll();
  }
}
</style>
