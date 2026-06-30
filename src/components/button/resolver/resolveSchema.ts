import type { ButtonSchema, ButtonVariant, ButtonSize, ButtonRadius } from '../types/schema'
import type { ButtonClasses, ResolvedButton } from '../types/resolved'
import { BUTTON_PRESETS } from '../presets'

type RequiredSchema = Required<
    Omit<
        ButtonSchema,
        | 'label'
        | 'icon'
        | 'href'
        | 'to'
        | 'preset'
        | 'overrides'
        | 'ariaLabel'
        | 'ariaExpanded'
        | 'ariaPressed'
        | 'ariaDescribedby'
    >
>

const DEFAULT_SCHEMA: RequiredSchema = {
    variant: 'solid',
    size: 'md',
    radius: 'md',
    iconPosition: 'left',
    tag: 'button',
    type: 'button',
    target: '_self',
    fullWidth: false,
    loading: false,
    disabled: false,
    ripple: false,
    pressScale: false,
}

export function resolveButtonSchema(schema: ButtonSchema): ResolvedButton {
    const presetBase = schema.preset
        ? (BUTTON_PRESETS[schema.preset as keyof typeof BUTTON_PRESETS] ?? {})
        : {}

    const merged: ButtonSchema = {
        ...DEFAULT_SCHEMA,
        ...presetBase,
        ...schema,
        ...schema.overrides,
    }

    const isIconOnly = !!(
        merged.iconPosition === 'only' ||
        (merged.iconPosition == null && merged.icon && !merged.label)
    )
    const showLabel = !isIconOnly && !!merged.label
    const showIcon = !!merged.icon
    const isDisabled = !!(merged.disabled || merged.loading)

    const tagAttrs = computeTagAttrs(merged, isDisabled)
    const ariaAttrs = computeAriaAttrs(merged, isDisabled)
    const classes = computeClasses(merged, isIconOnly)

    return {
        tag: merged.tag!,
        attrs: { ...ariaAttrs, ...tagAttrs },
        classes,
        content: {
            label: merged.label,
            icon: merged.icon,
            iconPosition: merged.iconPosition!,
            showLabel,
            showIcon,
            showSpinner: !!merged.loading,
        },
        interaction: {
            ripple: merged.ripple!,
            pressScale: merged.pressScale!,
            isDisabled,
        },
    }
}

function computeTagAttrs(merged: ButtonSchema, isDisabled: boolean): Record<string, unknown> {
    switch (merged.tag) {
        case 'button':
            return {
                type: merged.type,
                disabled: isDisabled || undefined,
            }
        case 'a':
            return {
                href: merged.href,
                target: merged.target,
                rel: merged.target === '_blank' ? 'noopener noreferrer' : undefined,
            }
        case 'router-link':
            return { to: merged.to }
        default:
            return {}
    }
}

function computeAriaAttrs(merged: ButtonSchema, isDisabled: boolean): Record<string, unknown> {
    const aria: Record<string, unknown> = {}
    if (merged.ariaLabel) aria['aria-label'] = merged.ariaLabel
    if (merged.ariaExpanded !== undefined) aria['aria-expanded'] = merged.ariaExpanded
    if (merged.ariaPressed !== undefined) aria['aria-pressed'] = merged.ariaPressed
    if (merged.ariaDescribedby) aria['aria-describedby'] = merged.ariaDescribedby
    if (isDisabled) aria['aria-disabled'] = true
    return aria
}

function computeClasses(merged: ButtonSchema, isIconOnly: boolean): ButtonClasses {
    return {
        root: [
            'btn',
            `btn--${merged.variant}`,
            `btn--${merged.size}`,
            `btn--radius-${merged.radius}`,
            merged.preset === 'danger' ? 'btn--danger' : '',
            merged.fullWidth ? 'btn--full' : '',
            isIconOnly ? 'btn--icon-only' : '',
            merged.loading ? 'btn--loading' : '',
            merged.disabled ? 'btn--disabled' : '',
        ]
            .filter(Boolean)
            .join(' '),

        inner: 'btn__inner',
        label: 'btn__label',
        icon: 'btn__icon',
        spinner: 'btn__spinner',
    }
}
