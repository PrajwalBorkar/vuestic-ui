<template>
  <va-dropdown
    v-model="isOpenSync"
    class="va-time-input"
    placement="bottom-start"
    trigger="none"
    anchorSelector=".va-input-wrapper__field"
    :class="$attrs.class"
    :style="$attrs.style"
    :offset="[2, 0]"
    :close-on-content-click="false"
    :stateful="false"
    :disabled="$props.disabled"
  >
    <template #anchor>
      <va-input-wrapper
        v-bind="computedInputWrapperProps"
        @click="toggleDropdown"
        @keydown.enter.stop="toggleDropdown"
        @keydown.space.stop="toggleDropdown"
      >
        <template #default>
          <input
            ref="input"
            class="va-time-input__input"
            v-bind="inputAttributesComputed"
            v-on="computedInputListeners"
            @change="onInputTextChanged"
          />
        </template>

        <template
          v-for="name in filteredSlots"
          :key="name"
          v-slot:[name]="slotScope"
        >
          <slot
            :name="name"
            v-bind="{ ...slotScope, toggleDropdown, showDropdown, hideDropdown, isOpen: isOpenSync, focus }"
          />
        </template>

        <template #prependInner="slotScope">
          <slot
            name="prependInner"
            v-bind="{ ...slotScope, toggleDropdown, showDropdown, hideDropdown, isOpen: isOpenSync, focus }"
          />
          <va-icon
            v-if="$props.leftIcon"
            role="button"
            aria-label="toggle dropdown"
            aria-hidden="false"
            :tabindex="iconTabindexComputed"
            v-bind="iconProps"
            @click.stop="showDropdown"
            @keydown.enter.stop="showDropdown"
            @keydown.space.stop="showDropdown"
          />
        </template>

        <template #icon>
          <va-icon
            v-if="canBeClearedComputed"
            role="button"
            aria-label="reset time"
            aria-hidden="false"
            :tabindex="iconTabindexComputed"
            v-bind="clearIconProps"
            @click.stop="reset"
            @keydown.enter.stop="reset"
            @keydown.space.stop="reset"
          />
          <va-icon
            v-else-if="!$props.leftIcon"
            role="button"
            class="va-dropdown__icons__reset"
            aria-label="toggle dropdown"
            aria-hidden="false"
            :tabindex="iconTabindexComputed"
            v-bind="iconProps"
            @click.stop="showDropdown"
            @keydown.enter.stop="showDropdown"
            @keydown.space.stop="showDropdown"
          />
        </template>
      </va-input-wrapper>
    </template>

    <va-dropdown-content
      no-padding
      @keydown.esc.prevent="hideDropdown"
      @keypress.enter.prevent="hideDropdown"
    >
      <va-time-picker
        ref="timePicker"
        v-bind="timePickerProps"
        v-model="modelValueSync"
      />
    </va-dropdown-content>
  </va-dropdown>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, shallowRef, nextTick } from 'vue'
import omit from 'lodash/omit'

import { extractComponentProps, filterComponentProps } from '../../utils/child-props'
import {
  useSyncProp,
  useValidation, useValidationEmits, useValidationProps, ValidationProps,
  useClearable, useClearableEmits, useClearableProps,
  useFocus, useFocusEmits,
} from '../../composables'
import { useTimeParser } from './hooks/time-text-parser'
import { useTimeFormatter } from './hooks/time-text-formatter'

import VaTimePicker from '../va-time-picker/VaTimePicker.vue'
import { VaInputWrapper } from '../va-input'
import VaIcon from '../va-icon/VaIcon.vue'
import { VaDropdown, VaDropdownContent } from '../va-dropdown'

const VaInputWrapperProps = extractComponentProps(VaInputWrapper, ['focused', 'maxLength', 'counterValue'])

