const TAILWIND_PSEUDO_CLASSES = [
	'hover',
	'focus',
	'focus-within',
	'focus-visible',
	'active',
	'visited',
	'target',
	'first',
	'last',
	'only',
	'odd',
	'even',
	'first-of-type',
	'last-of-type',
	'only-of-type',
	'empty',
	'disabled',
	'checked',
	'indeterminate',
	'default',
	'required',
	'valid',
	'invalid',
	'in-range',
	'out-of-range',
	'placeholder-shown',
	'autofill',
	'read-only'
]

const TAILWIND_PSEUDO_ELEMENTS = [
	'before',
	'after',
	'placeholder',
	'file',
	'marker',
	'selection',
	'first-line',
	'first-letter'
]

const TAILWIND_RESPONSIVE_BREAKPOINTS = [
	'sm',
	'md',
	'lg',
	'xl',
	'2xl'
]

const TAILWIND_MEDIA_QUERIES = [
	'dark',
	'motion-reduce',
	'motion-safe',
	'portrait',
	'landscape',
	'print'
]

const TAILWIND_OTHER_MODIFIERS = [
	'ltr',
	'rtl',
	'open'
]

export const TAILWIND_MODIFIERS = [
	...TAILWIND_PSEUDO_CLASSES,
	...TAILWIND_PSEUDO_ELEMENTS,
	...TAILWIND_RESPONSIVE_BREAKPOINTS,
	...TAILWIND_MEDIA_QUERIES,
	...TAILWIND_OTHER_MODIFIERS
]

export default TAILWIND_MODIFIERS;