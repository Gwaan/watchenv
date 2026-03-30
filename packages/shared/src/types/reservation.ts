import { ReservationStatus } from "../enums/reservation-status"

export interface Reservation {
  id: string
  reason: string
  status: ReservationStatus
  reservedAt: string
  releasedAt: string | null
  environmentId: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}
