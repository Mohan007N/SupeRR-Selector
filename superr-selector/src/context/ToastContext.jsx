import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

const TONE_STYLES = {
  success: { icon: CheckCircle2, color: 'text-good' },
  info: { icon: Info, color: 'text-info' },
  error: { icon: TriangleAlert, color: 'text-bad' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback(function dismissToast(id) {
    setToasts(function remove(list) {
      return list.filter(function keep(t) {
        return t.id !== id
      })
    })
  }, [])

  const notify = useCallback(
    function notifyToast(message, tone = 'success') {
      const id = nextId.current
      nextId.current += 1
      setToasts(function add(list) {
        return [...list, { id: id, message: message, tone: tone }]
      })
      setTimeout(function autoDismiss() {
        dismiss(id)
      }, 4500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map(function renderToast(t) {
            const style = TONE_STYLES[t.tone] || TONE_STYLES.info
            const Icon = style.icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line-strong bg-panel-2 p-3 shadow-lg shadow-black/30"
              >
                <Icon className={'mt-0.5 h-4 w-4 shrink-0 ' + style.color} aria-hidden="true" />
                <p className="flex-1 text-[13px] text-fg">{t.message}</p>
                <button
                  type="button"
                  onClick={function onClose() {
                    dismiss(t.id)
                  }}
                  className="rounded p-0.5 text-muted hover:text-fg"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const notify = useContext(ToastContext)
  if (notify === null) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return notify
}
