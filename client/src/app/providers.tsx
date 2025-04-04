'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '../hooks/useAuth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ChakraProvider>
  )
} 