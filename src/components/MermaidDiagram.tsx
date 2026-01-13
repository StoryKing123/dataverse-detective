import { useEffect, useId, useMemo, useRef } from 'react'
import type { Theme } from '@/types'
import { cn } from '@/lib/utils'

type MermaidApi = {
  initialize: (config: unknown) => void
  render: (id: string, text: string) => Promise<{ svg: string } | string>
}

function getMermaid(): MermaidApi | null {
  return (window as unknown as { mermaid?: MermaidApi }).mermaid ?? null
}

const MERMAID_CDN_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11.12.2/dist/mermaid.min.js'

function ensureMermaidLoaded(timeoutMs: number = 15000): Promise<MermaidApi> {
  const existing = getMermaid()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Timed out loading Mermaid (${MERMAID_CDN_URL}).`))
    }, timeoutMs)

    const cleanup = () => window.clearTimeout(timer)

    const onReady = () => {
      const mermaid = getMermaid()
      if (!mermaid) return
      cleanup()
      resolve(mermaid)
    }

    const onError = () => {
      cleanup()
      reject(new Error(`Failed to load Mermaid (${MERMAID_CDN_URL}).`))
    }

    const existingScript =
      (document.querySelector('script[data-mermaid="true"]') as HTMLScriptElement | null) ??
      (document.querySelector(`script[src="${MERMAID_CDN_URL}"]`) as HTMLScriptElement | null)

    if (existingScript) {
      existingScript.addEventListener('load', onReady, { once: true })
      existingScript.addEventListener('error', onError, { once: true })
      queueMicrotask(onReady)
      return
    }

    const script = document.createElement('script')
    script.src = MERMAID_CDN_URL
    script.defer = true
    script.dataset.mermaid = 'true'
    script.addEventListener('load', onReady, { once: true })
    script.addEventListener('error', onError, { once: true })
    document.head.appendChild(script)
  })
}

export function MermaidDiagram({
  code,
  theme,
  className,
  onSvg,
}: {
  code: string
  theme: Theme
  className?: string
  onSvg?: (svg: SVGSVGElement) => void
}) {
  const renderId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const normalizedCode = useMemo(() => code.trim(), [code])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderMessage = (message: string) => {
      container.className = cn(
        'rounded-lg border border-border bg-muted/10 p-6 text-sm text-muted-foreground',
        className
      )
      container.textContent = message
    }

    const renderError = (message: string) => {
      container.className = cn(
        'rounded-lg border border-border bg-muted/10 p-3 text-sm text-muted-foreground',
        className
      )
      container.innerHTML = ''

      const title = document.createElement('div')
      title.className = 'mb-2 font-medium text-foreground'
      title.textContent = 'Unable to render diagram'

      const details = document.createElement('div')
      details.className = 'mb-3'
      details.textContent = message

      const pre = document.createElement('pre')
      pre.className = 'max-h-64 overflow-auto rounded-md bg-background p-3 text-xs text-foreground'
      pre.textContent = normalizedCode

      container.append(title, details, pre)
    }

    renderMessage('Rendering diagram...')

    let cancelled = false

    queueMicrotask(() => {
      renderMessage('Loading Mermaid...')

      void ensureMermaidLoaded()
        .then((mermaid) => {
          if (cancelled) return

          mermaid.initialize({
            startOnLoad: false,
            theme: theme === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
          })

          renderMessage('Rendering diagram...')

          return mermaid.render(renderId, normalizedCode)
        })
        .then((result) => {
          if (cancelled) return
          if (!result) return
          const svg = typeof result === 'string' ? result : result.svg
          container.className = cn('overflow-auto rounded-lg border border-border bg-background p-2', className)
          container.innerHTML = svg
          const svgElement = container.querySelector('svg')
          if (svgElement instanceof SVGSVGElement) {
            onSvg?.(svgElement)
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return
          const message = err instanceof Error ? err.message : 'Failed to render Mermaid diagram.'
          renderError(message)
        })
    })

    return () => {
      cancelled = true
    }
  }, [className, normalizedCode, onSvg, renderId, theme])

  return <div ref={containerRef} />
}
