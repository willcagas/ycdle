import type { Company } from '../lib/data'

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
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 object-contain"
        />
      )}
      <h2 className="text-lg sm:text-xl font-bold mb-1 text-black">
        {company.name}
      </h2>
      <p className="text-xs sm:text-sm text-black opacity-80 mb-2 px-2">{company.oneLiner}</p>
      <p className="text-xs text-black opacity-70 mb-2">
        Batch: {company.batch} | Status: {company.status}
      </p>
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-yc-orange hover:underline text-sm sm:text-base"
      >
        View on YC →
      </a>
    </div>
  )
}

