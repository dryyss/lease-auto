// Lance les automatisations à la main (test en local). Usage : pnpm automations
import config from '@payload-config'
import { getPayload } from 'payload'

import { runAutomations } from '@/lib/automations'

const payload = await getPayload({ config })
console.log(await runAutomations(payload))
process.exit(0)
