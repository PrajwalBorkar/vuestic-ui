import { computed, onBeforeUnmount, onMounted, PropType, ref, Ref, watch } from 'vue'
import Cleave from 'cleave.js'
import { CleaveOptions } from 'cleave.js/options'

const DEFAULT_MASK_TOKENS: Record<string, Record<string, unknown>> = {
  creditCard: {
    creditCard: true,
  },
  date: {
    date: true,
    datePattern: ['d', 'm', 'Y'],
  },
  time: {
    time: true,
    timePattern: ['h', 'm'],
    timeFormat: '24',
  },
  numeral: {
    numeral: true,
    numeralThousandsGroupStyle: 'thousand',
  },
}

export const useCleaveProps = {
  mask: { type: [String, Object] as PropType<string | Record<string, number[]>>, default: '' },
  returnRaw: { type: Boolean, default: true },
  modelValue: { type: String },
}

type Props = {
  mask: string | Record<string, number[]>,
  returnRaw: boolean,
  modelValue: string | number,
}

export const useCleave = (
  element: Ref<HTMLInputElement | undefined>,
  props: Props,
  emit: (event: 'update:modelValue' | any, ...args: any[]) => any,
) => {
  const cleave = ref<Cleave>()

  const getMask = (mask: CleaveOptions | string) => {
    if (typeof mask === 'string') {
      return DEFAULT_MASK_TOKENS[mask] ? { ...DEFAULT_MASK_TOKENS[mask] } : {}
    }
    return { ...mask }
  }

  const destroyCleave = () => {
    if (cleave.value) { cleave.value.destroy() }
  }

  const initCleave = () => {
    destroyCleave()

    if (!element.value) { return }

    cleave.value = new Cleave(element.value, getMask(props.mask))
  }

  onMounted(() => { initCleave() })
  onBeforeUnmount(() => { destroyCleave() })

  watch(() => [element.value, props.mask], () => { initCleave() })

  const computedValue = computed<string | number>(() => {
    if (cleave.value) {
      if (props.returnRaw && props.modelValue === cleave.value.getRawValue()) {
        return cleave.value.getFormattedValue()
      }
    }

    return props.modelValue
  })

  const onInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value

    if (props.mask !== 'string' && !Object.keys(props.mask).length) {
      emit('update:modelValue', value)
      return
    }

    if (cleave.value) {
      cleave.value.setRawValue(value)
      if (props.returnRaw) {
        emit('update:modelValue', cleave.value.getRawValue())
        return
      }
    }

    emit('update:modelValue', value)
  }

  return {
    cleave,
    computedValue,
    onInput,
  }
}
