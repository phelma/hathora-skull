import {
  Container,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { useHathoraContext } from '../context/GameContext'

export default function ActiveGame() {
  const { userState, user, getUserName } = useHathoraContext()
  const { players, piles, gameStage, hand } = userState

  return (
    <Container>
      <h1 className="">Active game</h1>
      <pre>{JSON.stringify(user, 0, 2)}</pre>
      <TableContainer>
        <Table size="sm" variant="striped">
          <Thead>
            <Tr>
              <Th>Points</Th>
              <Th>User</Th>
              <Th>Cards</Th>
              <Th>Pile</Th>
            </Tr>
          </Thead>
          <Tbody>
            {players.map((player, index) => {
              const isMe = user?.id === player.id
              return (
                <Tr
                  key={index}
                  border={isMe ? '2px solid green' : undefined}
                >
                  <Td>{player.points}</Td>
                  <Td>{getUserName(player.id)}</Td>
                  <Td>{player.hand.length}</Td>
                  <Td>{player.pile.length}</Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </TableContainer>

      <pre>{JSON.stringify({ userState }, 0, 2)}</pre>
    </Container>
  )
}
