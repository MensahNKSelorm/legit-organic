import GoogleProvider from '@/components/providers/GoogleProvider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GoogleProvider>{children}</GoogleProvider>
}
