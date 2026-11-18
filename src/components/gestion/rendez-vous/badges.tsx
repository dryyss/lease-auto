import { Badge } from '@/components/gestion/ui'
import { APPOINTMENT_KINDS, APPOINTMENT_STATUS } from '@/lib/gestion/labels'
import type { Appointment } from '@/payload-types'

const KIND_TONE: Record<Appointment['kind'], string> = {
  'test-drive': 'bg-sky-100 text-sky-800',
  visit: 'bg-soft text-ink-2',
  delivery: 'bg-emerald-100 text-emerald-800',
}

const STATUS_TONE: Record<Appointment['status'], string> = {
  confirmed: 'bg-primary text-white',
  done: 'bg-emerald-600 text-white',
  cancelled: 'bg-line text-ink-2',
}

export const KindBadge = ({ kind }: { kind: Appointment['kind'] }) => <Badge className={KIND_TONE[kind]}>{APPOINTMENT_KINDS[kind]}</Badge>
export const StatusBadge = ({ status }: { status: Appointment['status'] }) => <Badge className={STATUS_TONE[status]}>{APPOINTMENT_STATUS[status]}</Badge>
