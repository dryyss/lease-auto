import type { Metadata } from 'next'

import { emptyMonthlies, loadOptions } from '@/components/gestion/vehicules/load'
import { VehicleForm } from '@/components/gestion/vehicules/VehicleForm'
import { isAdminUser, requireStaff } from '@/lib/gestion/session'

export const metadata: Metadata = { title: 'Ajouter un véhicule' }

export default async function NewVehiclePage() {
  const { payload, user } = await requireStaff()
  const { brands, models } = await loadOptions(payload, user)
  return (
    <VehicleForm
      initial={{
        publish: false,
        brand: null,
        model: null,
        title: '',
        reference: '',
        plate: '',
        featured: false,
        status: 'available',
        year: null,
        firstRegistration: '',
        mileage: null,
        fuel: '',
        gearbox: '',
        bodyType: '',
        powerHp: null,
        fiscalHp: null,
        doors: null,
        seats: null,
        color: '',
        co2: null,
        critAir: '',
        warrantyMonths: 12,
        price: null,
        monthlies: emptyMonthlies(),
        equipment: [],
        description: '',
        gallery: [],
      }}
      initialPhotos={[]}
      brands={brands}
      models={models}
      published={false}
      isAdmin={isAdminUser(user)}
    />
  )
}
