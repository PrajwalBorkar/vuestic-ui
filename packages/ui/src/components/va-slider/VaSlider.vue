<template>
  <div
    class="va-slider"
    :class="sliderClass"
    v-bind="ariaAttributesComputed"
  >
    <div
      v-if="vertical ? $slots.append : $slots.prepend"
      class="va-slider__input-wrapper"
      aria-hidden="true"
    >
      <slot :name="vertical ? 'append' : 'prepend'" />
    </div>
    <span
      v-if="($slots.label || label) && !invertLabel"
      class="va-input__label"
      :id="ariaLabelIdComputed"
      :style="labelStyles"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <span
      v-if="vertical ? iconAppend : iconPrepend"
      class="va-input__label"
      aria-hidden="true"
    >
      <va-icon
        :name="vertical ? iconAppend : iconPrepend"
        :color="getColor($props.color)"
        :size="16"
      />
    </span>
    <div
      ref="sliderContainer"
      class="va-slider__container"
      @mousedown="clickOnContainer"
      @mouseup="hasMouseDown = false"
      @touchstart="clickOnContainer"
    >
      <div
        class="va-slider__track"
        aria-hidden="true"
        :style="trackStyles"
      />
      <template v-if="pins">
        <div
          v-for="(pin, i) in pinsCol"
          :key="i"
          class="va-slider__mark"
          :class="{ 'va-slider__mark--active': checkActivePin(pin) }"
          :style="getPinStyles(pin)"
        />
      </template>
      <template v-if="$props.range">
        <div
          ref="process"
          class="va-slider__track va-slider__track--selected"
          aria-hidden="true"
          :class="{'va-slider__track--active': isFocused}"
          :style="processedStyles"
        />
        <div
          v-for="order in orders"
          :key="'dot' + order"
          :ref="setItemRefByIndex(order)"
          class="va-slider__handler"
          :class="dotClass"
          :style="getDottedStyles(order)"
          :tabindex="disabled || readonly ? undefined : 0"
          @focus="isFocused = true, currentSliderDotIndex = order"
          @blur="isFocused = false"
        >
          <div
            v-if="isActiveDot(order)"
            :style="{ backgroundColor: getColor($props.color) }"
            class="va-slider__handler__dot--focus"
          />
          <div
            v-if="trackLabelVisible"
            :style="labelStyles"
            class="va-slider__handler__dot--value"
          >
            <slot
              name="trackLabel"
              v-bind="{ value: getValueByOrder(order), order }"
            >
              {{ getTrackLabel(getValueByOrder(order), order) }}
            </slot>
          </div>
        </div>
      </template>
      <template v-else>
        <div
          ref="process"
          aria-hidden="true"
          class="va-slider__track va-slider__track--selected"
          :class="{'va-slider__track--active': isFocused}"
          :style="processedStyles"
        />
        <div
          ref="dot"
          class="va-slider__handler"
          :class="dotClass"
          :style="dottedStyles"
          :tabindex="$props.disabled || $props.readonly ? undefined : 0"
          @focus="isFocused = true"
          @blur="isFocused = false"
        >
          <div
            v-if="isActiveDot(0)"
            class="va-slider__handler__dot--focus"
            :style="{ backgroundColor: getColor($props.color) }"
          />
          <div
            v-if="trackLabelVisible"
            class="va-slider__handler__dot--value"
            :style="labelStyles"
          >
            <slot
              name="trackLabel"
              v-bind="{ value: getValueByOrder() }"
            >
              {{ getTrackLabel(getValueByOrder()) }}
            </slot>
          </div>
        </div>
      </template>
    </div>
    <span
      v-if="vertical ? iconPrepend : iconAppend"
      class="va-input__label--inverse"
      aria-hidden="true"
    >
      <va-icon
        :name="vertical ? iconPrepend : iconAppend"
        :color="getColor($props.color)"
        :size="16"
      />
    </span>
    <span
      v-if="($slots.label || label) && invertLabel"
      class="va-input__label va-input__label--inverse"
      :style="labelStyles"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <div
      v-if="vertical ? $slots.prepend : $slots.append"
      class="va-slider__input-wrapper"
    >
      <slot :name="vertical ? 'prepend' : 'append'" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, PropType, ref, computed, onMounted, onBeforeUnmount, shallowRef, CSSProperties } from 'vue'
import pick from 'lodash/pick.js'

