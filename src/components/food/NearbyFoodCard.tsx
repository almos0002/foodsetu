// Re-exports from the shared UI primitives. Kept as a shim so existing
// imports (`from '../food/NearbyFoodCard'`) continue to work after the
// component itself moved to `components/ui/FoodListingCard`.
export {
  formatDistance,
  formatDistanceLong,
  formatTime,
} from '../ui/FoodListingCard'
import { FoodListingCard, type FoodListingCardData } from '../ui/FoodListingCard'
import type { NearbyListing } from '../../lib/claim-server'

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
      listing={listing as FoodListingCardData}
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
