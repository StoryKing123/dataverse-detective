import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCcw, Scan } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Theme } from '@/types'
import { MermaidDiagram } from '@/components/MermaidDiagram'

type Transform = { x: number; y: number; scale: number }

const MIN_SCALE = 0.2
const MAX_SCALE = 3

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function zoomAroundPoint(args: {
  current: Transform
  viewportPoint: { x: number; y: number }
  nextScale: number
}): Transform {
  const { current, viewportPoint, nextScale } = args
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
  const contentX = (viewportPoint.x - current.x) / current.scale
  const contentY = (viewportPoint.y - current.y) / current.scale
  const x = viewportPoint.x - contentX * scale
  const y = viewportPoint.y - contentY * scale
  return { x, y, scale }
}

export function ErDiagramModal({
  open,
  onClose,
  title,
  code,
  theme,
  onCopy,
}: {
  open: boolean
  onClose: () => void
  title: string
  code: string
  theme: Theme
  onCopy: () => void
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [copied, setCopied] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)

  const percent = useMemo(() => `${Math.round(transform.scale * 100)}%`, [transform.scale])

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current
    const svg = svgRef.current
    if (!viewport || !svg) return

    const rect = viewport.getBoundingClientRect()
    const bbox = svg.getBBox()
    if (!Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) {
      return
    }
    const padding = 48
    const availableW = Math.max(1, rect.width - padding * 2)
    const availableH = Math.max(1, rect.height - padding * 2)
    const scale = clamp(Math.min(availableW / bbox.width, availableH / bbox.height), MIN_SCALE, MAX_SCALE)

    const x = (rect.width - bbox.width * scale) / 2 - bbox.x * scale
    const y = (rect.height - bbox.height * scale) / 2 - bbox.y * scale
    setTransform({ x, y, scale })
  }, [])

  const reset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const zoomBy = useCallback((factor: number) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const center = { x: rect.width / 2, y: rect.height / 2 }
    setTransform((current) =>
      zoomAroundPoint({
        current,
        viewportPoint: center,
        nextScale: current.scale * factor,
      })
    )
  }, [])

  const onWheel = useCallback((event: React.WheelEvent) => {
    const viewport = viewportRef.current
    if (!viewport) return

    event.preventDefault()
    const rect = viewport.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const factor = Math.exp(-event.deltaY * 0.0015)
    setTransform((current) =>
      zoomAroundPoint({
        current,
        viewportPoint: point,
        nextScale: current.scale * factor,
      })
    )
  }, [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === '+' || event.key === '=') {
        zoomBy(1.2)
        return
      }
      if (event.key === '-') {
        zoomBy(1 / 1.2)
        return
      }
      if (event.key === '0') {
        reset()
        return
      }
      if (event.key.toLowerCase() === 'f') {
        fitToViewport()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [fitToViewport, onClose, open, reset, zoomBy])

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.button !== 0) return
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.setPointerCapture(event.pointerId)
    setIsPanning(true)
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: transform.x,
      originY: transform.y,
    }
  }, [transform.x, transform.y])

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!isPanning) return
    const start = panStartRef.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    setTransform((current) => ({ ...current, x: start.originX + dx, y: start.originY + dy }))
  }, [isPanning])

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    const viewport = viewportRef.current
    if (viewport) {
      viewport.releasePointerCapture(event.pointerId)
    }
    setIsPanning(false)
    panStartRef.current = null
  }, [])

  const onSvg = useCallback((svg: SVGSVGElement) => {
    svgRef.current = svg
    const bbox = svg.getBBox()
    if (Number.isFinite(bbox.width) && Number.isFinite(bbox.height) && bbox.width > 0 && bbox.height > 0) {
      svg.style.width = `${Math.ceil(bbox.width)}px`
      svg.style.height = `${Math.ceil(bbox.height)}px`
      if (!svg.getAttribute('viewBox')) {
        svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`)
      }
    } else {
      svg.style.width = 'max-content'
      svg.style.height = 'max-content'
    }
    svg.style.maxWidth = 'none'
    svg.style.maxHeight = 'none'
    svg.style.display = 'block'
    queueMicrotask(() => fitToViewport())
  }, [fitToViewport])

  const onCopyClick = useCallback(() => {
    onCopy()
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }, [onCopy])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative z-10 flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground">
                  Scroll to zoom · Drag to pan · Press <span className="font-mono">F</span> to fit
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground sm:block">
                  {percent}
                </div>
                <Button size="sm" variant="outline" onClick={onCopyClick}>
                  Copy Mermaid
                </Button>
                {copied ? (
                  <span className="hidden text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:inline">
                    Copied
                  </span>
                ) : null}
                <Button size="icon" variant="ghost" onClick={onClose} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1 bg-muted/10">
                <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-border bg-background/90 p-2 shadow-sm backdrop-blur">
                  <Button size="icon" variant="ghost" onClick={() => zoomBy(1 / 1.2)} title="Zoom out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => zoomBy(1.2)} title="Zoom in">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <div className="h-5 w-px bg-border" />
                  <Button size="icon" variant="ghost" onClick={fitToViewport} title="Fit">
                    <Scan className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={reset} title="Reset">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  ref={viewportRef}
                  className={cn(
                    'absolute inset-0 cursor-grab overflow-hidden',
                    isPanning ? 'cursor-grabbing' : 'cursor-grab'
                  )}
                  onWheel={onWheel}
                  onDoubleClick={fitToViewport}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <div
                    className="absolute left-0 top-0 will-change-transform"
                    style={{
                      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                      transformOrigin: '0 0',
                    }}
                  >
                    <MermaidDiagram
                      code={code}
                      theme={theme}
                      onSvg={onSvg}
                      className="border-0 bg-transparent p-0 overflow-visible rounded-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-4 py-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-1 font-mono">+</span>
                  <span>Zoom in</span>
                  <span className="mx-1 text-muted-foreground/60">·</span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono">-</span>
                  <span>Zoom out</span>
                  <span className="mx-1 text-muted-foreground/60">·</span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono">0</span>
                  <span>Reset</span>
                </div>
                <div className="sm:hidden">{percent}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
