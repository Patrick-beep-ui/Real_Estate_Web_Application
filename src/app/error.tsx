// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const isStaleDeployment = error.message?.includes('Failed to find Server Action')

  useEffect(() => {
    if (isStaleDeployment) {
      // Auto-reload after a short delay
      setTimeout(() => window.location.reload(), 1500)
    }
  }, [isStaleDeployment])

  if (isStaleDeployment) {
    return (
      <div>
        <p>The site was just updated. Reloading...</p>
      </div>
    )
  }

  return (
    <div>
      <p>Something went wrong.</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}