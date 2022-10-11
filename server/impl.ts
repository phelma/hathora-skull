import { Methods, Context } from './.hathora/methods'
import { Response } from '../api/base'
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
} from '../api/types'

type InternalState = GameState

const removeCard = (hand: Card[], card: Card) => {
  const index = hand.findIndex((c) => c === card)
  return hand.filter((_, i) => i !== index)
}

const nextTurn = (players: Player[], turn: UserId): UserId => {
  const index = players.findIndex((p) => p.id === turn)
  return players[(index + 1) % players.length].id
}

export class Impl implements Methods<InternalState> {
  initialize(ctx: Context, request: IInitializeRequest): InternalState {
    return {
      players: [],
      stage: GameStage.FIRST,
      turn: undefined,
      winner: undefined,
    }
  }
  joinGame(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IJoinGameRequest
  ): Response {
    const alreadyJoined = state.players.find((p) => p.id === userId)
    if (alreadyJoined) return Response.error('Already joined')
    state.players.push({
      id: userId,
      points: 0,
      cards: [Card.FLOWER, Card.FLOWER, Card.FLOWER, Card.SKULL],
      hand: [],
      pile: [],
      passed: false,
      revealedPile: [],
    })

    return Response.ok()
  }
  startGame(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IStartGameRequest
  ): Response {
    if (state.stage !== GameStage.FIRST && state.stage !== GameStage.DONE)
      return Response.error('Cant start whilst game in progress')
    if (state.players.length < 2) return Response.error('Not enough players')
    state.players.forEach((p) => {
      p.hand = [...p.cards]
      p.pile = []
      p.passed = false
      p.revealedPile = []
    })
    state.stage = GameStage.FIRST
    state.winner = undefined
    state.bid = undefined

    if (!state.turn) {
      const firstPlayerIndex = ctx.chance.integer({
        min: 0,
        max: state.players.length - 1,
      })
      state.turn = state.players[firstPlayerIndex].id
    }
    return Response.ok()
  }
  placeCard(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IPlaceCardRequest
  ): Response {
    const player = state.players.find((p) => p.id === userId)
    if (!player) return Response.error('Player not found')

    if (state.stage === GameStage.FIRST) {
      if (player?.pile.length > 0)
        return Response.error('You already placed a card')

      const hasCard = player?.hand.includes(request.card)
      if (!hasCard) return Response.error("You don't have that card")

      const user = state.players.find((p) => p.id === userId)!
      user.pile.push(request.card)
      user.hand = removeCard(user.hand, request.card)

      const allPlaced = state.players.every((p) => p.pile.length > 0)
      if (allPlaced) state.stage = GameStage.PLACING

      return Response.ok()
    } else if (state.stage === GameStage.PLACING) {
      if (state.turn !== userId) return Response.error('Not your turn')

      const hasCard = player?.hand.includes(request.card)
      if (!hasCard) return Response.error("You don't have that card")
      const user = state.players.find((p) => p.id === userId)!
      user.pile.push(request.card)
      user.hand = removeCard(user.hand, request.card)

      state.turn = nextTurn(state.players, state.turn)

      return Response.ok()
    } else {
      return Response.error('Not in placing stage')
    }
  }
  bid(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IBidRequest
  ): Response {
    if (
      state.stage !== GameStage.PLACING &&
      state.stage !== GameStage.BIDDING
    ) {
      return Response.error('Not in bidding stage')
    }

    if (state.turn !== userId) return Response.error('Not your turn')

    const minBid = Math.max(0, state.bid?.count || 0) + 1
    if (request.bid < minBid)
      return Response.error(`Bid must be ${minBid} or more`)
    const totalCardsInPiles = state.players.reduce(
      (acc, p) => acc + p.pile.length,
      0
    )
    if (request.bid > totalCardsInPiles)
      return Response.error(
        'Bid must be less than total number of cards in piles'
      )

    state.bid = {
      player: userId,
      count: request.bid,
    }
    state.stage = GameStage.BIDDING
    state.turn = nextTurn(state.players, state.turn)

    if (request.bid === totalCardsInPiles) {
      state.stage = GameStage.REVEALING
      state.turn = state.bid?.player
    }

    return Response.ok()
  }
  pass(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IPassRequest
  ): Response {
    if (state.stage !== GameStage.BIDDING)
      return Response.error('Not in bidding stage')
    const player = state.players.find((p) => p.id === userId)
    if (!player) return Response.error('Player not found')

    player.passed = true

    const allPlayersPassed = state.players.filter((p) => !p.passed).length === 1
    if (allPlayersPassed) {
      state.stage = GameStage.REVEALING
      state.turn = state.bid?.player
    }

    return Response.ok()
  }

  reveal(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IRevealRequest
  ): Response {
    if (state.stage !== GameStage.REVEALING)
      return Response.error('Not in revealing stage')
    if (state.turn !== userId) return Response.error('Not your turn')

    const player = state.players.find((p) => p.id === userId)!
    if (request.user !== userId && player.pile.length > 0)
      return Response.error(
        'You must reveal cards from your own pile before anyone elses'
      )

    const revealingPlayer = state.players.find((p) => p.id === request.user)

    if (!revealingPlayer) return Response.error('Player not found')

    const revealedCard = revealingPlayer.pile.pop()

    if (revealedCard === undefined)
      return Response.error('That player has no cards left to reveal')

    revealingPlayer.revealedPile.push(revealedCard)

    if (revealedCard === Card.SKULL) {
      state.stage = GameStage.DONE
      ctx.broadcastEvent('Player turned over a Skull and loses a card')
      return Response.ok()
    }

    const totalRevealed = state.players.reduce(
      (acc, p) => acc + p.revealedPile.length,
      0
    )
    if (totalRevealed >= state.bid!.count) {
      state.winner = userId
      state.players.find((p) => p.id === userId)!.points += 1
      ctx.broadcastEvent(`Player turned over ${state.bid!.count} cards and wins the round`)
      state.stage = GameStage.DONE
    }

    return Response.ok()
  }

  getUserState(state: InternalState, userId: UserId): UserState {
    const player = state.players.find((p) => p.id === userId)
    if (!player) {
      return {
        hand: [],
        players: state.players,
        turn: state.turn,
        piles: state.players.map((p) => p.pile.length),
        gameStage: state.stage,
        bid: state.bid,
      }
    }
    return {
      hand: player?.hand || [],
      players: state.players,
      turn: state.turn,
      piles: state.players.map((p) => p.pile.length),
      gameStage: state.stage,
      bid: state.bid,
    }
  }
}
