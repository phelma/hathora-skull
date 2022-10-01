import { Methods, Context } from "./.hathora/methods";
import { Response } from "../api/base";
import {
  Card,
  GameStage,
  TurnType,
  Bid,
  Turn,
  Pile,
  Player,
  GameState,
  UserState,
  UserId,
  IInitializeRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IPlaceCardRequest,
  IBidRequest,
  IPassRequest,
  IRevealRequest,
} from "../api/types";

type InternalState = UserState;

export class Impl implements Methods<InternalState> {
  initialize(ctx: Context, request: IInitializeRequest): InternalState {
    return {
      hand: [],
      players: [],
      turn: undefined,
      piles: [],
      points: 0,
      gameStage: 0,
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    return Response.error("Not implemented");
  }
  startGame(state: InternalState, userId: UserId, ctx: Context, request: IStartGameRequest): Response {
    return Response.error("Not implemented");
  }
  placeCard(state: InternalState, userId: UserId, ctx: Context, request: IPlaceCardRequest): Response {
    return Response.error("Not implemented");
  }
  bid(state: InternalState, userId: UserId, ctx: Context, request: IBidRequest): Response {
    return Response.error("Not implemented");
  }
  pass(state: InternalState, userId: UserId, ctx: Context, request: IPassRequest): Response {
    return Response.error("Not implemented");
  }
  reveal(state: InternalState, userId: UserId, ctx: Context, request: IRevealRequest): Response {
    return Response.error("Not implemented");
  }
  getUserState(state: InternalState, userId: UserId): UserState {
    return state;
  }
}
