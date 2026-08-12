import { motion } from 'motion/react'
import type { ReactNode } from 'react'

const contentTransition = {
  duration: 0.16,
  ease: [0.23, 1, 0.32, 1] as const,
}

interface AnimatedButtonContentProps {
  children: ReactNode
  state: string
}

export function AnimatedButtonContent({
  children,
  state,
}: AnimatedButtonContentProps) {
  return (
    <motion.span
      animate={{ opacity: 1, transform: 'translateY(0%)' }}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
      initial={{ opacity: 0.65, transform: 'translateY(15%)' }}
      key={state}
      transition={contentTransition}
    >
      {children}
    </motion.span>
  )
}
