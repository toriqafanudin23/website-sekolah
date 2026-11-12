import type { LucideIcon } from 'lucide-react'
import { IconTile } from '@/components/ui/IconTile'

interface ProgramCardProps {
  title: string
  description: string
  icon: LucideIcon
}

/**
 * Kartu program di atas latar biru. Hover: kartu berubah jadi kuning,
 * kotak ikon berbalik warna (navy dengan ikon kuning).
 */
export function ProgramCard({ title, description, icon }: ProgramCardProps) {
  return (
    <article className="group flex h-full flex-col gap-4 border border-white/30 p-5 transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-ink motion-reduce:transition-none">
      <IconTile icon={icon} className="group-hover:bg-ink group-hover:text-accent" />
      <div>
        <h3 className="text-[21px] leading-[1.15] lg:text-[22px]">{title}</h3>
        <p className="mt-1.5 text-tint transition-colors duration-300 group-hover:text-ink/80 motion-reduce:transition-none">
          {description}
        </p>
      </div>
    </article>
  )
}