import { generateUniqueId } from '../../services/utils'
import { useColors, useArrayRefs, useBem } from '../../composables'
import { validateSlider } from './validateSlider'

import { VaIcon } from '../va-icon'

export default defineComponent({
  name: 'VaSlider',
  components: { VaIcon },
  emits: ['drag-start', 'drag-end', 'change', 'update:modelValue'],
  props: {
    range: { type: Boolean, default: false },
    modelValue: ({ type: [Number, Array] as PropType<number | number[]>, default: 0 }),
    trackLabel: ({ type: [Function, String] as PropType<string | ((val: number, order?: number) => string) | undefined> }),
    color: { type: String, default: 'primary' },
    trackColor: { type: String, default: '' },
    labelColor: { type: String, default: '' },
    trackLabelVisible: { type: Boolean, default: false },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    label: { type: String, default: '' },
    invertLabel: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    pins: { type: Boolean, default: false },
    iconPrepend: { type: String, default: '' },
    iconAppend: { type: String, default: '' },
    vertical: { type: Boolean, default: false },
    showTrack: { type: Boolean, default: true },
  },
  setup (props, { emit }) {
    const { getColor, getHoverColor } = useColors()

    const sliderContainer = shallowRef<HTMLElement>()
    const dot = shallowRef<HTMLElement>()
    const { setItemRefByIndex, itemRefs: dots } = useArrayRefs()

    const isFocused = ref(false)
    const flag = ref(false)
    const offset = ref(0)
    const size = ref(0)

    // setting up initial value, don't change to `ref(props.modelValue)` because of https://github.com/epicmaxco/vuestic-ui/issues/2073
    const currentValue = ref(Array.isArray(props.modelValue) ? [...props.modelValue] : props.modelValue)

    const currentSliderDotIndex = ref(0)
    const hasMouseDown = ref(false)

    const orders = computed(() => props.vertical ? [1, 0] : [0, 1])

    const pinPositionStyle = computed(() => props.vertical ? 'bottom' : 'left')
    const trackSizeStyle = computed(() => props.vertical ? 'height' : 'width')

    const moreToLess = computed(() => Array.isArray(val.value) && (val.value[1] - props.step) < val.value[0])

    const lessToMore = computed(() => Array.isArray(val.value) && (val.value[0] + props.step) > val.value[1])

    const sliderClass = useBem('va-slider', () => ({
      ...pick(props, ['disabled', 'readonly', 'vertical']),
      active: isFocused.value,
      horizontal: !props.vertical,
      grabbing: hasMouseDown.value,
    }))

    const dotClass = useBem('va-slider__handler', () => ({
      onFocus: !props.range && (flag.value || isFocused.value),
      inactive: !isFocused.value,
    }))

    const labelStyles = computed(() => ({
      color: props.labelColor ? getColor(props.labelColor) : getColor(props.color),
    }))

    const trackStyles = computed(() => ({
      backgroundColor: props.trackColor
        ? getColor(props.trackColor)
        : getHoverColor(getColor(props.color)),
    }))

    const processedStyles = computed(() => {
      const validatedValue = limitValue(props.modelValue)

      if (Array.isArray(validatedValue)) {
        const val0 = ((validatedValue[0] - props.min) / (props.max - props.min)) * 100
        const val1 = ((validatedValue[1] - props.min) / (props.max - props.min)) * 100

        return {
          [pinPositionStyle.value]: `${val0}%`,
          [trackSizeStyle.value]: `${val1 - val0}%`,
          backgroundColor: getColor(props.color),
          visibility: props.showTrack ? 'visible' : 'hidden',
        } as CSSProperties
      } else {
        const val = ((validatedValue - props.min) / (props.max - props.min)) * 100

        return {
          [trackSizeStyle.value]: `${val}%`,
          backgroundColor: getColor(props.color),
          visibility: props.showTrack ? 'visible' : 'hidden',
        } as CSSProperties
      }
    })

    const dottedStyles = computed(() => {
      const validatedValue = limitValue(props.modelValue)

      if (Array.isArray(validatedValue)) {
        const val0 = ((validatedValue[0] - props.min) / (props.max - props.min)) * 100
        const val1 = ((validatedValue[1] - props.min) / (props.max - props.min)) * 100

        return [
          {
            [pinPositionStyle.value]: `${val0}%`,
            backgroundColor: isActiveDot(0) ? getColor(props.color) : '#ffffff',
            borderColor: getColor(props.color),
          },
          {
            [pinPositionStyle.value]: `${val1}%`,
            backgroundColor: isActiveDot(1) ? getColor(props.color) : '#ffffff',
            borderColor: getColor(props.color),
          },
        ] as CSSProperties[]
      } else {
        const val = ((validatedValue - props.min) / (props.max - props.min)) * 100

        return {
          [pinPositionStyle.value]: `${val}%`,
          backgroundColor: isActiveDot(0) ? getColor(props.color) : '#ffffff',
          borderColor: getColor(props.color),
        } as CSSProperties
      }
    })

    const getDottedStyles = (index?: number) => props.range && index !== undefined
      ? (dottedStyles.value as CSSProperties[])[index]
      : dottedStyles.value

    const val = computed({
      get: () => props.modelValue,
      set: (val) => {
        if (!props.range) {
          val = limitValue(val)
        }

        if (!flag.value) {
          emit('change', val)
        }

        emit('update:modelValue', val)
      },
    })

    const getValueByOrder = (order?: number) => props.range && order !== undefined
      ? (val.value as number[])[order]
      : val.value as number

    const gap = computed(() => {
      const total = (props.max - props.min) / props.step

      return size.value / total
    })

    const multiple = computed(() => {
      const decimals = `${props.step}`.split('.')[1]

      return decimals ? Math.pow(10, decimals.length) : 1
    })

    const pinsCol = computed(() => ((props.max - props.min) / props.step) - 1)

    const position = computed(() => {
      return Array.isArray(props.modelValue)
        ? [(props.modelValue[0] - props.min) / props.step * gap.value, (props.modelValue[1] - props.min) / props.step * gap.value]
        : ((props.modelValue - props.min) / props.step * gap.value)
    })

    const limit = computed(() => [0, size.value])

    const valueLimit = computed(() => [props.min, props.max])

    const isActiveDot = (index: number) => {
      if ((!isFocused.value && !flag.value) || props.disabled || props.readonly) {
        return false
      }

      return props.range ? currentSliderDotIndex.value === index : currentSliderDotIndex.value === 0
    }

    const moveStart = (e: MouseEvent | TouchEvent, index = currentSliderDotIndex.value) => {
      e.preventDefault() // prevent page scrolling

      if (!index) {
        if (!props.range) {
          index = 0
        } else if (Array.isArray(position.value)) {
          const touch = 'touches' in e ? e.touches[0] : e
          const pos = getPos(touch)

          index = pos > ((position.value[1] - position.value[0]) / 2 + position.value[0]) ? 1 : 0
        }
      }

      if (Array.isArray(props.modelValue)) {
        currentSliderDotIndex.value = index
      }

      Array.isArray(props.modelValue)
        ? dots.value[index]?.focus()
        : dot.value?.focus()

      flag.value = true

      emit('drag-start')
    }

    const moving = (e: TouchEvent | MouseEvent) => {
      if (!hasMouseDown.value || !flag.value || props.disabled || props.readonly) { return }

      e.preventDefault()

      if ('touches' in e) {
        setValueOnPos(getPos(e.touches[0]))
      } else {
        setValueOnPos(getPos(e))
      }
    }

    const moveEnd = () => {
      if (!props.disabled && !props.readonly) {
        if (flag.value) {
          emit('drag-end')
          emit('change', props.modelValue)
        } else {
          return false
        }

        flag.value = false
        hasMouseDown.value = false
      }
    }

    const moveWithKeys = (event: KeyboardEvent) => {
      // don't do anything if a dot isn't focused or if the slider's disabled or readonly
      if (![dots.value[0], dots.value[1], dot.value].includes(document.activeElement as HTMLElement)) {
        return
      }
      if (props.disabled || props.readonly) {
        return
      }

      /*
        where: where to move
          0 - to left
          1 - to right

        which: which dot to move (only makes sense when isRange is true)
          0 - left dot
          1 - right dot
        */
      const moveDot = (isRange: boolean, where: number, which: number) => {
        if (isRange && Array.isArray(val.value)) {
          if (!props.pins) {
            return val.value.splice(which, 1, val.value[which] + (where ? props.step : -props.step))
          }

          // how many value units one pin occupies
          const onePinInterval = (props.max - props.min) / (pinsCol.value + 1)
          // how many full pins are to the left of the dot now
          const fullPinsNow = val.value[which] / onePinInterval | 0
          // the value of the nearest pin
          let nearestPinVal = fullPinsNow * onePinInterval

          if (val.value[which] !== nearestPinVal) { // if the dot's not pinned already
            nearestPinVal += where ? onePinInterval : 0 // take one more pin if moving right
            val.value.splice(which, 1, nearestPinVal)
          } else {
            val.value.splice(which, 1, val.value[which] + (where ? props.step : -props.step))
          }
        } else {
          if (!props.pins && !Array.isArray(val.value)) {
            val.value += where ? props.step : -props.step
            return
          }

          // how many value units one pin occupies
          const onePinInterval = (props.max - props.min) / (pinsCol.value + 1)
          // how many full pins are to the left of the dot now
          const fullPinsNow = !Array.isArray(val.value) ? val.value / onePinInterval | 0 : 0
          // the value of the nearest pin
          let nearestPinVal = fullPinsNow * onePinInterval

          if (val.value !== nearestPinVal) { // if the dot's not pinned already
            nearestPinVal += where ? onePinInterval : 0 // take one more pin if moving right
            val.value = nearestPinVal
          } else {
            val.value += where ? props.step : -props.step
          }
        }
      }

      // prevent page scroll
      if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
      }

      const isActive = (el?: HTMLElement) => el === document.activeElement

      if (props.range && Array.isArray(val.value)) {
        const isVerticalDot0More = (event: KeyboardEvent) => props.vertical && isActive(dots.value[0]) && event.key === 'ArrowUp'
        const isVerticalDot0Less = (event: KeyboardEvent) => props.vertical && isActive(dots.value[0]) && event.key === 'ArrowDown'
        const isVerticalDot1More = (event: KeyboardEvent) => props.vertical && isActive(dots.value[1]) && event.key === 'ArrowUp'
        const isVerticalDot1Less = (event: KeyboardEvent) => props.vertical && isActive(dots.value[1]) && event.key === 'ArrowDown'
        const isHorizontalDot0Less = (event: KeyboardEvent) => !props.vertical && isActive(dots.value[0]) && event.key === 'ArrowLeft'
        const isHorizontalDot0More = (event: KeyboardEvent) => !props.vertical && isActive(dots.value[0]) && event.key === 'ArrowRight'
        const isHorizontalDot1Less = (event: KeyboardEvent) => !props.vertical && isActive(dots.value[1]) && event.key === 'ArrowLeft'
        const isHorizontalDot1More = (event: KeyboardEvent) => !props.vertical && isActive(dots.value[1]) && event.key === 'ArrowRight'

        switch (true) {
          case (isVerticalDot1Less(event) || isHorizontalDot1Less(event)) && moreToLess.value && val.value[0] !== props.min:
            dots.value[0]?.focus()
            moveDot(true, 0, 0)
            break
          case (isVerticalDot0More(event) || isHorizontalDot0More(event)) && lessToMore.value && val.value[1] !== props.max:
            dots.value[1]?.focus()
            moveDot(true, 1, 1)
            break
          case (isVerticalDot0Less(event) || isHorizontalDot0Less(event)) && val.value[0] !== props.min:
            moveDot(true, 0, 0)
            break
          case (isVerticalDot1More(event) || isHorizontalDot1More(event)) && val.value[1] !== props.max:
            moveDot(true, 1, 1)
            break
          case (isVerticalDot1Less(event) || isHorizontalDot1Less(event)) && val.value[1] !== props.min:
            moveDot(true, 0, 1)
            break
          case (isVerticalDot0More(event) || isHorizontalDot0More(event)) && val.value[0] !== props.max:
            moveDot(true, 1, 0)
            break
          default:
            break
        }
      } else {
        if (props.vertical) {
          if (event.key === 'ArrowDown') {
            moveDot(false, 0, 0)
          }
          if (event.key === 'ArrowUp') {
            moveDot(false, 1, 0)
          }
        } else {
          if (event.key === 'ArrowLeft') {
            moveDot(false, 0, 0)
          }
          if (event.key === 'ArrowRight') {
            moveDot(false, 1, 0)
          }
        }
      }
    }

    const checkActivePin = (pin: number) => {
      if (Array.isArray(val.value)) {
        return pin * props.step > val.value[0] && pin * props.step < val.value[1]
      } else {
        return pin * props.step < val.value
      }
    }

    const pinPositionStep = computed(() => props.step / (props.max - props.min) * 100)
    const getPinStyles = (pin: number) => ({
      backgroundColor: checkActivePin(pin) ? getColor(props.color) : getHoverColor(getColor(props.color)),
      [pinPositionStyle.value]: `${pin * pinPositionStep.value}%`,
      transition: hasMouseDown.value ? 'none' : 'var(--va-slider-pin-transition)',
    })

    const getPos = (e: MouseEvent | Touch) => {
      getStaticData()

      return props.vertical ? offset.value - e.clientY : e.clientX - offset.value
    }

    const getStaticData = () => {
      if (sliderContainer.value) {
        size.value = sliderContainer.value[props.vertical ? 'offsetHeight' : 'offsetWidth']

        offset.value = sliderContainer.value.getBoundingClientRect()[pinPositionStyle.value]
      }
    }

    const getValueByIndex = (index: number) => {
      return ((props.step * multiple.value) * index + (props.min * multiple.value)) / multiple.value
    }

    const getTrackLabel = (val: number, order?: number) => {
      if (!props.trackLabel) { return val }

      return typeof props.trackLabel === 'function'
        ? props.trackLabel(val, order)
        : props.trackLabel
    }

    const setCurrentValue = (newValue: number) => {
      const slider = currentSliderDotIndex.value

      if (Array.isArray(val.value) && Array.isArray(currentValue.value) && Array.isArray(props.modelValue)) {
        if (isDiff(currentValue.value[slider], newValue)) {
          currentValue.value.splice(slider, 1, newValue)
          if (slider === 0) {
            val.value = [currentValue.value.splice(slider, 1, newValue)[0], props.modelValue[1]]
            currentValue.value = [...val.value]
          } else {
            val.value = [props.modelValue[0], currentValue.value.splice(slider, 1, newValue)[0]]
            currentValue.value = [...val.value]
          }
        }
      } else {
        if (newValue < props.min || newValue > props.max) {
          return false
        }
        if (isDiff(currentValue.value, newValue)) {
          currentValue.value = newValue
          val.value = newValue
        }
      }
    }

    const setValueOnPos = (pixelPosition: number) => {
      const range = limit.value
      const valueRange = valueLimit.value

      // set focus on current thumb
      const dotToFocus = Array.isArray(props.modelValue)
        ? dots.value[currentSliderDotIndex.value]
        : dot.value

      dotToFocus?.focus()

      if (pixelPosition >= range[0] && pixelPosition <= range[1]) {
        if (currentSliderDotIndex.value) {
          if (Array.isArray(position.value) && Array.isArray(val.value) && pixelPosition <= position.value[0]) {
            val.value[1] = val.value[0]
            currentSliderDotIndex.value = 0
          }
          const v = getValueByIndex(Math.round(pixelPosition / gap.value))
          setCurrentValue(v)
        } else {
          if (Array.isArray(position.value) && Array.isArray(val.value) && pixelPosition >= position.value[1]) {
            val.value[0] = val.value[1]
            currentSliderDotIndex.value = 1
          }
          const v = getValueByIndex(Math.round(pixelPosition / gap.value))
          setCurrentValue(v)
        }
      } else if (pixelPosition < range[0]) {
        setCurrentValue(valueRange[0])
      } else {
        setCurrentValue(valueRange[1])
      }
    }

    const limitValue = (val: number | number[]) => {
      const inRange = (v: number) => {
        if (v < props.min) {
          return props.min
        } else if (v > props.max) {
          return props.max
        }
        return v
      }

      if (Array.isArray(val)) {
        if (val[0] >= val[1] && currentSliderDotIndex.value === 0) {
          const v = inRange(val[1])
          return [v, v]
        }
        if (val[0] >= val[1] && currentSliderDotIndex.value === 1) {
          const v = inRange(val[0])
          return [v, v]
        }
        return val.map((v) => inRange(v))
      } else {
        return inRange(val)
      }
    }

    const isDiff = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b)

    const clickOnContainer = (e: MouseEvent | TouchEvent) => {
      if (props.disabled || props.readonly) {
        return
      }

      const pos = ('touches' in e) ? getPos(e.touches[0]) : getPos(e)

      if (Array.isArray(position.value)) {
        currentSliderDotIndex.value = pos > ((position.value[1] - position.value[0]) / 2 + position.value[0]) ? 1 : 0
      }

      hasMouseDown.value = true
      setValueOnPos(pos)
      moveStart(e, currentSliderDotIndex.value)
    }

    const bindEvents = () => {
      document.addEventListener('mousemove', moving)
      document.addEventListener('touchmove', moving, { passive: false })
      document.addEventListener('mouseup', moveEnd)
      document.addEventListener('mouseleave', moveEnd)
      document.addEventListener('touchcancel', moveEnd)
      document.addEventListener('touchend', moveEnd)
      document.addEventListener('keydown', moveWithKeys)
    }

    const unbindEvents = () => {
      document.removeEventListener('mousemove', moving)
      document.removeEventListener('touchmove', moving)
      document.removeEventListener('mouseup', moveEnd)
      document.removeEventListener('mouseleave', moveEnd)
      document.removeEventListener('touchcancel', moveEnd)
      document.removeEventListener('touchend', moveEnd)
      document.removeEventListener('keydown', moveWithKeys)
    }

    const ariaLabelIdComputed = computed(() => `aria-label-id-${generateUniqueId()}`)

    const ariaAttributesComputed = computed(() => ({
      role: 'slider',
      ariaValuemin: props.min,
      ariaValuemax: props.max,
      ariaLabelledby: ariaLabelIdComputed.value,
      ariaOrientation: props.vertical ? 'vertical' : 'horizontal',
      ariaDisabled: props.disabled,
      ariaReadonly: props.readonly,
      ariaValuenow: !Array.isArray(props.modelValue) ? props.modelValue : undefined,
    }))

    onMounted(() => {
      if (validateSlider(props.modelValue, props.step, props.min, props.max, props.range)) {
        getStaticData()
        bindEvents()
      }
    })

    onBeforeUnmount(unbindEvents)

    watch([
      val,
      () => props.step,
      () => props.min,
      () => props.max,
      () => props.range,
    ], ([value, step, min, max, range]) => {
      validateSlider(value, step, min, max, range)
    })

    watch(hasMouseDown, (hasMouseDown) => {
      document.documentElement.style.cursor = hasMouseDown ? 'grabbing' : ''
    })

    return {
      getColor,
      dot,
      dots,
      setItemRefByIndex,
      orders,
      sliderContainer,
      val,
      getValueByOrder,
      sliderClass,
      dotClass,
      labelStyles,
      processedStyles,
      getPinStyles,
      dottedStyles,
      getDottedStyles,
      clickOnContainer,
      hasMouseDown,
      trackStyles,
      pinsCol,
      checkActivePin,
      isFocused,
      isActiveDot,
      getTrackLabel,
      currentSliderDotIndex,
      ariaLabelIdComputed,
      ariaAttributesComputed,
    }
  },
})
</script>