export default defineComponent({
  name: 'VaTimeInput',

  components: { VaDropdown, VaDropdownContent, VaTimePicker, VaIcon, VaInputWrapper },

  emits: [
    ...useFocusEmits,
    ...useValidationEmits,
    ...useClearableEmits,
    'update:modelValue',
    'update:isOpen',
  ],

  props: {
    ...useClearableProps,
    ...VaInputWrapperProps,
    ...extractComponentProps(VaTimePicker),
    ...useValidationProps as ValidationProps<Date>,

    isOpen: { type: Boolean, default: undefined },
    modelValue: { type: Date, default: undefined },
    clearValue: { type: Date, default: undefined },
    format: { type: Function as PropType<(date?: Date) => string> },
    parse: { type: Function as PropType<(input: string) => Date> },
    manualInput: { type: Boolean, default: false },
    leftIcon: { type: Boolean, default: false },
    icon: { type: String, default: 'schedule' },
  },

  inheritAttrs: false,

  setup (props, { emit, slots, attrs }) {
    const input = shallowRef<HTMLInputElement>()
    const timePicker = shallowRef<typeof VaTimePicker>()

    const [isOpenSync] = useSyncProp('isOpen', props, emit, false)
    const [modelValueSync] = useSyncProp('modelValue', props, emit)

    const { parse, isValid } = useTimeParser(props)
    const { format } = useTimeFormatter(props)

    const valueText = computed<string>(() => format(modelValueSync.value || props.clearValue))

    const { isFocused, focus, blur, onFocus: focusListener, onBlur: blurListener } = useFocus(input)

    const onInputTextChanged = (e: Event) => {
      const val = (e.target as HTMLInputElement)?.value
      if (!val) {
        return reset()
      }

      const v = parse(val)

      if (isValid.value && v) {
        modelValueSync.value = v
      } else {
        modelValueSync.value = undefined
        isValid.value = true
      }
    }

    // --- not used yet ---
    // const changePeriod = (isPM: boolean) => {
    //   if (!modelValueSync.value) { return }

    //   const halfDayPeriod = 12
    //   const h = modelValueSync.value.getHours()

    //   if (isPM && h <= halfDayPeriod) {
    //     modelValueSync.value = new Date(modelValueSync.value.setHours(h + halfDayPeriod))
    //   } else if (!isPM && h >= halfDayPeriod) {
    //     modelValueSync.value = new Date(modelValueSync.value.setHours(h - halfDayPeriod))
    //   }
    // }

    // const changePeriodToPm = () => changePeriod(true)
    // const changePeriodToAm = () => changePeriod(false)

    const reset = (): void => {
      emit('update:modelValue', props.clearValue)
      emit('clear')
    }

    const { computedError, computedErrorMessages, listeners, validationAriaAttributes } = useValidation(props, emit, reset, focus)

    const {
      canBeCleared,
      clearIconProps,
      onFocus,
      onBlur,
    } = useClearable(props, valueText)

    const canBeClearedComputed = computed(() => (
      canBeCleared.value && valueText.value !== format(props.clearValue)
    ))

    const iconProps = computed(() => ({
      name: props.icon,
      color: props.color,
      size: 'small',
    }))

    const computedInputWrapperProps = computed(() => ({
      ...filterComponentProps(props, VaInputWrapperProps).value,
      focused: isFocused.value,
      error: computedError.value,
      errorMessages: computedErrorMessages.value,
      readonly: props.readonly || !props.manualInput,
    }))

    const computedInputListeners = computed(() => ({
      focus: () => {
        if (props.disabled) { return }

        focusListener()

        if (props.readonly) { return }
        onFocus()
        listeners.onFocus()
      },
      blur: () => {
        if (props.disabled) { return }

        blurListener()

        if (props.readonly) { return }
        onBlur()
        listeners.onBlur()
      },
    }))

    const filteredSlots = computed(() => {
      const slotsWithIcons = [
        props.leftIcon && 'prependInner',
        (!props.leftIcon || props.clearable) && 'icon',
      ]
      return Object.keys(slots).filter(slot => !slotsWithIcons.includes(slot))
    })

    const hideDropdown = () => {
      isOpenSync.value = false
      focus()
    }

    const focusTimePicker = (): void => {
      nextTick(() => timePicker.value?.focus())
    }

    const focusInputOrPicker = () => {
      isOpenSync.value ? focusTimePicker() : focus()
    }

    const checkProhibitedDropdownOpening = (e?: KeyboardEvent) => {
      if (isOpenSync.value) { return false }
      if (props.disabled || props.readonly) { return true }
      return props.manualInput && e?.code !== 'Space'
    }

    const toggleDropdown = (event: Event | KeyboardEvent) => {
      if (checkProhibitedDropdownOpening(event instanceof KeyboardEvent ? event : undefined)) { return }

      isOpenSync.value = !isOpenSync.value
      nextTick(focusInputOrPicker)
    }

    // icon interaction
    const showDropdown = () => {
      if (props.disabled || props.readonly) { return }

      isOpenSync.value = true
      nextTick(focusTimePicker)
    }

    const iconTabindexComputed = computed(() => props.disabled || props.readonly ? -1 : 0)
    const inputAttributesComputed = computed(() => ({
      readonly: props.readonly || !props.manualInput,
      tabindex: props.disabled ? -1 : 0,
      value: valueText.value,
      ariaLabel: props.label || 'selected date',
      ariaRequired: props.requiredMark,
      ariaDisabled: props.disabled,
      ariaReadOnly: props.readonly,
      ...validationAriaAttributes.value,
      ...omit(attrs, ['class', 'style']),
    }))

    return {
      input,
      timePicker,

      timePickerProps: filterComponentProps(props, extractComponentProps(VaTimePicker)),
      computedInputWrapperProps,
      computedInputListeners,
      isOpenSync,
      modelValueSync,
      valueText,
      onInputTextChanged,
      canBeClearedComputed,
      iconProps,
      clearIconProps,
      filteredSlots,
      inputAttributesComputed,
      iconTabindexComputed,

      hideDropdown,
      showDropdown,
      toggleDropdown,

      reset,
      focus,
      blur,
    }
  },
})
</script>
