import type { Company } from '../lib/types'

interface CompanyRevealProps {
  company: Company;
}

export default function CompanyReveal({ company }: CompanyRevealProps) {
  const websiteUrl = `https://ycombinator.com/companies/${company.slug}`

  return (
    <div className="text-center">
      {company.smallLogoUrl && (
        <img
          src={company.smallLogoUrl}
          alt={company.name}
          className="w-20 h-20 mx-auto mb-2 object-contain"
        />
      )}
      <h2 className="text-xl font-bold mb-1 text-black">
        {company.name}
      </h2>
      <p className="text-sm text-black opacity-80 mb-2">{company.oneLiner}</p>
      <p className="text-xs text-black opacity-70 mb-2">
        Batch: {company.batch} | Status: {company.status}
      </p>
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-yc-orange hover:underline"
      >
        View on YC →
      </a>
    </div>
  )
}

