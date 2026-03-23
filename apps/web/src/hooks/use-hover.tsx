import * as React from "react"

// ============================================================================

export function useHover<T extends HTMLElement = HTMLElement>(
  elementRef: React.RefObject<T>,
): boolean {
  const [isHovered, setIsHovered] = React.useState<boolean>(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) {
      return
    }

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    element.addEventListener("mouseenter", handleMouseEnter)
    element.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter)
      element.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [elementRef])

  return isHovered
}

// ============================================================================