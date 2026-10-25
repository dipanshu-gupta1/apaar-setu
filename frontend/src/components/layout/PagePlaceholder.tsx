import { Icon } from '../ui/Icon'
import { PageHeader } from '../ui/PageHeader'
import type { NavItem } from './navConfig'

export function PagePlaceholder({ item }: { item: NavItem }) {
  return (
    <>
      <PageHeader title={item.title} description={item.description} />
      <section className="card empty-state">
        <Icon name={item.icon} size={28} />
        <h2>This screen is not built yet</h2>
        <p>It will be added in a later step. Nothing here is real data.</p>
      </section>
    </>
  )
}
