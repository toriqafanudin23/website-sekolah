import { useEffect, useRef, useState } from 'react'

/**
 * Menandai `inView` sekali saja, saat elemen masuk layar (dengan jarak 10% dari dasar
 * layar supaya animasi terlihat). Tanpa IntersectionObserver, elemen langsung dianggap terlihat.
 */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, inView }
}
