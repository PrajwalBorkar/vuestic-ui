import { warn } from '../../services/utils'

export const validateCounter = (value: string | number, step: number, min?: number, max?: number) => {
  const val = Number(value)
  if (!Number.isNaN(val)) {
    if (min && max) {
      if (max < min) {
        warn(`The maximum value (${max}) can not be less than the minimum value (${min}).`)
      }

      if (min > max) {
        warn(`The minimum value (${min}) can not be greater than the maximum value (${max}).`)
      }

      if ((max - min) % step !== 0) {
        warn(`Step ${step} is illegal. Counter is non-divisible (Min:Max-${min}:${max}).`)
      }
    }
    if (min && val < min) {
      warn(`The value of the counter is ${val}, the minimum value is ${min}, the value of this counter can not be less than the minimum value`)
    }
    if (max && val > max) {
      warn(`The value of the counter is ${val}, the maximum value is ${max}, the value of this counter can not be greater than the maximum value`)
    }
    if (val % step !== 0) {
      warn(`Value ${val} is not match the allowed steps (${step}).`)
    }
  } else {
    warn('The value is not a number or cannot be reduced to a number.')
  }
}