<style lang='scss'>
@import "../../styles/resources";
@import "variables";

.va-slider {
  display: var(--va-slider-display);
  align-items: var(--va-slider-align-items);
  font-family: var(--va-font-family);

  &__input-wrapper {
    position: var(--va-slider-input-wrapper-position);
    display: var(--va-slider-input-wrapper-display);
  }

  &__container {
    position: relative;
    display: flex;
    align-items: center;
    cursor: grab;
  }

  &__track {
    position: var(--va-slider-track-position);
    border-radius: var(--va-slider-track-border-radius);
    transition: var(--va-slider-track-transition);
    opacity: var(--va-slider-track-opacity);

    &--active {
      transition: 0s;
    }
  }

  &__track--selected {
    opacity: 1;
  }

  &__handler {
    position: var(--va-slider-handler-position);
    width: var(--va-slider-handler-width);
    height: var(--va-slider-handler-height);
    background: var(--va-slider-handler-background);
    border: var(--va-slider-handler-border);
    border-radius: var(--va-slider-handler-border-radius);
    outline: var(--va-slider-handler-outline);
    left: var(--va-slider-handler-left);
    transition: var(--va-slider-handler-transition);

    &__dot--focus {
      transform: var(--va-slider-dot-transform);
      display: var(--va-slider-dot-display);
      width: var(--va-slider-dot-width);
      height: var(--va-slider-dot-height);
      position: var(--va-slider-dot-position);
      border-radius: var(--va-slider-dot-border-radius);
      opacity: var(--va-slider-dot-opacity);
      pointer-events: var(--va-slider-dot-pointer-events);
    }

    &__dot--value {
      transform: var(--va-slider-dot-value-transform);
      user-select: var(--va-slider-dot-value-user-select);
      font-size: var(--va-slider-dot-value-font-size);
      letter-spacing: var(--va-slider-dot-value-letter-spacing);
      line-height: var(--va-slider-dot-value-line-height);
      font-weight: var(--va-slider-dot-value-font-weight);
      text-transform: var(--va-slider-dot-value-text-transform);
      white-space: var(--va-slider-dot-value-white-space);
    }
  }

  .va-input__label {
    user-select: var(--va-slider-input-label-user-select);
    font-size: var(--va-slider-input-label-font-size);
    letter-spacing: var(--va-slider-input-label-letter-spacing);
    line-height: var(--va-slider-input-label-line-height);
    font-weight: var(--va-slider-input-label-font-weight);
    text-transform: var(--va-slider-input-label-text-transform);
  }

  .va-input__label--inverse {
    user-select: var(--va-slider-input-label-inverse-user-select);
    font-size: var(--va-slider-input-label-inverse-font-size);
    letter-spacing: var(--va-slider-input-label-inverse-letter-spacing);
    line-height: var(--va-slider-input-label-inverse-line-height);
    font-weight: var(--va-slider-input-label-inverse-font-weight);
    text-transform: var(--va-slider-input-label-inverse-text-transform);
  }

  &--grabbing {
    .va-slider__container {
      cursor: grabbing;
    }
  }

  &--disabled {
    @include va-disabled;

    .va-slider__container {
      cursor: default;
    }
  }

  &--readonly {
    .va-slider__container {
      cursor: default;
    }
  }
}

