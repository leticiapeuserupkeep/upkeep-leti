'use client'

import { Fragment, useState } from 'react'
import Image from 'next/image'
import { Building2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { TextInput } from '@/app/components/ui/TextInput'
import type { CompanyProfile } from '@/app/lib/onboarding/nova-onboarding-data'

const FIELDS: { key: 'size' | 'industry' | 'location'; label: string }[] = [
  { key: 'size', label: 'Company size' },
  { key: 'industry', label: 'Industry' },
  { key: 'location', label: 'Main location' },
]

interface CompanyContextCardProps {
  company: CompanyProfile
  editing: boolean
  onSave: (company: CompanyProfile) => void
  onCancel: () => void
}

/** What Nova found about the company — confirmable as-is, or edited inline
 * without leaving the conversation. */
export function CompanyContextCard({ company, editing, onSave, onCancel }: CompanyContextCardProps) {
  const [draft, setDraft] = useState(company)

  // Layout and colors follow the Figma spec for this card.
  return (
    <div className="flex w-full max-w-[487px] flex-col gap-6 rounded-[12px] border border-[#E0E1E6] bg-[#F9F9FB] px-5 py-6">
      <div className="flex items-center gap-2">
        <Building2 size={24} strokeWidth={1.5} className="shrink-0 text-[#1C2024]" />
        {editing ? (
          <TextInput
            aria-label="Company name"
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            className="flex-1"
            autoFocus
          />
        ) : (
          <h3 className="flex-1 text-[16px] font-semibold leading-6 text-[#1C2024]">{company.name}</h3>
        )}
        {company.logo && <Image src={company.logo} alt={`${company.name} logo`} width={24} height={24} className="shrink-0 rounded-[6px]" />}
      </div>

      <div className="h-px w-full bg-[#E0E1E6]" />

      <div className="flex items-start gap-4">
        {FIELDS.map(({ key, label }, i) => (
          <Fragment key={key}>
            {i > 0 && <span className="h-[34px] w-px shrink-0 bg-[#E0E1E6]" aria-hidden />}
            <div className="flex flex-1 flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase leading-none text-[#8B8D98]">{label}</span>
              <div>
                {editing ? (
                  <TextInput aria-label={label} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
                ) : (
                  <span className="block whitespace-nowrap text-[14px] leading-5 text-[#1C2024]">{company[key]}</span>
                )}
                {!editing && key === 'location' && company.moreLocations ? (
                  <span className="mt-0.5 block whitespace-nowrap text-[12px] leading-4 text-[#8B8D98]">+{company.moreLocations} locations found</span>
                ) : null}
              </div>
            </div>
          </Fragment>
        ))}
      </div>

      {editing && (
        <div className="flex justify-end gap-2 self-stretch">
          <Button variant="secondary" size="md" onClick={() => { setDraft(company); onCancel() }}>Cancel</Button>
          <Button variant="primary" size="md" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>Save changes</Button>
        </div>
      )}
    </div>
  )
}
