import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

// Button group where exactly one option is active (a radio group).
export function Segmented({ options, value, onChange, label }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg border border-line-strong bg-bg-raised p-0.5"
    >
      {options.map(function renderOption(option) {
        const optionValue = typeof option === 'string' ? option : option.value
        const optionLabel = typeof option === 'string' ? option : option.label
        const selected = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={function choose() {
              onChange(optionValue)
            }}
            className={
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors ' +
              (selected ? 'bg-accent text-bg' : 'text-muted hover:text-fg')
            }
          >
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}

// Native <select> with a visible label and the app styling.
export function SelectField({ label, value, onChange, options, className = '', hideLabel = false }) {
  const id = useId()
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'eyebrow mb-1.5 block'}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={function change(event) {
            onChange(event.target.value)
          }}
          className="field appearance-none pr-9"
        >
          {options.map(function renderOption(option) {
            return (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            )
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export function TextField({ label, value, onChange, type = 'text', placeholder, className = '', min, max, error }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow mb-1.5 block">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        onChange={function change(event) {
          onChange(event.target.value)
        }}
        className={'field ' + (error ? 'border-bad' : '')}
      />
    </div>
  )
}

export function SliderField({ label, value, onChange, min, max, step = 1, suffix = '', hint }) {
  const id = useId()
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] text-fg-soft">
          {label}
        </label>
        <span className="num text-[13px] font-medium text-fg">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={function change(event) {
          onChange(Number(event.target.value))
        }}
        aria-valuetext={value + suffix}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-panel-3 accent-[#a3e635]"
      />
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  )
}