.va-slider--horizontal {
  .va-slider__input-wrapper {
    flex-basis: var(--va-slider-horizontal-input-wrapper-flex-basis);
    flex-grow: var(--va-slider-horizontal-input-wrapper-flex-grow);
    margin-right: var(--va-slider-horizontal-input-wrapper-margin-right);

    &:last-of-type {
      margin-left: 1rem;
    }
  }

  .va-slider {
    &__container {
      width: 100%;
      height: 1.5rem;
    }

    &__track {
      height: var(--va-slider-horizontal-track-height);
      width: var(--va-slider-horizontal-track-width);
    }

    &__mark {
      position: absolute;
      width: 0.125rem;
      height: 0.75rem;
    }

    &__handler {
      transform: var(--va-slider-horizontal-handler-transform);

      &--inactive {
        transition: left 0.5s ease-out;
      }

      &__dot--value {
        position: var(--va-slider-horizontal-dot-value-position);
        top: var(--va-slider-horizontal-dot-value-top);
        left: var(--va-slider-horizontal-dot-value-left);
      }
    }
  }

  .va-input__label {
    margin-right: 1rem;
  }

  .va-input__label--inverse {
    margin-left: 1rem;
  }
}

.va-slider--vertical {
  height: var(--va-slider-vertical-height);
  padding: var(--va-slider-vertical-padding);
  flex-direction: var(--va-slider-vertical-flex-direction);
  align-items: var(--va-slider-vertical-align-items);

  .va-input__label {
    margin-bottom: var(--va-slider-vertical-label-margin-bottom);
  }

  .va-input__label--inverse {
    left: var(--va-slider-vertical-label-inverse-left);
    margin-top: var(--va-slider-vertical-label-inverse-margin-top);
  }

  .va-slider {
    &__input-wrapper {
      flex-basis: var(--va-slider-vertical-input-wrapper-flex-basis);
      flex-grow: var(--va-slider-vertical-input-wrapper-flex-grow);
      max-width: var(--va-slider-vertical-input-wrapper-max-width);
      min-width: var(--va-slider-vertical-input-wrapper-min-width);
      position: var(--va-slider-vertical-input-wrapper-position);
      display: var(--va-slider-vertical-input-wrapper-display);

      &:last-of-type {
        margin-top: 1rem;
      }
    }

    &__container {
      height: 100%;
      width: 0.5rem;
    }

    &__track {
      height: var(--va-slider-vertical-track-height);
      width: var(--va-slider-vertical-track-width);
      bottom: var(--va-slider-vertical-track-bottom);
    }

    &__mark {
      position: absolute;
      width: 0.75rem;
      height: 0.125rem;
      left: -2px;
    }

    &__handler {
      transform: var(--va-slider-vertical-handler-transform);

      &--inactive {
        transition: bottom 0.5s ease-out;
      }

      &__dot--value {
        position: var(--va-slider-vertical-dot-value-position);
        top: var(--va-slider-vertical-dot-value-top);
        left: var(--va-slider-vertical-dot-value-left);
      }
    }
  }
}
</style>
