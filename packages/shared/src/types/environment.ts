import { Deployment } from "./deployment"
import { Reservation } from "./reservation"

export interface Environment {
  id: string
  gitlabEnvId: number | null
  slug: string
  name: string
  externalUrl: string | null
  projectId: string
  currentDeployment: Deployment | null
  activeReservation: Reservation | null
}
