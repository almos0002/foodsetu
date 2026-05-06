import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Save, ShieldCheck } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { PageHeader } from '../../../components/ui/PageHeader'
import { authClient } from '../../../lib/auth-client'
import { canAccessAdmin, roleToDashboard } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/settings')({
  head: () => ({ meta: [{ title: 'Settings · Admin | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  component: AdminSettings,
})

const inputCls =
  'w-full squircle border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-colors focus:border-[var(--color-ink)] focus:outline-none'

function AdminSettings() {
  const router = useRouter()
  const { user } = Route.useRouteContext()

  const [name, setName] = useState(user.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg(null)
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setNameMsg({ kind: 'err', text: 'Name must be at least 2 characters' })
      return
    }
    setSavingName(true)
    try {
      const res = await authClient.updateUser({ name: trimmed })
      if (res.error) throw new Error(res.error.message ?? 'Update failed')
      setNameMsg({ kind: 'ok', text: 'Profile updated' })
      router.invalidate()
    } catch (err) {
      setNameMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Update failed' })
    } finally {
      setSavingName(false)
    }
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg(null)
    if (newPwd.length < 8) {
      setPwdMsg({ kind: 'err', text: 'New password must be at least 8 characters' })
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ kind: 'err', text: 'Passwords do not match' })
      return
    }
    setSavingPwd(true)
    try {
      const res = await authClient.changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
      })
      if (res.error) throw new Error(res.error.message ?? 'Password change failed')
      setPwdMsg({ kind: 'ok', text: 'Password changed' })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err) {
      setPwdMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Password change failed' })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <AdminShell title="Settings" user={user}>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your admin account profile and password."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <section className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-6">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">Profile</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-3)]">
            Your display name appears in the admin audit log.
          </p>
          {nameMsg ? (
            <div className="mt-4">
              <Alert tone={nameMsg.kind === 'ok' ? 'success' : 'error'}>{nameMsg.text}</Alert>
            </div>
          ) : null}
          <form onSubmit={handleSaveName} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-2)]">
                Email
              </label>
              <input
                className={`${inputCls} cursor-not-allowed opacity-60`}
                value={user.email ?? ''}
                disabled
                readOnly
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-2)]">
                Role
              </label>
              <div className="inline-flex items-center gap-1.5 squircle bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Administrator
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-2)]">
                Display name
              </label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button type="submit" disabled={savingName} leftIcon={<Save className="h-4 w-4" />}>
              {savingName ? 'Saving…' : 'Save profile'}
            </Button>
          </form>
        </section>

        {/* Password */}
        <section className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-6">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">Password</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-3)]">
            Use at least 8 characters. You'll stay signed in on this device.
          </p>
          {pwdMsg ? (
            <div className="mt-4">
              <Alert tone={pwdMsg.kind === 'ok' ? 'success' : 'error'}>{pwdMsg.text}</Alert>
            </div>
          ) : null}
          <form onSubmit={handleChangePwd} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-2)]">
                Current password
              </label>
              <input
                type="password"
                className={inputCls}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-2)]">
                New password
              </label>
              <input
                type="password"
                className={inputCls}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-2)]">
                Confirm new password
              </label>
              <input
                type="password"
                className={inputCls}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" disabled={savingPwd} leftIcon={<Save className="h-4 w-4" />}>
              {savingPwd ? 'Updating…' : 'Change password'}
            </Button>
          </form>
        </section>
      </div>
    </AdminShell>
  )
}
