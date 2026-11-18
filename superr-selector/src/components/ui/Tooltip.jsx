import { cloneElement, useId, useState } from 'react'

const SIDE_CLASSES = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

// Wraps a single focusable child. Shows on hover and on keyboard focus.
export default function Tooltip({ label, children, side = 'top' }) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={function show() {
        setOpen(true)
      }}
      onMouseLeave={function hide() {
        setOpen(false)
      }}
      onFocus={function show() {
        setOpen(true)
      }}
      onBlur={function hide() {
        setOpen(false)
      }}
    >
      {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      {open ? (
        <span
          role="tooltip"
          id={id}
          className={
            'pointer-events-none absolute z-50 w-max max-w-[240px] rounded-lg border border-line-strong bg-panel-3 px-2.5 py-1.5 text-left text-xs font-normal normal-case leading-snug tracking-normal text-fg shadow-lg shadow-black/40 ' +
            SIDE_CLASSES[side]
          }
        >
          {label}
        </span>
      ) : null}
    </span>
  )
}
