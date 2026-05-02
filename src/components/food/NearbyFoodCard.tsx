// Re-exports from the shared UI primitives. Kept as a shim so existing
// imports (`from '../food/NearbyFoodCard'`) continue to work after the
// component itself moved to `components/ui/FoodListingCard`.
import { FoodListingCard } from '../ui/FoodListingCard'
import type { NearbyListing } from '../../lib/claim-server'

export {
  formatDistance,
  formatDistanceLong,
  formatTime,
} from '../ui/FoodListingCard'

export function NearbyFoodCard({
  listing,
  busy,
  disabled,
  onClaim,
}: {
  listing: NearbyListing
  busy: boolean
  disabled: boolean
  onClaim: () => void
}) {
  return (
    <FoodListingCard
      listing={listing}
      action={{
        label: 'Claim',
        busyLabel: 'Claiming…',
        busy,
        disabled,
        onClick: onClaim,
      }}
    />
  )
}
