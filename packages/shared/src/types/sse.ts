import { Deployment } from "./deployment"
import { Reservation } from "./reservation"
import { Environment } from "./environment"

export type SseEventType =
  | "connected"
  | "heartbeat"
  | "deployment.created"
  | "deployment.updated"
  | "environment.updated"
  | "reservation.created"
  | "reservation.released"
  | "error"

export interface SseConnectedEvent {
  type: "connected"
  streamId: string
  projectId: string
  serverTime: string
}

export interface SseHeartbeatEvent {
  type: "heartbeat"
  ts: string
}

export interface SseDeploymentCreatedEvent {
  type: "deployment.created"
  deployment: Deployment
}

export interface SseDeploymentUpdatedEvent {
  type: "deployment.updated"
  deploymentId: string
  environmentId: string
  status: Deployment["status"]
  finishedAt: string | null
  updatedAt: string
}

export interface SseEnvironmentUpdatedEvent {
  type: "environment.updated"
  environment: Environment
}

export interface SseReservationCreatedEvent {
  type: "reservation.created"
  reservation: Reservation
}

export interface SseReservationReleasedEvent {
  type: "reservation.released"
  reservationId: string
  environmentId: string
  releasedBy: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  releasedAt: string
}

export interface SseErrorEvent {
  type: "error"
  code: "UNAUTHORIZED" | "PROJECT_DELETED" | "INTERNAL_ERROR"
  message: string
}

export type SseEvent =
  | SseConnectedEvent
  | SseHeartbeatEvent
  | SseDeploymentCreatedEvent
  | SseDeploymentUpdatedEvent
  | SseEnvironmentUpdatedEvent
  | SseReservationCreatedEvent
  | SseReservationReleasedEvent
  | SseErrorEvent
