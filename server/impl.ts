import { Methods, Context } from "./.hathora/methods";
import { Response } from "../api/base";
import {
  Card,
  GameStage,
  Bid,
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

type InternalState = GameState;

const removeCard = (hand: Card[], card: Card) => {
  const index = hand.findIndex((c) => c === card);
  return hand.filter((_, i) => i !== index);
}

const nextTurn = (players: Player[], turn: UserId): UserId => {
  const index = players.findIndex((p) => p.id === turn);
  return players[(index + 1) % players.length].id;
}

export class Impl implements Methods<InternalState> {
  initialize(ctx: Context, request: IInitializeRequest): InternalState {
    return {
      players: [],
      stage: GameStage.FIRST,
      turn: undefined,
      winner: undefined
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    // TODO: Check if already joined
    const alreadyJoined = false // TODO:
    if (alreadyJoined) {
      return Response.error("Already joined")
    }
    state.players.push({
      id: userId,
      points: 0,
      hand: [],
      pile: []
    })

    return Response.ok();
  }
  startGame(state: InternalState, userId: UserId, ctx: Context, request: IStartGameRequest): Response {
    if (state.players.length < 2) {
      // return Response.error("Not enough players")
    }
    state.players.forEach(p => {
      p.hand = [Card.SKULL, Card.FLOWER, Card.FLOWER, Card.FLOWER],
      p.pile = []

    })
    state.stage = GameStage.FIRST,
    state.winner = undefined

    if (!state.turn) {
      const firstPlayerIndex = ctx.chance.integer({min: 0, max: state.players.length - 1})
      state.turn = state.players[firstPlayerIndex].id
    }
    return Response.ok();
  }
  placeCard(state: InternalState, userId: UserId, ctx: Context, request: IPlaceCardRequest): Response {
    const player = state.players.find(p => p.id === userId)
    if (!player) return Response.error("Player not found")

    if (state.stage === GameStage.FIRST) {
      if (player?.pile.length > 0)  return Response.error("You already placed a card")

      const hasCard = player?.hand.includes(request.card)
      if (!hasCard) return Response.error("You don't have that card")

      const user = state.players.find(p => p.id === userId)!
      user.pile.push(request.card)
      user.hand = removeCard(user.hand, request.card)

      const allPlaced = state.players.every(p => p.pile.length > 0)
      if (allPlaced) state.stage = GameStage.PLACING

      return Response.ok();

    } else if (state.stage === GameStage.PLACING) {
      if (state.turn !== userId) return Response.error("Not your turn")

      const hasCard = player?.hand.includes(request.card)
      if (!hasCard) return Response.error("You don't have that card")
      const user = state.players.find(p => p.id === userId)!
      user.pile.push(request.card)
      user.hand = removeCard(user.hand, request.card)

      state.turn = nextTurn(state.players, state.turn)

      return Response.ok();

    } else {
      return Response.error('Not in placing stage')
    }



  }
  bid(state: InternalState, userId: UserId, ctx: Context, request: IBidRequest): Response {
    if (state.stage !== GameStage.PLACING && state.stage !== GameStage.BIDDING) return Response.error("Not in bidding stage")




    return Response.ok()
  }
  pass(state: InternalState, userId: UserId, ctx: Context, request: IPassRequest): Response {
    return Response.error("Not implemented");
  }
  reveal(state: InternalState, userId: UserId, ctx: Context, request: IRevealRequest): Response {
    return Response.error("Not implemented");
  }
  getUserState(state: InternalState, userId: UserId): UserState {
    const player = state.players.find(p => p.id === userId)
    if (!player) {
      return {
        hand: [],
        players: state.players,
        turn: state.turn,
        piles: state.players.map(p => p.pile.length),
        points: 0,
        gameStage: state.stage
      }
    }
    return {
      hand: player?.hand || [],
      players: state.players,
      turn: state.turn,
      piles: state.players.map(p => p.pile.length),
      points: player.points,
      gameStage: state.stage
    };
  }
}
